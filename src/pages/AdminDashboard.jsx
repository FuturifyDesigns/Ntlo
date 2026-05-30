import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Users, GraduationCap, Shield, Home, Ban, Trash2, Check, X,
  RefreshCw, Eye, Radio,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useTranslation } from '../hooks/useTranslation'
import { getSignedDocUrl } from '../lib/verificationStorage'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { createUniversityFromRequest } from '../lib/adminUniversities'

const TABS = [
  { id: 'requests', icon: GraduationCap, labelKey: 'admin.tabRequests' },
  { id: 'users', icon: Users, labelKey: 'admin.tabUsers' },
  { id: 'landlords', icon: Shield, labelKey: 'admin.tabLandlords' },
  { id: 'listings', icon: Home, labelKey: 'admin.tabListings' },
]

export default function AdminDashboard() {
  const { t } = useTranslation()
  const [tab, setTab] = useState('requests')
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(true)
  const [requests, setRequests] = useState([])
  const [users, setUsers] = useState([])
  const [landlords, setLandlords] = useState([])
  const [listings, setListings] = useState([])
  const [actionError, setActionError] = useState('')

  const fetchRequests = useCallback(async () => {
    const { data } = await supabase
      .from('university_requests')
      .select('*')
      .order('created_at', { ascending: false })
    setRequests(data || [])
  }, [])

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, phone, role, is_verified, is_banned, banned_reason, verification_status, created_at')
      .order('created_at', { ascending: false })
    setUsers(data || [])
  }, [])

  const fetchLandlords = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select(`
        id, full_name, phone, verification_status, verification_notes, is_verified, created_at,
        docs:verification_documents(id, doc_type, file_name, storage_path, status, created_at)
      `)
      .eq('role', 'landlord')
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: false })
    setLandlords(data || [])
  }, [])

  const fetchListings = useCallback(async () => {
    const { data } = await supabase
      .from('listings')
      .select(`
        id, title, city, price, verification_status, verification_notes, is_verified, created_at,
        landlord:profiles(id, full_name),
        docs:verification_documents(id, doc_type, file_name, storage_path, status)
      `)
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: false })
    setListings(data || [])
  }, [])

  const refreshAll = useCallback(async () => {
    setLoading(true)
    setActionError('')
    await Promise.all([fetchRequests(), fetchUsers(), fetchLandlords(), fetchListings()])
    setLoading(false)
  }, [fetchRequests, fetchUsers, fetchLandlords, fetchListings])

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  useEffect(() => {
    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'university_requests' }, fetchRequests)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchUsers()
        fetchLandlords()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verification_documents' }, fetchLandlords)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, fetchListings)
      .subscribe((status) => setLive(status === 'SUBSCRIBED'))

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchRequests, fetchUsers, fetchLandlords, fetchListings])

  async function runAction(fn) {
    setActionError('')
    try {
      await fn()
    } catch (err) {
      setActionError(err.message || t('admin.actionFailed'))
    }
  }

  async function approveRequest(req) {
    await runAction(async () => {
      await createUniversityFromRequest(req)
      await fetchRequests()
    })
  }

  async function reviewRequest(id, status) {
    if (status === 'approved') {
      const req = requests.find((r) => r.id === id)
      if (req) await approveRequest(req)
      return
    }
    await runAction(async () => {
      const { error } = await supabase
        .from('university_requests')
        .update({ status })
        .eq('id', id)
      if (error) throw error
      await fetchRequests()
    })
  }

  async function toggleBan(userId, currentlyBanned) {
    const reason = currentlyBanned ? null : window.prompt(t('admin.banReasonPrompt'))
    if (!currentlyBanned && reason === null) return
    await runAction(async () => {
      const { error } = await supabase.rpc('admin_set_ban', {
        target_id: userId,
        banned: !currentlyBanned,
        reason: reason || null,
      })
      if (error) throw error
      await fetchUsers()
    })
  }

  async function deleteUser(userId, name) {
    if (!window.confirm(t('admin.deleteConfirm', { name }))) return
    await runAction(async () => {
      const { error } = await supabase.rpc('admin_delete_user', { target_id: userId })
      if (error) throw error
      await fetchUsers()
    })
  }

  async function reviewLandlord(userId, approved) {
    const notes = window.prompt(approved ? t('admin.approveNotes') : t('admin.rejectNotes')) || null
    await runAction(async () => {
      const { error } = await supabase.rpc('admin_review_landlord', {
        target_id: userId,
        approved,
        notes,
      })
      if (error) throw error
      await fetchLandlords()
      await fetchUsers()
    })
  }

  async function reviewListing(listingId, approved) {
    const notes = window.prompt(approved ? t('admin.approveNotes') : t('admin.rejectNotes')) || null
    await runAction(async () => {
      const { error } = await supabase.rpc('admin_review_listing', {
        target_listing_id: listingId,
        approved,
        notes,
      })
      if (error) throw error
      await fetchListings()
    })
  }

  async function viewDoc(storagePath) {
    try {
      const url = await getSignedDocUrl(storagePath)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setActionError(err.message)
    }
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8"
    >
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">{t('admin.title')}</h1>
          <p className="mt-2 flex items-center gap-2 text-muted">
            <Radio size={14} className={live ? 'text-success' : 'text-muted'} />
            {live ? t('admin.liveConnected') : t('admin.liveDisconnected')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshAll}>
          <RefreshCw size={14} />
          {t('admin.refresh')}
        </Button>
      </div>

      {actionError && (
        <div className="mb-4 rounded-lg border border-error/30 bg-error/5 px-4 py-2 text-sm text-error">
          {actionError}
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map(({ id, icon: Icon, labelKey }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              tab === id ? 'bg-primary text-white' : 'border border-border bg-surface text-muted'
            }`}
          >
            <Icon size={16} />
            {t(labelKey)}
            {id === 'requests' && pendingRequests.length > 0 && (
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-white">
                {pendingRequests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : (
        <>
          {tab === 'requests' && (
            <div className="space-y-4">
              {pendingRequests.length === 0 ? (
                <Card className="p-8 text-center text-muted">{t('admin.noPendingRequests')}</Card>
              ) : (
                pendingRequests.map((req) => (
                  <Card key={req.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-primary">{req.name}</p>
                      <p className="text-sm text-muted">{req.city} · {req.contact_email || t('admin.noEmail')}</p>
                      <p className="text-xs text-muted">{new Date(req.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => reviewRequest(req.id, 'approved')}>
                        <Check size={14} />
                        {t('admin.approve')}
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => reviewRequest(req.id, 'rejected')}>
                        <X size={14} />
                        {t('admin.reject')}
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {tab === 'users' && (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-border bg-surface">
                  <tr>
                    <th className="px-4 py-3 font-medium text-muted">{t('admin.name')}</th>
                    <th className="px-4 py-3 font-medium text-muted">{t('admin.role')}</th>
                    <th className="px-4 py-3 font-medium text-muted">{t('admin.status')}</th>
                    <th className="px-4 py-3 font-medium text-muted">{t('admin.joined')}</th>
                    <th className="px-4 py-3 font-medium text-muted">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium text-primary">{u.full_name}</p>
                        <p className="text-xs text-muted">{u.phone || '—'}</p>
                      </td>
                      <td className="px-4 py-3 capitalize">{u.role}</td>
                      <td className="px-4 py-3">
                        {u.is_banned ? (
                          <Badge variant="error">{t('admin.banned')}</Badge>
                        ) : u.role === 'landlord' ? (
                          <Badge variant={u.verification_status === 'approved' ? 'success' : 'warning'}>
                            {u.verification_status}
                          </Badge>
                        ) : (
                          <Badge variant="default">{t('admin.active')}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {u.role !== 'admin' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleBan(u.id, u.is_banned)}
                              title={u.is_banned ? t('admin.unban') : t('admin.ban')}
                            >
                              <Ban size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => deleteUser(u.id, u.full_name)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'landlords' && (
            <div className="space-y-4">
              {landlords.length === 0 ? (
                <Card className="p-8 text-center text-muted">{t('admin.noPendingLandlords')}</Card>
              ) : (
                landlords.map((ll) => (
                  <Card key={ll.id} className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-primary">{ll.full_name}</p>
                        <p className="text-sm text-muted">{ll.phone}</p>
                        <Badge variant="warning" className="mt-2">{ll.verification_status}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => reviewLandlord(ll.id, true)}>
                          <Check size={14} />
                          {t('admin.approve')}
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => reviewLandlord(ll.id, false)}>
                          <X size={14} />
                          {t('admin.reject')}
                        </Button>
                      </div>
                    </div>
                    {ll.docs?.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {ll.docs.map((doc) => (
                          <Button
                            key={doc.id}
                            size="sm"
                            variant="outline"
                            onClick={() => viewDoc(doc.storage_path)}
                          >
                            <Eye size={14} />
                            {doc.doc_type.replace(/_/g, ' ')}
                          </Button>
                        ))}
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          )}

          {tab === 'listings' && (
            <div className="space-y-4">
              {listings.length === 0 ? (
                <Card className="p-8 text-center text-muted">{t('admin.noPendingListings')}</Card>
              ) : (
                listings.map((listing) => (
                  <Card key={listing.id} className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-primary">{listing.title}</p>
                        <p className="text-sm text-muted">
                          {listing.city} · {listing.landlord?.full_name}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => reviewListing(listing.id, true)}>
                          <Check size={14} />
                          {t('admin.verifyListing')}
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => reviewListing(listing.id, false)}>
                          <X size={14} />
                          {t('admin.reject')}
                        </Button>
                      </div>
                    </div>
                    {listing.docs?.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {listing.docs.map((doc) => (
                          <Button
                            key={doc.id}
                            size="sm"
                            variant="outline"
                            onClick={() => viewDoc(doc.storage_path)}
                          >
                            <Eye size={14} />
                            {doc.doc_type.replace(/_/g, ' ')}
                          </Button>
                        ))}
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}

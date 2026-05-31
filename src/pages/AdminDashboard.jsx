import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users, GraduationCap, Shield, Home, Ban, Trash2, Check, X,
  RefreshCw, Radio, Search, MapPin, CreditCard, ClipboardList, Star, Building2,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useTranslation } from '../hooks/useTranslation'
import {
  analyzeLandlord, analyzeListing, sortSubmissions, summarizeQueue,
} from '../lib/adminAdvisor'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Card from '../components/ui/Card'
import { Skeleton } from '../components/ui/Skeleton'
import { prepareUniversityDraft, prepareUniversityEditDraft, deleteUniversity } from '../lib/adminUniversities'
import UniversityPublishModal from '../components/admin/UniversityPublishModal'
import AdminUniversitiesPanel from '../components/admin/AdminUniversitiesPanel'
import AdminAdvisorPanel from '../components/admin/AdminAdvisorPanel'
import VerificationCard from '../components/admin/VerificationCard'
import DocumentPreviewModal from '../components/admin/DocumentPreviewModal'
import AdminActionModal from '../components/admin/AdminActionModal'
import AdminToast from '../components/admin/AdminToast'
import AdminSubscriptionsPanel from '../components/admin/AdminSubscriptionsPanel'
import AdminApplicationsPanel from '../components/admin/AdminApplicationsPanel'
import AdminReviewsPanel from '../components/admin/AdminReviewsPanel'

const TABS = [
  { id: 'requests', icon: GraduationCap, labelKey: 'admin.tabRequests' },
  { id: 'universities', icon: Building2, labelKey: 'admin.tabUniversities' },
  { id: 'applications', icon: ClipboardList, labelKey: 'admin.tabApplications' },
  { id: 'reviews', icon: Star, labelKey: 'admin.tabReviews' },
  { id: 'users', icon: Users, labelKey: 'admin.tabUsers' },
  { id: 'landlords', icon: Shield, labelKey: 'admin.tabLandlords' },
  { id: 'listings', icon: Home, labelKey: 'admin.tabListings' },
  { id: 'subscriptions', icon: CreditCard, labelKey: 'admin.tabSubscriptions' },
]

const TAB_STORAGE_KEY = 'ntlo_admin_tab'

export default function AdminDashboard() {
  const { t } = useTranslation()
  const [tab, setTab] = useState(() => {
    if (typeof sessionStorage !== 'undefined') {
      const saved = sessionStorage.getItem(TAB_STORAGE_KEY)
      if (saved && TABS.some((x) => x.id === saved)) return saved
    }
    return 'requests'
  })
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(true)
  const [requests, setRequests] = useState([])
  const [users, setUsers] = useState([])
  const [landlords, setLandlords] = useState([])
  const [listings, setListings] = useState([])
  const [actionError, setActionError] = useState('')
  const [geocodingRequestId, setGeocodingRequestId] = useState(null)
  const [publishDraft, setPublishDraft] = useState(null)
  const [editorMode, setEditorMode] = useState('create')
  const [sortMode, setSortMode] = useState('smart')
  const [preview, setPreview] = useState(null)
  const [userSearch, setUserSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [dialog, setDialog] = useState(null)
  const [toast, setToast] = useState(null)

  const selectTab = useCallback((id) => {
    setTab(id)
    try { sessionStorage.setItem(TAB_STORAGE_KEY, id) } catch { /* ignore */ }
  }, [])

  const [searchParams] = useSearchParams()
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && TABS.some((x) => x.id === tabParam)) selectTab(tabParam)
  }, [searchParams, selectTab])

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
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id, full_name, phone, verification_status, verification_notes, is_verified, created_at,
        docs:verification_documents!verification_documents_user_id_fkey(id, doc_type, file_name, storage_path, status, created_at)
      `)
      .eq('role', 'landlord')
      .in('verification_status', ['pending', 'changes_requested'])
      .order('created_at', { ascending: false })
    if (error) setActionError(error.message)
    setLandlords(data || [])
  }, [])

  const fetchListings = useCallback(async () => {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        id, title, city, price, verification_status, verification_notes, is_verified, created_at,
        landlord:profiles!listings_landlord_id_fkey(id, full_name),
        docs:verification_documents!verification_documents_listing_id_fkey(id, doc_type, file_name, storage_path, status, created_at)
      `)
      .in('verification_status', ['pending', 'changes_requested'])
      .order('created_at', { ascending: false })
    if (error) setActionError(error.message)
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
    setGeocodingRequestId(req.id)
    setActionError('')
    try {
      const draft = await prepareUniversityDraft(req)
      setEditorMode('create')
      setPublishDraft(draft)
    } catch (err) {
      setActionError(err.message || t('admin.actionFailed'))
    } finally {
      setGeocodingRequestId(null)
    }
  }

  function openEditUniversity(uni) {
    setEditorMode('edit')
    setPublishDraft(prepareUniversityEditDraft(uni))
  }

  function openDeleteUniversity(uni) {
    setDialog({
      mode: 'confirm',
      title: t('admin.universityDeleteTitle'),
      subtitle: uni.name,
      description: t('admin.universityDeleteConfirm'),
      confirmLabel: t('admin.delete'),
      confirmVariant: 'danger',
      onConfirm: async () => {
        await deleteUniversity(uni.id)
        setToast({ type: 'success', message: t('admin.universityDeletedToast') })
      },
    })
  }

  function handleUniversityPublished() {
    setPublishDraft(null)
    fetchRequests()
    setToast({ type: 'success', message: t('admin.universityPublishedToast') })
  }

  function handleUniversityUpdated() {
    setPublishDraft(null)
    setToast({ type: 'success', message: t('admin.universityUpdatedToast') })
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
    if (currentlyBanned) {
      setActionError('')
      try {
        const { error } = await supabase.rpc('admin_set_ban', {
          target_id: userId,
          banned: false,
          reason: null,
        })
        if (error) throw error
        await fetchUsers()
        setToast({ type: 'success', message: t('admin.dialog.unbanned') })
      } catch (err) {
        setActionError(err.message || t('admin.actionFailed'))
      }
      return
    }
    setDialog({
      mode: 'prompt',
      title: t('admin.dialog.banTitle'),
      placeholder: t('admin.banReasonPrompt'),
      confirmLabel: t('admin.ban'),
      confirmVariant: 'danger',
      onConfirm: async (reason) => {
        const { error } = await supabase.rpc('admin_set_ban', {
          target_id: userId,
          banned: true,
          reason: reason || null,
        })
        if (error) throw error
        await fetchUsers()
        setToast({ type: 'success', message: t('admin.dialog.banned') })
      },
    })
  }

  function openDeleteUser(userId, name) {
    setDialog({
      mode: 'confirm',
      title: t('admin.dialog.deleteTitle'),
      description: t('admin.deleteConfirm', { name }),
      confirmLabel: t('admin.dialog.deleteConfirmBtn'),
      confirmVariant: 'danger',
      onConfirm: async () => {
        const { error } = await supabase.rpc('admin_delete_user', { target_id: userId })
        if (error) throw error
        await fetchUsers()
        setToast({ type: 'success', message: t('admin.dialog.deleted') })
      },
    })
  }

  function openReviewLandlord(item, approved) {
    setDialog({
      mode: 'prompt',
      title: approved ? t('admin.dialog.approveLandlord') : t('admin.dialog.rejectLandlord'),
      subtitle: item.full_name,
      placeholder: approved ? t('admin.approveNotes') : t('admin.rejectNotes'),
      confirmLabel: approved ? t('admin.approve') : t('admin.reject'),
      confirmVariant: approved ? 'primary' : 'danger',
      onConfirm: async (notes) => {
        const { error } = await supabase.rpc('admin_review_landlord', {
          target_id: item.id,
          approved,
          notes,
        })
        if (error) throw error
        setUsers((prev) =>
          prev.map((u) =>
            u.id === item.id
              ? {
                  ...u,
                  verification_status: approved ? 'approved' : 'rejected',
                  is_verified: approved,
                }
              : u
          )
        )
        setLandlords((prev) => prev.filter((l) => l.id !== item.id))
        await fetchLandlords()
        await fetchUsers()
        setToast({
          type: 'success',
          message: approved ? t('admin.dialog.landlordApproved') : t('admin.dialog.landlordRejected'),
        })
      },
    })
  }

  function openReviewListing(item, approved) {
    setDialog({
      mode: 'prompt',
      title: approved ? t('admin.dialog.approveListing') : t('admin.dialog.rejectListing'),
      subtitle: item.title,
      placeholder: approved ? t('admin.approveNotes') : t('admin.rejectNotes'),
      confirmLabel: approved ? t('admin.verifyListing') : t('admin.reject'),
      confirmVariant: approved ? 'primary' : 'danger',
      onConfirm: async (notes) => {
        const { error } = await supabase.rpc('admin_review_listing', {
          target_listing_id: item.id,
          approved,
          notes,
        })
        if (error) throw error
        await fetchListings()
        setToast({
          type: 'success',
          message: approved ? t('admin.dialog.listingApproved') : t('admin.dialog.listingRejected'),
        })
      },
    })
  }

  async function requestDocChanges(docId, note) {
    const { error } = await supabase.rpc('admin_review_document', {
      target_doc_id: docId,
      new_status: 'changes_requested',
      note,
    })
    if (error) {
      setActionError(error.message)
      throw error
    }
    await fetchLandlords()
    await fetchListings()
  }

  async function setDocStatus(docId, newStatus) {
    const { error } = await supabase.rpc('admin_review_document', {
      target_doc_id: docId,
      new_status: newStatus,
      note: null,
    })
    if (error) {
      setActionError(error.message)
      throw error
    }
    await fetchLandlords()
    await fetchListings()
  }

  const pendingRequests = useMemo(() => requests.filter((r) => r.status === 'pending'), [requests])

  const landlordQueue = useMemo(
    () => sortSubmissions(landlords, analyzeLandlord, sortMode),
    [landlords, sortMode]
  )
  const listingQueue = useMemo(
    () => sortSubmissions(listings, analyzeListing, sortMode),
    [listings, sortMode]
  )

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase()
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (!q) return true
      return (u.full_name || '').toLowerCase().includes(q) || (u.phone || '').toLowerCase().includes(q)
    })
  }, [users, userSearch, roleFilter])

  const stats = [
    { id: 'requests', icon: GraduationCap, label: t('admin.statRequests'), value: pendingRequests.length },
    { id: 'users', icon: Users, label: t('admin.statUsers'), value: users.length },
    { id: 'landlords', icon: Shield, label: t('admin.statLandlords'), value: landlords.length },
    { id: 'listings', icon: Home, label: t('admin.statListings'), value: listings.length },
  ]

  const tabCounts = {
    requests: pendingRequests.length,
    universities: 0,
    landlords: landlords.length,
    listings: listings.length,
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8"
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary">{t('admin.title')}</h1>
          <p className="mt-2 inline-flex items-center gap-2 text-sm text-muted">
            <span className={`flex h-2 w-2 rounded-full ${live ? 'bg-success' : 'bg-muted'}`}>
              <span className={`h-2 w-2 rounded-full ${live ? 'animate-ping bg-success/60' : ''}`} />
            </span>
            <Radio size={14} className={live ? 'text-success' : 'text-muted'} />
            {live ? t('admin.liveConnected') : t('admin.liveDisconnected')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshAll}>
          <RefreshCw size={14} />
          {t('admin.refresh')}
        </Button>
      </div>

      {/* Overview stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ id, icon: Icon, label, value }) => (
          <button
            key={id}
            type="button"
            onClick={() => selectTab(id)}
            className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
              tab === id
                ? 'border-accent/40 bg-accent/5 shadow-sm'
                : 'border-border bg-surface hover:border-accent/30 hover:bg-background'
            }`}
          >
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              tab === id ? 'bg-accent/15 text-accent ring-1 ring-accent/30' : 'bg-background text-muted'
            }`}>
              <Icon size={20} />
            </span>
            <span>
              <span className="block font-display text-2xl font-bold leading-none text-primary">{value}</span>
              <span className="mt-1 block text-xs text-muted">{label}</span>
            </span>
          </button>
        ))}
      </div>

      {actionError && (
        <div className="mb-4 rounded-lg border border-error/30 bg-error/5 px-4 py-2 text-sm text-error">
          {actionError}
        </div>
      )}

      {/* Tab bar */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map(({ id, icon: Icon, labelKey }) => (
          <button
            key={id}
            type="button"
            onClick={() => selectTab(id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === id ? 'bg-primary text-white shadow-sm' : 'border border-border bg-surface text-muted hover:text-primary'
            }`}
          >
            <Icon size={16} />
            {t(labelKey)}
            {tabCounts[id] > 0 && (
              <span className={`rounded-full px-2 py-0.5 text-xs ${tab === id ? 'bg-accent text-primary' : 'bg-accent/15 text-accent'}`}>
                {tabCounts[id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
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
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/20">
                        <GraduationCap size={20} />
                      </span>
                      <div>
                        <p className="font-semibold text-primary">{req.name}</p>
                        <p className="flex items-center gap-1 text-sm text-muted">
                          <MapPin size={12} /> {req.city} · {req.contact_email || t('admin.noEmail')}
                        </p>
                        <p className="text-xs text-muted">{new Date(req.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => reviewRequest(req.id, 'approved')} disabled={geocodingRequestId === req.id}>
                        {geocodingRequestId === req.id ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                        {geocodingRequestId === req.id ? t('admin.geocodingCampus') : t('admin.approve')}
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => reviewRequest(req.id, 'rejected')} disabled={geocodingRequestId === req.id}>
                        <X size={14} />
                        {t('admin.reject')}
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {tab === 'universities' && (
            <AdminUniversitiesPanel
              onEdit={openEditUniversity}
              onDelete={openDeleteUniversity}
            />
          )}

          {tab === 'applications' && <AdminApplicationsPanel />}

          {tab === 'reviews' && <AdminReviewsPanel />}

          {tab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="search"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder={t('admin.searchUsers')}
                    className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-primary outline-none focus:ring-2 focus:ring-accent/40"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-primary outline-none focus:ring-2 focus:ring-accent/40"
                >
                  <option value="all">{t('admin.filterRole')}</option>
                  <option value="student">{t('admin.roleStudent')}</option>
                  <option value="landlord">{t('admin.roleLandlord')}</option>
                  <option value="admin">{t('admin.roleAdmin')}</option>
                </select>
              </div>

              {filteredUsers.length === 0 ? (
                <Card className="p-8 text-center text-muted">{t('admin.noUsersMatch')}</Card>
              ) : (
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
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="border-b border-border last:border-0 hover:bg-background/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {(u.full_name || '?').trim().charAt(0).toUpperCase()}
                              </span>
                              <div>
                                <p className="font-medium text-primary">{u.full_name}</p>
                                <p className="text-xs text-muted">{u.phone || '—'}</p>
                              </div>
                            </div>
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
                                  onClick={() => openDeleteUser(u.id, u.full_name)}
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
            </div>
          )}

          {tab === 'landlords' && (
            <div className="space-y-4">
              <AdminAdvisorPanel
                summary={summarizeQueue(landlordQueue)}
                sortMode={sortMode}
                onSortChange={setSortMode}
              />
              {landlordQueue.length === 0 ? (
                <Card className="p-8 text-center text-muted">{t('admin.noPendingLandlords')}</Card>
              ) : (
                landlordQueue.map(({ item, analysis }) => (
                  <VerificationCard
                    key={item.id}
                    subject={item}
                    analysis={analysis}
                    kind="landlord"
                    onOpenDocs={(docs, index, name) => setPreview({ docs, index, name })}
                    onApprove={() => openReviewLandlord(item, true)}
                    onReject={() => openReviewLandlord(item, false)}
                    onRequestChanges={requestDocChanges}
                    onMarkOk={(docId) => setDocStatus(docId, 'approved')}
                    onUnmarkOk={(docId) => setDocStatus(docId, 'pending')}
                  />
                ))
              )}
            </div>
          )}

          {tab === 'listings' && (
            <div className="space-y-4">
              <AdminAdvisorPanel
                summary={summarizeQueue(listingQueue)}
                sortMode={sortMode}
                onSortChange={setSortMode}
              />
              {listingQueue.length === 0 ? (
                <Card className="p-8 text-center text-muted">{t('admin.noPendingListings')}</Card>
              ) : (
                listingQueue.map(({ item, analysis }) => (
                  <VerificationCard
                    key={item.id}
                    subject={item}
                    analysis={analysis}
                    kind="listing"
                    onOpenDocs={(docs, index, name) => setPreview({ docs, index, name })}
                    onApprove={() => openReviewListing(item, true)}
                    onReject={() => openReviewListing(item, false)}
                    onRequestChanges={requestDocChanges}
                    onMarkOk={(docId) => setDocStatus(docId, 'approved')}
                    onUnmarkOk={(docId) => setDocStatus(docId, 'pending')}
                  />
                ))
              )}
            </div>
          )}

          {tab === 'subscriptions' && <AdminSubscriptionsPanel />}
        </>
      )}

      {preview && (
        <DocumentPreviewModal
          docs={preview.docs}
          index={preview.index}
          subjectName={preview.name}
          onIndex={(index) => setPreview((p) => ({ ...p, index }))}
          onClose={() => setPreview(null)}
        />
      )}

      {dialog && (
        <AdminActionModal
          {...dialog}
          onClose={() => setDialog(null)}
        />
      )}

      {toast && (
        <AdminToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <UniversityPublishModal
        open={Boolean(publishDraft)}
        draft={publishDraft}
        mode={editorMode}
        onClose={() => setPublishDraft(null)}
        onPublished={handleUniversityPublished}
        onUpdated={handleUniversityUpdated}
      />
    </motion.div>
  )
}

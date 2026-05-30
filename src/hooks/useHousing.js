import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { getOrCreateConversation, sendMessage, markMessagesRead } from '../lib/housing'

const APPLICATION_SELECT = `
  *,
  listing:listings(id, title, area, city, price, available),
  documents:application_documents(id, doc_type, file_name, storage_path, created_at),
  student:profiles!listing_applications_student_id_fkey(id, full_name, phone, university_id, gender)
`

export function useConversations() {
  const { user, profile } = useAuth()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setConversations([])
      setLoading(false)
      return
    }

    setLoading(true)
    const isLandlord = profile?.role === 'landlord'
    const filterCol = isLandlord ? 'landlord_id' : 'student_id'

    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        listing:listings(id, title, price, area, city, cover_photo:listing_photos(url, is_cover)),
        student:profiles!conversations_student_id_fkey(id, full_name),
        landlord:profiles!conversations_landlord_id_fkey(id, full_name)
      `)
      .eq(filterCol, user.id)
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (!error) setConversations(data || [])
    setLoading(false)
  }, [user, profile?.role])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (!user?.id) return undefined

    const channel = supabase
      .channel(`conversations-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetchConversations()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id, fetchConversations])

  return { conversations, loading, refetch: fetchConversations }
}

export function useMessages(conversationId) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchMessages = useCallback(async () => {
    if (!conversationId) {
      setMessages([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (!error) setMessages(data || [])
    setLoading(false)
    if (conversationId) markMessagesRead(conversationId)
  }, [conversationId])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  useEffect(() => {
    if (!conversationId) return undefined

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
          markMessagesRead(conversationId)
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [conversationId])

  const send = useCallback(async (body) => {
    const msg = await sendMessage(conversationId, body)
    setMessages((prev) => [...prev, msg])
    return msg
  }, [conversationId])

  const startConversation = useCallback(async (listingId) => {
    const id = await getOrCreateConversation(listingId)
    return id
  }, [])

  return { messages, loading, send, refetch: fetchMessages, startConversation, userId: user?.id }
}

export function useStudentHousing() {
  const { user } = useAuth()
  const [viewings, setViewings] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!user) {
      setViewings([])
      setApplications([])
      setLoading(false)
      return
    }

    setLoading(true)
    const [v, a] = await Promise.all([
      supabase
        .from('viewing_requests')
        .select('*, listing:listings(id, title, area, city)')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('listing_applications')
        .select(APPLICATION_SELECT)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false }),
    ])

    setViewings(v.data || [])
    setApplications(a.data || [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    if (!user?.id) return undefined

    const channel = supabase
      .channel(`student-housing-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'viewing_requests' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listing_applications' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'application_documents' }, fetchAll)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id, fetchAll])

  return { viewings, applications, loading, refetch: fetchAll }
}

export function useLandlordInquiries() {
  const { user } = useAuth()
  const [viewings, setViewings] = useState([])
  const [applications, setApplications] = useState([])
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!user) {
      setViewings([])
      setApplications([])
      setConversations([])
      setLoading(false)
      return
    }

    setLoading(true)
    const [v, a, c] = await Promise.all([
      supabase
        .from('viewing_requests')
        .select('*, listing:listings(id, title), student:profiles!viewing_requests_student_id_fkey(id, full_name)')
        .eq('landlord_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('listing_applications')
        .select(APPLICATION_SELECT)
        .eq('landlord_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('conversations')
        .select(`
          *,
          listing:listings(id, title),
          student:profiles!conversations_student_id_fkey(id, full_name)
        `)
        .eq('landlord_id', user.id)
        .order('last_message_at', { ascending: false, nullsFirst: false }),
    ])

    setViewings(v.data || [])
    setApplications(a.data || [])
    setConversations(c.data || [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    if (!user?.id) return undefined

    const channel = supabase
      .channel(`landlord-inquiries-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'viewing_requests' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listing_applications' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'application_documents' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, fetchAll)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id, fetchAll])

  return { viewings, applications, conversations, loading, refetch: fetchAll }
}

export function useAdminApplications() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('listing_applications')
      .select(`
        ${APPLICATION_SELECT},
        landlord:profiles!listing_applications_landlord_id_fkey(id, full_name, phone)
      `)
      .order('created_at', { ascending: false })
      .limit(200)

    if (!error) setApplications(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  useEffect(() => {
    const channel = supabase
      .channel('admin-applications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listing_applications' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'application_documents' }, fetchAll)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchAll])

  return { applications, loading, refetch: fetchAll }
}

import { supabase } from './supabase'
import { tierPrice } from './subscriptions'

const BUCKET = 'payment-receipts'

export async function uploadPaymentReceipt({ userId, tier, file }) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${userId}/${tier}/${Date.now()}-${safeName}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || undefined })
  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('payment_receipts')
    .insert({
      user_id: userId,
      tier,
      amount_pula: tierPrice(tier),
      storage_path: path,
      file_name: file.name,
      status: 'pending',
    })
    .select()
    .single()
  if (error) throw error

  await supabase
    .from('profiles')
    .update({ subscription_status: 'pending_payment' })
    .eq('id', userId)
    .eq('role', 'landlord')

  return data
}

export async function fetchUserPaymentReceipts(userId) {
  const { data, error } = await supabase
    .from('payment_receipts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function fetchPendingPaymentReceipts() {
  const { data, error } = await supabase
    .from('payment_receipts')
    .select(`
      *,
      landlord:profiles!payment_receipts_user_id_fkey(id, full_name, phone, subscription_tier, subscription_status, subscription_period_end)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function fetchLandlordSubscriptionOverview() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, subscription_tier, subscription_status, subscription_period_end, created_at')
    .eq('role', 'landlord')
    .order('full_name')
  if (error) throw error
  return data || []
}

export async function getReceiptSignedUrl(storagePath, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresIn)
  if (error) throw error
  return data.signedUrl
}

export async function reviewPaymentReceipt(receiptId, approved, note) {
  const { error } = await supabase.rpc('admin_review_payment_receipt', {
    receipt_id: receiptId,
    approved,
    note: note || null,
    months: 1,
  })
  if (error) throw error
}

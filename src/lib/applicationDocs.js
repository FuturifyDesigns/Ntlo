import { supabase } from './supabase'

export const APPLICATION_DOC_TYPES = [
  {
    id: 'omang_or_passport',
    labelKey: 'housing.docOmangPassport',
    descKey: 'housing.docOmangPassportDesc',
  },
  {
    id: 'registration_proof',
    labelKey: 'housing.docRegistration',
    descKey: 'housing.docRegistrationDesc',
  },
]

/** Labels for legacy doc types still in the database. */
export const APPLICATION_DOC_LABEL_KEYS = {
  omang_or_passport: 'housing.docOmangPassport',
  registration_proof: 'housing.docRegistration',
  student_id: 'housing.docOmangPassport',
  student_card: 'housing.docStudentCard',
}

const BUCKET = 'application-docs'

export async function uploadApplicationDoc({ applicationId, studentId, docType, file }) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${studentId}/${applicationId}/${docType}/${Date.now()}-${safeName}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type || undefined,
      cacheControl: '3600',
    })

  if (uploadError) throw uploadError

  const { data, error } = await supabase
    .from('application_documents')
    .upsert(
      {
        application_id: applicationId,
        doc_type: docType,
        storage_path: path,
        file_name: file.name,
        uploaded_by: studentId,
      },
      { onConflict: 'application_id,doc_type' }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getSignedApplicationDocUrl(storagePath, expiresIn = 3600) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresIn)
  if (error) throw error
  return data.signedUrl
}

export async function fetchApplicationDocuments(applicationId) {
  const { data, error } = await supabase
    .from('application_documents')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export function applicationDocsComplete(documents) {
  const types = new Set((documents || []).map((d) => d.doc_type))
  return APPLICATION_DOC_TYPES.every((t) => types.has(t.id))
}

export function getApplicationDocLabelKey(docType) {
  return APPLICATION_DOC_LABEL_KEYS[docType] || 'housing.docRegistration'
}

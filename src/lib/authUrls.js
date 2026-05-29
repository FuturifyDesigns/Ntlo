/** Auth redirect URLs for Supabase email links (no hash — works with PKCE ?code=) */
export function getAuthVerifyUrl() {
  return `${window.location.origin}${import.meta.env.BASE_URL}auth/verify.html`
}

export function getAuthResetUrl() {
  return `${window.location.origin}${import.meta.env.BASE_URL}auth/reset.html`
}

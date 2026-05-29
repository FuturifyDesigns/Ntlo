import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getAuthCallbackUrl, getAuthResetUrl, getAuthVerifyUrl } from '../lib/authUrls'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, phone, role, university_id, avatar_url, is_verified')
      .eq('id', userId)
      .maybeSingle()
    setProfile(data)
    return data
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signUp({ email, password, fullName, role, phone }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role, phone },
        emailRedirectTo: getAuthVerifyUrl(),
      },
    })
    if (error) throw error
    return data
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) throw error

    const confirmed = data?.user?.email_confirmed_at || data?.user?.confirmed_at
    if (data?.user && !confirmed) {
      await supabase.auth.signOut()
      const err = new Error('Email not confirmed')
      err.code = 'email_not_confirmed'
      throw err
    }

    return data
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthResetUrl(),
    })
    if (error) throw error
  }

  async function signInWithGoogle({ role } = {}) {
    if (role === 'student' || role === 'landlord') {
      sessionStorage.setItem('ntlo_oauth_role', role)
    } else {
      sessionStorage.removeItem('ntlo_oauth_role')
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthCallbackUrl(),
        queryParams: { prompt: 'select_account' },
        scopes: 'email profile',
      },
    })
    if (error) throw error

    if (data?.url) {
      sessionStorage.setItem('ntlo_oauth_pending', '1')
      window.location.assign(data.url)
    }

    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setProfile(null)
  }

  async function updateProfile(updates) {
    if (!user) return
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    if (error) throw error
    setProfile(data)
    return data
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile,
    refreshProfile: () => user && fetchProfile(user.id),
    isStudent: profile?.role === 'student',
    isLandlord: profile?.role === 'landlord',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}

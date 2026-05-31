import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { supabase } from '../lib/supabase'
import { getAuthCallbackUrl, getAuthResetUrl, getAuthVerifyUrl } from '../lib/authUrls'
import { clearOAuthStorage, markOAuthPending, setOAuthIntent } from '../lib/oauthStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  async function fetchProfile(userId, { silent = false } = {}) {
    if (!silent) setProfileLoading(true)
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, phone, role, university_id, gender, avatar_url, is_verified, verification_status, verification_notes, is_banned, banned_reason, subscription_tier, subscription_status, subscription_period_end, last_seen_at')
        .eq('id', userId)
        .maybeSingle()
      setProfile(data)
      return data
    } finally {
      if (!silent) setProfileLoading(false)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else {
        setProfile(null)
        setProfileLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Realtime profile updates (admin approval, ban, feedback, etc.)
  useEffect(() => {
    if (!user?.id) return undefined

    const channel = supabase
      .channel(`auth-profile-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          if (payload.new) setProfile((prev) => ({ ...prev, ...payload.new }))
          else fetchProfile(user.id, { silent: true })
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id])

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
      setUser(null)
      setProfile(null)
      const err = new Error('Email not confirmed')
      err.code = 'email_not_confirmed'
      throw err
    }

    if (data?.user) {
      setUser(data.user)
      const prof = await fetchProfile(data.user.id)
      if (prof?.is_banned) {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        const err = new Error('Account suspended')
        err.code = 'account_banned'
        throw err
      }
      return { ...data, profile: prof }
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
    clearOAuthStorage()
    setOAuthIntent({ from: role ? 'register' : 'login', role })

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthCallbackUrl(),
        queryParams: {
          prompt: 'select_account',
          access_type: 'online',
        },
        scopes: 'openid email profile',
      },
    })

    if (error) {
      clearOAuthStorage()
      throw error
    }

    if (!data?.url) {
      clearOAuthStorage()
      throw new Error('Could not start Google sign-in. Please try again.')
    }

    markOAuthPending()
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    })
    window.location.assign(data.url)
    return data
  }

  const signOut = useCallback(async () => {
    clearOAuthStorage()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setUser(null)
    setProfile(null)
  }, [])

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

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      profileLoading,
      signUp,
      signIn,
      signInWithGoogle,
      signOut,
      resetPassword,
      updateProfile,
      refreshProfile: async () => {
        if (!user) return null
        const data = await fetchProfile(user.id, { silent: true })
        flushSync(() => setProfile(data))
        return data
      },
      isStudent: profile?.role === 'student',
      isLandlord: profile?.role === 'landlord',
      isAdmin: profile?.role === 'admin',
      isBanned: profile?.is_banned === true,
    }),
    [user, profile, loading, profileLoading, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider')
  return ctx
}

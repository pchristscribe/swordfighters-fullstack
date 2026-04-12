import type { Provider } from '@supabase/supabase-js'

export const useAuth = () => {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  const signInWithOAuth = async (provider: Provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${useRequestURL().origin}/confirm`,
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    await navigateTo('/')
  }

  return {
    user,
    signInWithOAuth,
    signOut,
  }
}

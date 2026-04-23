<template>
  <div class="min-h-screen bg-surface-light dark:bg-surface-dark flex items-center justify-center px-4">
    <div class="text-center">
      <div v-if="error">
        <p class="text-status-error font-medium mb-4">{{ error }}</p>
        <NuxtLink to="/login" class="text-brand hover:underline text-sm">
          Back to sign in
        </NuxtLink>
      </div>
      <div v-else class="flex flex-col items-center gap-4">
        <span class="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" aria-hidden="true" />
        <p class="text-ink-muted dark:text-ink-subtle text-sm">Completing sign-in…</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const error = ref<string | null>(null)
const supabase = useSupabaseClient()

onMounted(async () => {
  // @nuxtjs/supabase handles the PKCE / implicit flow automatically via the
  // module's built-in callback route. This page exists as a visual landing
  // point; we just wait for the session to be established and redirect.
  const { data, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    error.value = sessionError.message
    return
  }

  if (data.session) {
    await navigateTo('/')
  }
  else {
    // Session not yet set — give the module a moment to exchange the token,
    // then redirect regardless so the home page picks up the fresh session.
    await new Promise(resolve => setTimeout(resolve, 800))
    await navigateTo('/')
  }
})
</script>

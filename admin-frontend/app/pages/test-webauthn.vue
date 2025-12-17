<template>
  <div class="min-h-screen bg-gray-100 p-8">
    <div class="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
      <h1 class="text-2xl font-bold mb-4">WebAuthn Registration Test</h1>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-2">Email:</label>
          <input
            v-model="email"
            type="email"
            class="border rounded px-3 py-2 w-full"
            placeholder="test@example.com"
          />
        </div>

        <button
          @click="testRegistration"
          :disabled="loading"
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading ? 'Testing...' : 'Test Registration' }}
        </button>

        <div v-if="logs.length > 0" class="mt-6 p-4 bg-gray-50 rounded border">
          <h2 class="font-semibold mb-2">Debug Logs:</h2>
          <div class="space-y-1 text-sm font-mono">
            <div v-for="(log, i) in logs" :key="i" :class="log.type === 'error' ? 'text-red-600' : 'text-gray-700'">
              {{ log.message }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { startRegistration } from '@simplewebauthn/browser'

definePageMeta({
  layout: false
})

const config = useRuntimeConfig()
const email = ref('test@example.com')
const loading = ref(false)
const logs = ref<Array<{ message: string; type: string }>>([])

function addLog(message: string, type = 'info') {
  console.log(message)
  logs.value.push({ message, type })
}

async function testRegistration() {
  loading.value = true
  logs.value = []

  try {
    addLog('🔍 Step 1: Checking WebAuthn support...')

    if (!window.PublicKeyCredential) {
      addLog('❌ WebAuthn NOT supported in this browser!', 'error')
      return
    }
    addLog('✅ WebAuthn is supported')

    addLog(`📡 Step 2: Requesting registration options from ${config.public.apiBase}...`)

    const optionsResponse = await $fetch(`${config.public.apiBase}/api/admin/webauthn/register/options`, {
      method: 'POST',
      body: { email: email.value },
      credentials: 'include'
    }) as any

    addLog('✅ Got registration options from server')
    addLog(`   Challenge length: ${optionsResponse.challenge?.length || 0}`)
    addLog(`   User ID: ${optionsResponse.user?.id || 'missing'}`)

    addLog('🔑 Step 3: Requesting TouchID/Security Key from browser...')
    addLog('   (You should see a system prompt now)')

    const credential = await startRegistration({ optionsJSON: optionsResponse })

    addLog('✅ Credential created successfully!')
    addLog(`   Credential ID length: ${credential.id?.length || 0}`)

    addLog('📤 Step 4: Sending credential to server for verification...')

    const verificationResponse = await $fetch(`${config.public.apiBase}/api/admin/webauthn/register/verify`, {
      method: 'POST',
      credentials: 'include',
      body: {
        email: email.value,
        credential,
        deviceName: 'Test Device'
      }
    }) as any

    if (verificationResponse.verified) {
      addLog('✅✅✅ SUCCESS! TouchID registered successfully!')
    } else {
      addLog('❌ Verification failed', 'error')
    }

  } catch (err: any) {
    addLog(`❌ ERROR at some step:`, 'error')
    addLog(`   Error name: ${err.name || 'unknown'}`, 'error')
    addLog(`   Error message: ${err.message || 'unknown'}`, 'error')

    if (err.data?.error) {
      addLog(`   Server error: ${err.data.error}`, 'error')
    }

    // Provide specific guidance
    if (err.name === 'NotAllowedError') {
      addLog('💡 This means you cancelled or it timed out', 'error')
    } else if (err.name === 'SecurityError') {
      addLog('💡 Make sure you\'re accessing via http://localhost:3002', 'error')
    } else if (err.message?.includes('fetch')) {
      addLog('💡 Backend server may not be running', 'error')
    }
  } finally {
    loading.value = false
  }
}
</script>

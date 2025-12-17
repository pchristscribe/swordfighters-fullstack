<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Top Navigation -->
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <h1 class="text-xl font-bold text-gray-900">Swordfighters Admin</h1>
            </div>
            <!-- Desktop Navigation -->
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <NuxtLink
                to="/"
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                active-class="!border-indigo-500 !text-gray-900"
              >
                Dashboard
              </NuxtLink>
              <NuxtLink
                to="/products"
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                active-class="!border-indigo-500 !text-gray-900"
              >
                Products
              </NuxtLink>
              <NuxtLink
                to="/categories"
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                active-class="!border-indigo-500 !text-gray-900"
              >
                Categories
              </NuxtLink>
              <NuxtLink
                to="/reviews"
                class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                active-class="!border-indigo-500 !text-gray-900"
              >
                Reviews
              </NuxtLink>
            </div>
          </div>
          <div class="flex items-center">
            <!-- Mobile menu button -->
            <button
              @click="mobileMenuOpen = !mobileMenuOpen"
              class="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              aria-expanded="false"
            >
              <span class="sr-only">Open main menu</span>
              <!-- Hamburger icon when menu is closed -->
              <svg
                v-if="!mobileMenuOpen"
                class="block h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <!-- X icon when menu is open -->
              <svg
                v-else
                class="block h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <!-- Desktop user info -->
            <span class="hidden sm:block text-sm text-gray-700 mr-4">{{ authStore.adminName }}</span>
            <button
              @click="handleLogout"
              class="hidden sm:block bg-white text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile menu -->
      <div v-if="mobileMenuOpen" class="sm:hidden">
        <div class="pt-2 pb-3 space-y-1">
          <NuxtLink
            to="/"
            @click="mobileMenuOpen = false"
            class="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            active-class="!bg-indigo-50 !border-indigo-500 !text-indigo-700"
          >
            Dashboard
          </NuxtLink>
          <NuxtLink
            to="/products"
            @click="mobileMenuOpen = false"
            class="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            active-class="!bg-indigo-50 !border-indigo-500 !text-indigo-700"
          >
            Products
          </NuxtLink>
          <NuxtLink
            to="/categories"
            @click="mobileMenuOpen = false"
            class="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            active-class="!bg-indigo-50 !border-indigo-500 !text-indigo-700"
          >
            Categories
          </NuxtLink>
          <NuxtLink
            to="/reviews"
            @click="mobileMenuOpen = false"
            class="border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            active-class="!bg-indigo-50 !border-indigo-500 !text-indigo-700"
          >
            Reviews
          </NuxtLink>
        </div>
        <div class="pt-4 pb-3 border-t border-gray-200">
          <div class="flex items-center px-4">
            <div class="flex-shrink-0">
              <svg class="h-10 w-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <div class="ml-3">
              <div class="text-base font-medium text-gray-800">{{ authStore.adminName }}</div>
              <div class="text-sm font-medium text-gray-500">{{ authStore.admin?.email }}</div>
            </div>
          </div>
          <div class="mt-3 px-2">
            <button
              @click="handleLogout"
              class="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const mobileMenuOpen = ref(false)

const handleLogout = async () => {
  await authStore.logout()
  navigateTo('/login')
}
</script>

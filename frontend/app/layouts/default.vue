<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <NuxtLink to="/" class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            Swordfighters
          </NuxtLink>
          <nav class="hidden md:flex space-x-8">
            <NuxtLink to="/" class="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
              Products
            </NuxtLink>
            <NuxtLink to="/categories" class="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
              Categories
            </NuxtLink>
          </nav>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>

    <!-- Footer with FTC Disclosure -->
    <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16 transition-colors duration-300">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="text-sm text-gray-600 dark:text-gray-400 text-center">
          <p class="mb-2">
            <strong>FTC Disclosure:</strong> Swordfighters participates in affiliate marketing programs.
            When you click on links and make purchases through our site, we may receive monetary compensation.
            This helps support our work in curating quality products for our community.
          </p>
          <p class="text-gray-500 dark:text-gray-500">
            © {{ new Date().getFullYear() }} Swordfighters. All rights reserved.
          </p>
        </div>
      </div>
    </footer>

    <!-- Floating dark mode toggle -->
    <DarkModeToggle />
  </div>
</template>

<script setup lang="ts">
const { init } = useDarkMode()
onMounted(() => {
  init()
})
</script>

<style>
a.router-link-active {
  @apply text-indigo-600 dark:text-indigo-400 font-medium;
}
</style>

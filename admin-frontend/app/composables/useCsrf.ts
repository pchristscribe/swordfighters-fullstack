import { getOrCreateCsrfToken, rotateCsrfToken, clearCsrfToken } from '~/utils/security'

/**
 * Composable for CSRF token management.
 * Provides the current token and helpers for including it in state-changing requests.
 */
export function useCsrf() {
  const getToken = () => getOrCreateCsrfToken()

  const csrfHeaders = (): Record<string, string> => {
    const token = getToken()
    if (!token) return {}
    return { 'X-CSRF-Token': token }
  }

  return {
    getToken,
    csrfHeaders,
    rotateToken: rotateCsrfToken,
    clearToken: clearCsrfToken,
  }
}

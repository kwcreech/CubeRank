/** Spring Boot API origin (no trailing slash). */
export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"
}

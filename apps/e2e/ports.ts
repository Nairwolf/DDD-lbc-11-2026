// The suite runs its own API and frontend on ports of their own, so it never
// touches the state of `make dev` (3000/8080). Mailcatcher is shared: tests
// tell their emails apart by a unique recipient.
export const API_PORT = 18080
export const WEB_PORT = 13000
export const WEB_URL = `http://localhost:${WEB_PORT}`
export const API_URL = `http://localhost:${API_PORT}`
export const MAILCATCHER_URL =
  process.env.MAILCATCHER_URL ?? 'http://localhost:1080'

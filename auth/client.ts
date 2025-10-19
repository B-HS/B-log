import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
    baseURL: typeof window !== 'undefined' ? window.location.origin : 'https://log.gumyo.net',
})

export type Session = typeof authClient.$Infer.Session

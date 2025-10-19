import { Hono } from 'hono'
import { createAuth } from '../auth'

export const createAuthRouter = () => {
    const router = new Hono<{ Bindings: CloudflareBindings }>()

    router.all('*', async (c) => {
        const url = new URL(c.req.url)
        const baseURL = `${url.protocol}//${url.host}`
        const auth = createAuth(c.env, baseURL)
        return auth.handler(c.req.raw)
    })

    return router
}

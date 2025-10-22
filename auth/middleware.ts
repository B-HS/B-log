import { getAuthFromContext } from './utils'
import type { Context } from 'hono'

export const authMiddleware = async (c: Context<{ Bindings: CloudflareBindings; Variables: CloudflareVariables }>, next: () => Promise<void>) => {
    const auth = getAuthFromContext(c)
    const session = await auth.api.getSession({
        headers: c.req.raw.headers,
    })

    if (!session) {
        return c.json({ error: 'Unauthorized' }, 401)
    }

    c.set('userId', session.user.id)
    await next()
}

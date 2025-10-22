import type { Context } from 'hono'
import { createAuth } from '.'

export const getAuthFromContext = (c: Context<{ Bindings: CloudflareBindings; Variables: CloudflareVariables }>) => {
    const url = new URL(c.req.url)
    const baseURL = `${url.protocol}//${url.host}`
    return createAuth(c.env, baseURL)
}

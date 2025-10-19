import { Hono } from 'hono'
import { createAuth } from '../auth'
import { UserService } from '../services'

export const createUserRouter = () => {
    const router = new Hono<{ Bindings: CloudflareBindings; Variables: CloudflareVariables }>()

    router.use('*', async (c, next) => {
        const url = new URL(c.req.url)
        const baseURL = `${url.protocol}//${url.host}`
        const auth = createAuth(c.env, baseURL)
        const session = await auth.api.getSession({
            headers: c.req.raw.headers,
        })

        if (!session) {
            return c.json({ error: 'Unauthorized' }, 401)
        }

        c.set('userId', session.user.id)
        await next()
    })

    router.patch('/name', async (c) => {
        const userId = c.get('userId')
        const { name } = await c.req.json<{ name: string }>()

        if (!name || name.trim().length === 0) {
            return c.json({ error: 'Name is required' }, 400)
        }

        const service = UserService(c.env.DB)
        const updatedUser = await service.updateUserName(userId, name)
        return c.json(updatedUser)
    })

    router.patch('/image', async (c) => {
        const userId = c.get('userId')
        const { image } = await c.req.json<{ image: string }>()

        if (!image || image.trim().length === 0) {
            return c.json({ error: 'Image URL is required' }, 400)
        }

        const service = UserService(c.env.DB)
        const updatedUser = await service.updateUserImage(userId, image)
        return c.json(updatedUser)
    })

    router.patch('/profile', async (c) => {
        const userId = c.get('userId')
        const data = await c.req.json<{ name?: string; image?: string }>()

        if (!data.name && !data.image) {
            return c.json({ error: 'At least one field (name or image) is required' }, 400)
        }

        const service = UserService(c.env.DB)
        const updatedUser = await service.updateUserProfile(userId, data)
        return c.json(updatedUser)
    })

    return router
}

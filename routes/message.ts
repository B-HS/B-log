import { Hono } from 'hono'
import { createAuth } from '../auth'
import { MessageService } from '../services'

export const createMessageRouter = () => {
    const router = new Hono<{ Bindings: CloudflareBindings; Variables: CloudflareVariables }>()

    router.get('/', async (c) => {
        const page = parseInt(c.req.query('page') || '1')
        const size = parseInt(c.req.query('size') || '10')

        const service = MessageService(c.env.DB)
        const result = await service.getMessages(page, size)
        return c.json(result)
    })

    router.get('/user/:userId', async (c) => {
        const userId = c.req.param('userId')
        const page = parseInt(c.req.query('page') || '1')
        const size = parseInt(c.req.query('size') || '10')

        const service = MessageService(c.env.DB)
        const result = await service.getMessages(page, size, userId)
        return c.json(result)
    })

    router.post('/', async (c) => {
        const url = new URL(c.req.url)
        const baseURL = `${url.protocol}//${url.host}`
        const auth = createAuth(c.env, baseURL)
        const session = await auth.api.getSession({
            headers: c.req.raw.headers,
        })

        if (!session) {
            return c.json({ error: 'Unauthorized' }, 401)
        }

        const userId = session.user.id
        const { body, imageIds } = await c.req.json<{ body: string; imageIds: string[] }>()

        if (!body || body.trim().length === 0) {
            return c.json({ error: 'Message body is required' }, 400)
        }

        try {
            const service = MessageService(c.env.DB)
            const message = await service.createMessage(userId, body, imageIds || [])
            return c.json(message, 201)
        } catch (error) {
            console.error('Create message error:', error)
            return c.json({ error: error instanceof Error ? error.message : 'Failed to create message' }, 500)
        }
    })

    router.delete('/:id', async (c) => {
        const url = new URL(c.req.url)
        const baseURL = `${url.protocol}//${url.host}`
        const auth = createAuth(c.env, baseURL)
        const session = await auth.api.getSession({
            headers: c.req.raw.headers,
        })

        if (!session) {
            return c.json({ error: 'Unauthorized' }, 401)
        }

        const userId = session.user.id
        const messageId = c.req.param('id')

        try {
            const service = MessageService(c.env.DB)
            const result = await service.softDeleteMessage(messageId, userId)
            return c.json(result)
        } catch (error) {
            console.error('Delete message error:', error)
            if (error instanceof Error) {
                if (error.message === 'Message not found') {
                    return c.json({ error: 'Message not found' }, 404)
                }
                if (error.message === 'Unauthorized') {
                    return c.json({ error: 'Unauthorized' }, 403)
                }
            }
            return c.json({ error: 'Failed to delete message' }, 500)
        }
    })

    return router
}

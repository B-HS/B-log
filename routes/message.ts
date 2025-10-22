import { authMiddleware } from '@/auth/middleware'
import { handleError, validateRequired } from '@/utils'
import { Hono } from 'hono'
import { MessageService } from '../services'

export const createMessageRouter = () => {
    const router = new Hono<{ Bindings: CloudflareBindings; Variables: CloudflareVariables }>()

    router.get('/', async (c) => {
        const page = parseInt(c.req.query('page') || '1')
        const size = parseInt(c.req.query('size') || '10')
        const currentUserId = c.req.query('currentUserId')

        const service = MessageService(c.env.DB)
        const result = await service.getMessages(page, size, undefined, currentUserId)
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

    router.post('/', authMiddleware, async (c) => {
        const userId = c.get('userId')
        const { body, imageIds } = await c.req.json<{ body: string; imageIds: string[] }>()

        try {
            const validBody = validateRequired(body, 'Message body')
            const service = MessageService(c.env.DB)
            const message = await service.createMessage(userId, validBody, imageIds || [])
            return c.json(message, 201)
        } catch (error) {
            return handleError(c, error, 'Create message error')
        }
    })

    router.post('/reply', authMiddleware, async (c) => {
        const userId = c.get('userId')
        const { replyToId, body, imageIds } = await c.req.json<{ replyToId: string; body: string; imageIds: string[] }>()

        try {
            const validReplyToId = validateRequired(replyToId, 'Reply to message ID')
            const validBody = validateRequired(body, 'Reply body')
            const service = MessageService(c.env.DB)
            const reply = await service.createReply(userId, validReplyToId, validBody, imageIds || [])
            return c.json(reply, 201)
        } catch (error) {
            return handleError(c, error, 'Create reply error')
        }
    })

    router.get('/:id/replies', async (c) => {
        const messageId = c.req.param('id')
        const page = parseInt(c.req.query('page') || '1')
        const size = parseInt(c.req.query('size') || '10')

        try {
            const service = MessageService(c.env.DB)
            const result = await service.getRepliesByMessageId(messageId, page, size)
            return c.json(result)
        } catch (error) {
            return handleError(c, error, 'Get replies error')
        }
    })

    router.post('/:id/retweet', authMiddleware, async (c) => {
        const userId = c.get('userId')
        const messageId = c.req.param('id')

        try {
            const service = MessageService(c.env.DB)
            const retweet = await service.createRetweet(userId, messageId)
            return c.json(retweet, 201)
        } catch (error) {
            return handleError(c, error, 'Create retweet error')
        }
    })

    router.delete('/:id/retweet', authMiddleware, async (c) => {
        const userId = c.get('userId')
        const messageId = c.req.param('id')

        try {
            const service = MessageService(c.env.DB)
            const result = await service.deleteRetweet(userId, messageId)
            return c.json(result)
        } catch (error) {
            return handleError(c, error, 'Delete retweet error')
        }
    })

    router.get('/:id', async (c) => {
        const messageId = c.req.param('id')
        console.log('[GET /:id] Fetching message:', messageId)

        try {
            const service = MessageService(c.env.DB)
            const message = await service.getMessageById(messageId)

            console.log('[GET /:id] Message found:', !!message)

            if (!message) {
                console.log('[GET /:id] Message not found for id:', messageId)
                return c.json({ error: 'Message not found' }, 404)
            }

            return c.json(message)
        } catch (error) {
            console.error('[GET /:id] Error:', error)
            return handleError(c, error, 'Get message error')
        }
    })

    router.delete('/:id', authMiddleware, async (c) => {
        const userId = c.get('userId')
        const messageId = c.req.param('id')

        try {
            const service = MessageService(c.env.DB)
            const result = await service.softDeleteMessage(messageId, userId)
            return c.json(result)
        } catch (error) {
            return handleError(c, error, 'Delete message error')
        }
    })

    return router
}

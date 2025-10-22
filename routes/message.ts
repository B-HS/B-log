import { authMiddleware } from '@/auth/middleware'
import { handleError, validateRequired } from '@/utils'
import { Hono } from 'hono'
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

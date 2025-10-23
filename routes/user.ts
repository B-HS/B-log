import { authMiddleware } from '@/auth/middleware'
import { validateRequired, handleError } from '@/utils'
import { Hono } from 'hono'
import { UserService } from '../services'

export const createUserRouter = () => {
    const router = new Hono<{ Bindings: CloudflareBindings; Variables: CloudflareVariables }>()

    router.get('/:userId', async (c) => {
        const userId = c.req.param('userId')
        const currentUserId = c.req.query('currentUserId')

        try {
            const service = UserService(c.env.DB)
            const profile = await service.getUserProfile(userId, currentUserId)

            if (!profile) {
                return c.json({ error: 'User not found' }, 404)
            }

            return c.json(profile)
        } catch (error) {
            return handleError(c, error, 'Get user profile error')
        }
    })

    router.patch('/name', authMiddleware, async (c) => {
        const userId = c.get('userId')
        const { name } = await c.req.json<{ name: string }>()

        try {
            const validName = validateRequired(name, 'Name')
            const service = UserService(c.env.DB)
            const updatedUser = await service.updateUserName(userId, validName)
            return c.json(updatedUser)
        } catch (error) {
            return handleError(c, error, 'Update user name error')
        }
    })

    router.patch('/image', authMiddleware, async (c) => {
        const userId = c.get('userId')
        const { image } = await c.req.json<{ image: string }>()

        try {
            const validImage = validateRequired(image, 'Image URL')
            const service = UserService(c.env.DB)
            const updatedUser = await service.updateUserImage(userId, validImage)
            return c.json(updatedUser)
        } catch (error) {
            return handleError(c, error, 'Update user image error')
        }
    })

    router.patch('/profile', authMiddleware, async (c) => {
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

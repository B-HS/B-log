import { authMiddleware } from '@/auth/middleware'
import { handleError } from '@/utils'
import { Hono } from 'hono'
import { FollowService } from '../services'

export const createFollowRouter = () => {
    const router = new Hono<{ Bindings: CloudflareBindings; Variables: CloudflareVariables }>()

    router.post('/:userId', authMiddleware, async (c) => {
        const currentUserId = c.get('userId')
        const targetUserId = c.req.param('userId')

        try {
            const service = FollowService(c.env.DB)
            const follow = await service.followUser(currentUserId, targetUserId)
            return c.json(follow, 201)
        } catch (error) {
            return handleError(c, error, 'Follow user error')
        }
    })

    router.delete('/:userId', authMiddleware, async (c) => {
        const currentUserId = c.get('userId')
        const targetUserId = c.req.param('userId')

        try {
            const service = FollowService(c.env.DB)
            const result = await service.unfollowUser(currentUserId, targetUserId)
            return c.json(result)
        } catch (error) {
            return handleError(c, error, 'Unfollow user error')
        }
    })

    router.get('/:userId/followers', async (c) => {
        const userId = c.req.param('userId')
        const page = parseInt(c.req.query('page') || '1')
        const size = parseInt(c.req.query('size') || '20')

        try {
            const service = FollowService(c.env.DB)
            const result = await service.getFollowers(userId, page, size)
            return c.json(result)
        } catch (error) {
            return handleError(c, error, 'Get followers error')
        }
    })

    router.get('/:userId/following', async (c) => {
        const userId = c.req.param('userId')
        const page = parseInt(c.req.query('page') || '1')
        const size = parseInt(c.req.query('size') || '20')

        try {
            const service = FollowService(c.env.DB)
            const result = await service.getFollowing(userId, page, size)
            return c.json(result)
        } catch (error) {
            return handleError(c, error, 'Get following error')
        }
    })

    return router
}

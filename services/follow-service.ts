import { FollowRepository } from '@/repository'
import type { FollowWithUser } from '@/types'

export const FollowService = (db: D1Database) => {
    const followRepo = FollowRepository(db)

    const followUser = async (followerId: string, followingId: string) => {
        if (followerId === followingId) {
            throw new Error('Cannot follow yourself')
        }

        const exists = await followRepo.checkFollowExists(followerId, followingId)
        if (exists) {
            throw new Error('Already following this user')
        }

        return await followRepo.createFollow(followerId, followingId)
    }

    const unfollowUser = async (followerId: string, followingId: string) => {
        if (followerId === followingId) {
            throw new Error('Cannot unfollow yourself')
        }

        const exists = await followRepo.checkFollowExists(followerId, followingId)
        if (!exists) {
            throw new Error('Not following this user')
        }

        await followRepo.deleteFollow(followerId, followingId)
        return { success: true }
    }

    const getFollowers = async (userId: string, page: number, size: number) => {
        const totalElements = await followRepo.countFollowers(userId)
        const totalPages = Math.ceil(totalElements / size)

        const follows = await followRepo.getFollowersByUserId(userId, page, size)

        const content: FollowWithUser[] = follows.map((f) => ({
            ...f.follow,
            user: {
                id: f.user.id,
                name: f.user.name,
                email: f.user.email,
                image: f.user.image,
            },
        }))

        return {
            prev: page > 1 ? page - 1 : null,
            next: page < totalPages ? page + 1 : null,
            totalElements,
            totalPages,
            content,
        }
    }

    const getFollowing = async (userId: string, page: number, size: number) => {
        const totalElements = await followRepo.countFollowing(userId)
        const totalPages = Math.ceil(totalElements / size)

        const follows = await followRepo.getFollowingByUserId(userId, page, size)

        const content: FollowWithUser[] = follows.map((f) => ({
            ...f.follow,
            user: {
                id: f.user.id,
                name: f.user.name,
                email: f.user.email,
                image: f.user.image,
            },
        }))

        return {
            prev: page > 1 ? page - 1 : null,
            next: page < totalPages ? page + 1 : null,
            totalElements,
            totalPages,
            content,
        }
    }

    const getFollowStats = async (userId: string) => {
        const followersCount = await followRepo.countFollowers(userId)
        const followingCount = await followRepo.countFollowing(userId)

        return {
            followersCount,
            followingCount,
        }
    }

    return {
        followUser,
        unfollowUser,
        getFollowers,
        getFollowing,
        getFollowStats,
    }
}

import { UserRepository, FollowRepository } from '@/repository'

export const UserService = (db: D1Database) => {
    const userRepo = UserRepository(db)
    const followRepo = FollowRepository(db)

    const getUserProfile = async (userId: string, currentUserId?: string) => {
        const user = await userRepo.getUserById(userId)

        if (!user) {
            return null
        }

        const followersCount = await followRepo.countFollowers(userId)
        const followingCount = await followRepo.countFollowing(userId)

        let isFollowing = false
        let isFollowedBy = false

        if (currentUserId && currentUserId !== userId) {
            const status = await followRepo.checkFollowStatus(currentUserId, userId)
            isFollowing = status.isFollowing
            isFollowedBy = status.isFollowedBy
        }

        return {
            ...user,
            followersCount,
            followingCount,
            isFollowing,
            isFollowedBy,
        }
    }

    const updateUserName = async (userId: string, name: string) => {
        return await userRepo.updateUser(userId, { name, updatedAt: new Date() })
    }

    const updateUserImage = async (userId: string, image: string) => {
        return await userRepo.updateUser(userId, { image, updatedAt: new Date() })
    }

    const updateUserProfile = async (userId: string, data: { name?: string; image?: string }) => {
        const updateData: { name?: string; image?: string; updatedAt: Date } = {
            updatedAt: new Date(),
        }

        if (data.name !== undefined) {
            updateData.name = data.name
        }

        if (data.image !== undefined) {
            updateData.image = data.image
        }

        return await userRepo.updateUser(userId, updateData)
    }

    return {
        getUserProfile,
        updateUserName,
        updateUserImage,
        updateUserProfile,
    }
}

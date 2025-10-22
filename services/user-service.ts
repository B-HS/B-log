import { UserRepository } from '@/repository'

export const UserService = (db: D1Database) => {
    const userRepo = UserRepository(db)

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
        updateUserName,
        updateUserImage,
        updateUserProfile,
    }
}

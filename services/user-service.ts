import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../db/schema'

export const UserService = (db: D1Database) => {
    const drizzleDb = drizzle(db, { schema })
    const updateUserName = async (userId: string, name: string) => {
        const [updatedUser] = await drizzleDb.update(schema.user).set({ name, updatedAt: new Date() }).where(eq(schema.user.id, userId)).returning()
        return updatedUser
    }

    const updateUserImage = async (userId: string, image: string) => {
        const [updatedUser] = await drizzleDb.update(schema.user).set({ image, updatedAt: new Date() }).where(eq(schema.user.id, userId)).returning()
        return updatedUser
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

        const [updatedUser] = await drizzleDb.update(schema.user).set(updateData).where(eq(schema.user.id, userId)).returning()
        return updatedUser
    }

    return {
        updateUserName,
        updateUserImage,
        updateUserProfile,
    }
}

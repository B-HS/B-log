import { drizzle } from 'drizzle-orm/d1'
import { eq, sql } from 'drizzle-orm'
import * as schema from '@/db/schema'

export const UserRepository = (db: D1Database) => {
    const drizzleDb = drizzle(db, { schema })

    const getUserById = async (userId: string) => {
        const result = await drizzleDb.select().from(schema.user).where(eq(schema.user.id, userId)).limit(1).all()
        return result[0] || null
    }

    const getUsersByIds = async (userIds: string[]) => {
        if (userIds.length === 0) return []

        return await drizzleDb
            .select()
            .from(schema.user)
            .where(sql`${schema.user.id} IN ${userIds}`)
            .all()
    }

    const updateUser = async (userId: string, data: { name?: string; image?: string; updatedAt: Date }) => {
        const [updatedUser] = await drizzleDb.update(schema.user).set(data).where(eq(schema.user.id, userId)).returning()
        return updatedUser
    }

    return {
        getUserById,
        getUsersByIds,
        updateUser,
    }
}

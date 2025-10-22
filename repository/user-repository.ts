import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import * as schema from '@/db/schema'

export const UserRepository = (db: D1Database) => {
    const drizzleDb = drizzle(db, { schema })

    const updateUser = async (userId: string, data: { name?: string; image?: string; updatedAt: Date }) => {
        const [updatedUser] = await drizzleDb.update(schema.user).set(data).where(eq(schema.user.id, userId)).returning()
        return updatedUser
    }

    return {
        updateUser,
    }
}

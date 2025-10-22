import { drizzle } from 'drizzle-orm/d1'
import { eq, desc, and, isNull, sql, SQL } from 'drizzle-orm'
import * as schema from '@/db/schema'

export const MessageRepository = (db: D1Database) => {
    const drizzleDb = drizzle(db, { schema })

    const countMessages = async (whereConditions: SQL | undefined) => {
        const [{ count }] = await drizzleDb
            .select({ count: sql<number>`count(*)` })
            .from(schema.message)
            .where(whereConditions)
            .all()
        return count
    }

    const findMessages = async (whereConditions: SQL | undefined, page: number, size: number) => {
        const offset = (page - 1) * size

        return await drizzleDb
            .select({
                message: schema.message,
                user: schema.user,
            })
            .from(schema.message)
            .innerJoin(schema.user, eq(schema.message.userId, schema.user.id))
            .where(whereConditions)
            .orderBy(desc(schema.message.createdAt))
            .limit(size)
            .offset(offset)
            .all()
    }

    const findMessageById = async (messageId: string) => {
        return await drizzleDb
            .select()
            .from(schema.message)
            .where(and(eq(schema.message.id, messageId), isNull(schema.message.deletedAt)))
            .limit(1)
            .all()
    }

    const createMessage = async (data: { id: string; userId: string; body: string; createdAt: Date; updatedAt: Date; deletedAt: null }) => {
        const [newMessage] = await drizzleDb.insert(schema.message).values(data).returning()
        return newMessage
    }

    const updateMessage = async (messageId: string, data: { deletedAt: Date }) => {
        await drizzleDb.update(schema.message).set(data).where(eq(schema.message.id, messageId))
    }

    return {
        countMessages,
        findMessages,
        findMessageById,
        createMessage,
        updateMessage,
    }
}

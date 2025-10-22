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

    const findMessagesByIds = async (messageIds: string[]) => {
        if (messageIds.length === 0) return []

        return await drizzleDb
            .select({
                message: schema.message,
                user: schema.user,
            })
            .from(schema.message)
            .innerJoin(schema.user, eq(schema.message.userId, schema.user.id))
            .where(and(sql`${schema.message.id} IN ${messageIds}`, isNull(schema.message.deletedAt)))
            .all()
    }

    const findRepliesByMessageId = async (messageId: string, page: number, size: number) => {
        const offset = (page - 1) * size

        return await drizzleDb
            .select({
                message: schema.message,
                user: schema.user,
            })
            .from(schema.message)
            .innerJoin(schema.user, eq(schema.message.userId, schema.user.id))
            .where(and(eq(schema.message.replyToId, messageId), isNull(schema.message.deletedAt)))
            .orderBy(desc(schema.message.createdAt))
            .limit(size)
            .offset(offset)
            .all()
    }

    const countRepliesByMessageId = async (messageId: string) => {
        const [{ count }] = await drizzleDb
            .select({ count: sql<number>`count(*)` })
            .from(schema.message)
            .where(and(eq(schema.message.replyToId, messageId), isNull(schema.message.deletedAt)))
            .all()
        return count
    }

    const countRetweetsByMessageId = async (messageId: string) => {
        const [{ count }] = await drizzleDb
            .select({ count: sql<number>`count(*)` })
            .from(schema.message)
            .where(and(eq(schema.message.retweetOfId, messageId), isNull(schema.message.deletedAt)))
            .all()
        return count
    }

    const findMessageById = async (messageId: string) => {
        return await drizzleDb
            .select()
            .from(schema.message)
            .where(and(eq(schema.message.id, messageId), isNull(schema.message.deletedAt)))
            .limit(1)
            .all()
    }

    const createMessage = async (data: { id: string; userId: string; body: string; createdAt: Date; updatedAt: Date; deletedAt: null; replyToId?: string | null; retweetOfId?: string | null }) => {
        const [newMessage] = await drizzleDb.insert(schema.message).values(data).returning()
        return newMessage
    }

    const checkExistingRetweet = async (userId: string, retweetOfId: string) => {
        const existing = await drizzleDb
            .select()
            .from(schema.message)
            .where(and(eq(schema.message.userId, userId), eq(schema.message.retweetOfId, retweetOfId), isNull(schema.message.deletedAt)))
            .limit(1)
            .all()
        return existing.length > 0
    }

    const findUserRetweetsForMessages = async (userId: string, messageIds: string[]) => {
        if (messageIds.length === 0) return []

        return await drizzleDb
            .select({ retweetOfId: schema.message.retweetOfId })
            .from(schema.message)
            .where(and(
                eq(schema.message.userId, userId),
                sql`${schema.message.retweetOfId} IN ${messageIds}`,
                isNull(schema.message.deletedAt)
            ))
            .all()
    }

    const updateMessage = async (messageId: string, data: { deletedAt: Date }) => {
        await drizzleDb.update(schema.message).set(data).where(eq(schema.message.id, messageId))
    }

    const findRetweetByUserAndMessage = async (userId: string, retweetOfId: string) => {
        return await drizzleDb
            .select()
            .from(schema.message)
            .where(and(eq(schema.message.userId, userId), eq(schema.message.retweetOfId, retweetOfId), isNull(schema.message.deletedAt)))
            .limit(1)
            .all()
    }

    return {
        countMessages,
        findMessages,
        findMessagesByIds,
        findMessageById,
        findRepliesByMessageId,
        countRepliesByMessageId,
        countRetweetsByMessageId,
        createMessage,
        updateMessage,
        checkExistingRetweet,
        findUserRetweetsForMessages,
        findRetweetByUserAndMessage,
    }
}

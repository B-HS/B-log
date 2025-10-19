import { drizzle } from 'drizzle-orm/d1'
import { eq, desc, and, isNull, inArray, sql } from 'drizzle-orm'
import * as schema from '../db/schema'

type PaginatedResponse<T> = {
    prev: number | null
    next: number | null
    totalElements: number
    totalPages: number
    content: T[]
}

type MessageWithImages = typeof schema.message.$inferSelect & {
    images: (typeof schema.imageAsset.$inferSelect)[]
    user: {
        id: string
        name: string
        email: string
        image: string | null
    }
}

export const MessageService = (db: D1Database) => {
    const drizzleDb = drizzle(db, { schema })

    const getMessages = async (page: number, size: number, userId?: string): Promise<PaginatedResponse<MessageWithImages>> => {
        const whereConditions = userId ? and(isNull(schema.message.deletedAt), eq(schema.message.userId, userId)) : isNull(schema.message.deletedAt)

        const [{ count }] = await drizzleDb
            .select({ count: sql<number>`count(*)` })
            .from(schema.message)
            .where(whereConditions)
            .all()

        const totalElements = count
        const totalPages = Math.ceil(totalElements / size)
        const offset = (page - 1) * size

        const messages = await drizzleDb
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

        if (messages.length === 0) {
            return {
                prev: page > 1 ? page - 1 : null,
                next: null,
                totalElements,
                totalPages,
                content: [],
            }
        }

        const messageIds = messages.map((m) => m.message.id)

        const messageImagesData = await drizzleDb
            .select({
                messageId: schema.messageImage.messageId,
                imageId: schema.messageImage.imageId,
                order: schema.messageImage.order,
                image: schema.imageAsset,
            })
            .from(schema.messageImage)
            .innerJoin(schema.imageAsset, eq(schema.messageImage.imageId, schema.imageAsset.id))
            .where(inArray(schema.messageImage.messageId, messageIds))
            .orderBy(schema.messageImage.order)
            .all()

        const content = messages.map((m) => ({
            ...m.message,
            user: {
                id: m.user.id,
                name: m.user.name,
                email: m.user.email,
                image: m.user.image,
            },
            images: messageImagesData.filter((mi) => mi.messageId === m.message.id).map((mi) => mi.image),
        }))

        return {
            prev: page > 1 ? page - 1 : null,
            next: page < totalPages ? page + 1 : null,
            totalElements,
            totalPages,
            content,
        }
    }

    const createMessage = async (userId: string, body: string, imageIds: string[]) => {
        const messageId = crypto.randomUUID()

        const [newMessage] = await drizzleDb
            .insert(schema.message)
            .values({
                id: messageId,
                userId,
                body,
                createdAt: new Date(),
                updatedAt: new Date(),
                deletedAt: null,
            })
            .returning()

        if (imageIds.length > 0) {
            await drizzleDb.insert(schema.messageImage).values(
                imageIds.map((imageId, index) => ({
                    messageId,
                    imageId,
                    order: index,
                    createdAt: new Date(),
                })),
            )
        }

        return newMessage
    }

    const softDeleteMessage = async (messageId: string, userId: string) => {
        const existing = await drizzleDb
            .select()
            .from(schema.message)
            .where(and(eq(schema.message.id, messageId), isNull(schema.message.deletedAt)))
            .limit(1)
            .all()

        if (existing.length === 0) {
            throw new Error('Message not found')
        }

        if (existing[0].userId !== userId) {
            throw new Error('Unauthorized')
        }

        await drizzleDb.update(schema.message).set({ deletedAt: new Date() }).where(eq(schema.message.id, messageId))

        return { success: true }
    }

    return {
        getMessages,
        createMessage,
        softDeleteMessage,
    }
}

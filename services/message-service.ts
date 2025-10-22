import { and, isNull, eq } from 'drizzle-orm'
import * as schema from '@/db/schema'
import type { MessageWithImages, PaginatedResponse, ImageAssetWithUrl } from '@/types'
import { MessageRepository, MessageImageRepository } from '@/repository'
import { getImageUrl } from '@/utils'

export const MessageService = (db: D1Database) => {
    const messageRepo = MessageRepository(db)
    const messageImageRepo = MessageImageRepository(db)

    const getMessages = async (page: number, size: number, userId?: string): Promise<PaginatedResponse<MessageWithImages>> => {
        const whereConditions = userId ? and(isNull(schema.message.deletedAt), eq(schema.message.userId, userId)) : isNull(schema.message.deletedAt)

        const totalElements = await messageRepo.countMessages(whereConditions)
        const totalPages = Math.ceil(totalElements / size)

        const messages = await messageRepo.findMessages(whereConditions, page, size)

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
        const messageImagesData = await messageImageRepo.findMessageImages(messageIds)

        const content: MessageWithImages[] = messages.map((m) => {
            const images: ImageAssetWithUrl[] = messageImagesData
                .filter((mi) => mi.messageId === m.message.id)
                .map((mi) => ({
                    ...mi.image,
                    url: getImageUrl(mi.image.id, 'thumbnail'),
                }))

            return {
                ...m.message,
                user: {
                    id: m.user.id,
                    name: m.user.name,
                    email: m.user.email,
                    image: m.user.image,
                },
                images,
            }
        })

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

        const newMessage = await messageRepo.createMessage({
            id: messageId,
            userId,
            body,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
        })

        if (imageIds.length > 0) {
            await messageImageRepo.createMessageImages(
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
        const existing = await messageRepo.findMessageById(messageId)

        if (existing.length === 0) {
            throw new Error('Message not found')
        }

        if (existing[0].userId !== userId) {
            throw new Error('Unauthorized')
        }

        await messageRepo.updateMessage(messageId, { deletedAt: new Date() })

        return { success: true }
    }

    return {
        getMessages,
        createMessage,
        softDeleteMessage,
    }
}

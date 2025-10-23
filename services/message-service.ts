import { and, isNull, eq } from 'drizzle-orm'
import * as schema from '@/db/schema'
import type { MessageWithImages, ImageAssetWithUrl } from '@/types'
import { MessageRepository, MessageImageRepository } from '@/repository'
import { getImageUrl } from '@/utils'

export const MessageService = (db: D1Database) => {
    const messageRepo = MessageRepository(db)
    const messageImageRepo = MessageImageRepository(db)

    const getMessages = async (page: number, size: number, userId?: string, currentUserId?: string) => {
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
        const replyToIds = messages.map((m) => m.message.replyToId).filter((id): id is string => id !== null && id !== undefined)
        const retweetOfIds = messages.map((m) => m.message.retweetOfId).filter((id): id is string => id !== null && id !== undefined)

        const relatedMessageIds = [...new Set([...replyToIds, ...retweetOfIds])]
        const relatedMessages = relatedMessageIds.length > 0 ? await messageRepo.findMessagesByIds(relatedMessageIds) : []

        const relatedMessagesMap = new Map(relatedMessages.map(rm => [rm.message.id, rm]))

        const replyCounts = await Promise.all(messageIds.map(async (id) => ({
            messageId: id,
            count: await messageRepo.countRepliesByMessageId(id)
        })))
        const replyCountMap = new Map(replyCounts.map(rc => [rc.messageId, rc.count]))

        const retweetCounts = await Promise.all(messageIds.map(async (id) => ({
            messageId: id,
            count: await messageRepo.countRetweetsByMessageId(id)
        })))
        const retweetCountMap = new Map(retweetCounts.map(rc => [rc.messageId, rc.count]))

        const checkIds = [...new Set([...messageIds, ...retweetOfIds])]
        const userRetweets = currentUserId ? await messageRepo.findUserRetweetsForMessages(currentUserId, checkIds) : []
        const userRetweetSet = new Set(userRetweets.map(r => r.retweetOfId).filter((id): id is string => id !== null))

        const allImageMessageIds = [...messageIds, ...retweetOfIds]
        const messageImagesData = await messageImageRepo.findMessageImages(allImageMessageIds)

        const content: MessageWithImages[] = messages.map((m) => {
            const images: ImageAssetWithUrl[] = messageImagesData
                .filter((mi) => mi.messageId === m.message.id)
                .map((mi) => ({
                    ...mi.image,
                    url: getImageUrl(mi.image.id, 'thumbnail'),
                }))

            const replyTo = m.message.replyToId && relatedMessagesMap.has(m.message.replyToId) ? (() => {
                const replyToData = relatedMessagesMap.get(m.message.replyToId!)!
                return {
                    id: replyToData.message.id,
                    userId: replyToData.message.userId,
                    body: replyToData.message.body,
                    user: {
                        id: replyToData.user.id,
                        name: replyToData.user.name,
                        email: replyToData.user.email,
                        image: replyToData.user.image,
                    },
                }
            })() : undefined

            const retweetOf = m.message.retweetOfId && relatedMessagesMap.has(m.message.retweetOfId) ? (() => {
                const retweetOfData = relatedMessagesMap.get(m.message.retweetOfId!)!
                return {
                    id: retweetOfData.message.id,
                    userId: retweetOfData.message.userId,
                    body: retweetOfData.message.body,
                    user: {
                        id: retweetOfData.user.id,
                        name: retweetOfData.user.name,
                        email: retweetOfData.user.email,
                        image: retweetOfData.user.image,
                    },
                    images: messageImagesData
                        .filter((mi) => mi.messageId === retweetOfData.message.id)
                        .map((mi) => ({
                            ...mi.image,
                            url: getImageUrl(mi.image.id, 'thumbnail'),
                        })),
                }
            })() : undefined

            const checkId = m.message.retweetOfId || m.message.id

            return {
                ...m.message,
                user: {
                    id: m.user.id,
                    name: m.user.name,
                    email: m.user.email,
                    image: m.user.image,
                },
                images,
                replyCount: replyCountMap.get(m.message.id) || 0,
                retweetCount: retweetCountMap.get(m.message.id) || 0,
                isRetweeted: userRetweetSet.has(checkId),
                replyTo,
                retweetOf,
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

    const createReply = async (userId: string, replyToId: string, body: string, imageIds: string[]) => {
        const originalMessage = await messageRepo.findMessageById(replyToId)

        if (originalMessage.length === 0) {
            throw new Error('Original message not found')
        }

        const messageId = crypto.randomUUID()

        const newReply = await messageRepo.createMessage({
            id: messageId,
            userId,
            body,
            replyToId,
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

        return newReply
    }

    const createRetweet = async (userId: string, retweetOfId: string) => {
        const originalMessage = await messageRepo.findMessageById(retweetOfId)

        if (originalMessage.length === 0) {
            throw new Error('Original message not found')
        }

        const alreadyRetweeted = await messageRepo.checkExistingRetweet(userId, retweetOfId)

        if (alreadyRetweeted) {
            throw new Error('Already retweeted')
        }

        const messageId = crypto.randomUUID()

        const newRetweet = await messageRepo.createMessage({
            id: messageId,
            userId,
            body: '',
            retweetOfId,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
        })

        return newRetweet
    }

    const deleteRetweet = async (userId: string, retweetOfId: string) => {
        const retweets = await messageRepo.findRetweetByUserAndMessage(userId, retweetOfId)

        if (retweets.length === 0) {
            throw new Error('Retweet not found')
        }

        await messageRepo.updateMessage(retweets[0].id, { deletedAt: new Date() })

        return { success: true }
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

    const getMessageById = async (messageId: string) => {
        const messages = await messageRepo.findMessagesByIds([messageId])

        if (messages.length === 0) {
            return null
        }

        const m = messages[0]

        const replyToIds = m.message.replyToId ? [m.message.replyToId] : []
        const retweetOfIds = m.message.retweetOfId ? [m.message.retweetOfId] : []
        const relatedMessageIds = [...new Set([...replyToIds, ...retweetOfIds])]
        const relatedMessages = relatedMessageIds.length > 0 ? await messageRepo.findMessagesByIds(relatedMessageIds) : []
        const relatedMessagesMap = new Map(relatedMessages.map(rm => [rm.message.id, rm]))

        const allImageMessageIds = [messageId, ...(m.message.retweetOfId ? [m.message.retweetOfId] : [])]
        const messageImagesData = await messageImageRepo.findMessageImages(allImageMessageIds)

        const images: ImageAssetWithUrl[] = messageImagesData
            .filter((mi) => mi.messageId === m.message.id)
            .map((mi) => ({
                ...mi.image,
                url: getImageUrl(mi.image.id, 'thumbnail'),
            }))

        const replyCount = await messageRepo.countRepliesByMessageId(messageId)
        const retweetCount = await messageRepo.countRetweetsByMessageId(messageId)

        const replyTo = m.message.replyToId && relatedMessagesMap.has(m.message.replyToId) ? (() => {
            const replyToData = relatedMessagesMap.get(m.message.replyToId!)!
            return {
                id: replyToData.message.id,
                userId: replyToData.message.userId,
                body: replyToData.message.body,
                user: {
                    id: replyToData.user.id,
                    name: replyToData.user.name,
                    email: replyToData.user.email,
                    image: replyToData.user.image,
                },
            }
        })() : undefined

        const retweetOf = m.message.retweetOfId && relatedMessagesMap.has(m.message.retweetOfId) ? (() => {
            const retweetOfData = relatedMessagesMap.get(m.message.retweetOfId!)!
            return {
                id: retweetOfData.message.id,
                userId: retweetOfData.message.userId,
                body: retweetOfData.message.body,
                user: {
                    id: retweetOfData.user.id,
                    name: retweetOfData.user.name,
                    email: retweetOfData.user.email,
                    image: retweetOfData.user.image,
                },
                images: messageImagesData
                    .filter((mi) => mi.messageId === retweetOfData.message.id)
                    .map((mi) => ({
                        ...mi.image,
                        url: getImageUrl(mi.image.id, 'thumbnail'),
                    })),
            }
        })() : undefined

        return {
            ...m.message,
            user: {
                id: m.user.id,
                name: m.user.name,
                email: m.user.email,
                image: m.user.image,
            },
            images,
            replyCount,
            retweetCount,
            replyTo,
            retweetOf,
        }
    }

    const getRepliesByMessageId = async (messageId: string, page: number, size: number) => {
        const totalElements = await messageRepo.countRepliesByMessageId(messageId)
        const totalPages = Math.ceil(totalElements / size)

        const messages = await messageRepo.findRepliesByMessageId(messageId, page, size)

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

        const replyCounts = await Promise.all(messageIds.map(async (id) => ({
            messageId: id,
            count: await messageRepo.countRepliesByMessageId(id)
        })))
        const replyCountMap = new Map(replyCounts.map(rc => [rc.messageId, rc.count]))

        const retweetCounts = await Promise.all(messageIds.map(async (id) => ({
            messageId: id,
            count: await messageRepo.countRetweetsByMessageId(id)
        })))
        const retweetCountMap = new Map(retweetCounts.map(rc => [rc.messageId, rc.count]))

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
                replyCount: replyCountMap.get(m.message.id) || 0,
                retweetCount: retweetCountMap.get(m.message.id) || 0,
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

    return {
        getMessages,
        getMessageById,
        getRepliesByMessageId,
        createMessage,
        createReply,
        createRetweet,
        deleteRetweet,
        softDeleteMessage,
    }
}

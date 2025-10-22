import { useState, useEffect, useCallback } from 'react'
import { apiClient, ApiError } from '@/api/client'
import type { MessageWithImages } from '@/types'
import { extractImageIds } from '@/utils'

export const useMessageList = (currentUserId?: string) => {
    const [messages, setMessages] = useState<MessageWithImages[]>([])
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchMessages = useCallback(async (pageNum: number, size = 10, replace = false) => {
        if (!replace && (loading || !hasMore)) return

        setLoading(true)
        setError(null)

        try {
            const data = await apiClient.messages.getList({
                page: pageNum,
                size,
                currentUserId,
            })

            if (replace) {
                setMessages(data.content)
            } else {
                setMessages((prev) => [...prev, ...data.content])
            }
            setHasMore(data.next !== null)
        } catch (err) {
            const errorMessage = err instanceof ApiError ? err.message : '메시지를 불러오는데 실패했습니다'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }, [loading, hasMore, currentUserId])

    const createMessage = useCallback(async (body: string, imageUrls: string[]) => {
        const imageIds = extractImageIds(imageUrls)

        try {
            await apiClient.messages.create({ body, imageIds })
            await fetchMessages(1, page * 10, true)
            setPage(1)
        } catch (err) {
            const errorMessage = err instanceof ApiError ? err.message : '메시지 작성에 실패했습니다'
            throw new Error(errorMessage)
        }
    }, [page, fetchMessages])

    const deleteMessage = useCallback(async (messageId: string) => {
        try {
            await apiClient.messages.delete(messageId)
            setMessages((prev) => prev.filter((m) => m.id !== messageId))
            return true
        } catch (err) {
            const errorMessage = err instanceof ApiError ? err.message : '메시지 삭제에 실패했습니다'
            setError(errorMessage)
            return false
        }
    }, [])

    const createReply = useCallback(async (messageId: string, body: string, imageUrls: string[]) => {
        const imageIds = extractImageIds(imageUrls)

        try {
            await apiClient.messages.createReply({ replyToId: messageId, body, imageIds })
            await fetchMessages(1, page * 10, true)
            setPage(1)
        } catch (err) {
            const errorMessage = err instanceof ApiError ? err.message : '답글 작성에 실패했습니다'
            throw new Error(errorMessage)
        }
    }, [page, fetchMessages])

    const createRetweet = useCallback(async (messageId: string) => {
        try {
            await apiClient.messages.createRetweet(messageId)
            await fetchMessages(1, page * 10, true)
            setPage(1)
            return true
        } catch (err) {
            const errorMessage = err instanceof ApiError ? err.message : '리트윗에 실패했습니다'
            setError(errorMessage)
            return false
        }
    }, [page, fetchMessages])

    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            setPage((prev) => prev + 1)
        }
    }, [loading, hasMore])

    const refresh = useCallback(() => {
        setPage(1)
        fetchMessages(1, 10, true)
    }, [fetchMessages])

    useEffect(() => {
        if (page === 1) {
            fetchMessages(1, 10, true)
        } else {
            fetchMessages(page)
        }
    }, [page, currentUserId])

    return {
        messages,
        loading,
        hasMore,
        error,
        createMessage,
        deleteMessage,
        createReply,
        createRetweet,
        loadMore,
        refresh,
    }
}

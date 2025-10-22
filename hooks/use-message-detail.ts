import { useState, useEffect, useCallback } from 'react'
import { apiClient, ApiError } from '@/api/client'
import type { MessageWithImages } from '@/types'
import { extractImageIds } from '@/utils'

export const useMessageDetail = (messageId: string | null) => {
    const [message, setMessage] = useState<MessageWithImages | null>(null)
    const [replies, setReplies] = useState<MessageWithImages[]>([])
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchMessage = useCallback(async () => {
        if (!messageId) return

        setLoading(true)
        setError(null)

        try {
            const data = await apiClient.messages.getById(messageId)
            setMessage(data)
        } catch (err) {
            const errorMessage = err instanceof ApiError ? err.message : '메시지를 불러오는데 실패했습니다'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }, [messageId])

    const fetchReplies = useCallback(async (pageNum: number, size = 10, replace = false) => {
        if (!messageId || (!replace && (loading || !hasMore))) return

        setLoading(true)
        setError(null)

        try {
            const data = await apiClient.messages.getReplies(messageId, { page: pageNum, size })

            if (replace) {
                setReplies(data.content)
            } else {
                setReplies((prev) => [...prev, ...data.content])
            }
            setHasMore(data.next !== null)
        } catch (err) {
            const errorMessage = err instanceof ApiError ? err.message : '답글을 불러오는데 실패했습니다'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }, [messageId, loading, hasMore])

    const deleteMessage = useCallback(async (messageIdToDelete: string) => {
        try {
            await apiClient.messages.delete(messageIdToDelete)

            if (messageIdToDelete === messageId) {
                return 'redirect'
            } else {
                setReplies((prev) => prev.filter((m) => m.id !== messageIdToDelete))
                return 'success'
            }
        } catch (err) {
            const errorMessage = err instanceof ApiError ? err.message : '메시지 삭제에 실패했습니다'
            setError(errorMessage)
            return 'error'
        }
    }, [messageId])

    const createReply = useCallback(async (replyToId: string, body: string, imageUrls: string[]) => {
        const imageIds = extractImageIds(imageUrls)

        try {
            await apiClient.messages.createReply({ replyToId, body, imageIds })
            await fetchReplies(1, page * 10, true)
            setPage(1)
        } catch (err) {
            const errorMessage = err instanceof ApiError ? err.message : '답글 작성에 실패했습니다'
            throw new Error(errorMessage)
        }
    }, [page, fetchReplies])

    const createRetweet = useCallback(async (msgId: string) => {
        try {
            await apiClient.messages.createRetweet(msgId)
            await fetchMessage()
            await fetchReplies(1, page * 10, true)
            setPage(1)
            return true
        } catch (err) {
            const errorMessage = err instanceof ApiError ? err.message : '리트윗에 실패했습니다'
            setError(errorMessage)
            return false
        }
    }, [fetchMessage, fetchReplies, page])

    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            setPage((prev) => prev + 1)
        }
    }, [loading, hasMore])

    useEffect(() => {
        if (messageId) {
            fetchMessage()
        }
    }, [messageId, fetchMessage])

    useEffect(() => {
        if (messageId) {
            if (page === 1) {
                fetchReplies(1, 10, true)
            } else {
                fetchReplies(page)
            }
        }
    }, [page, messageId])

    return {
        message,
        replies,
        loading,
        hasMore,
        error,
        deleteMessage,
        createReply,
        createRetweet,
        loadMore,
    }
}

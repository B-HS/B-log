import type { MessageWithImages, PaginatedResponse } from '@/types'
import { extractImageIds } from '@/utils'
import { useState } from 'react'
import { apiClient } from '@/api/client'

export const useMessages = () => {
    const [messages, setMessages] = useState<MessageWithImages[]>([])
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)

    const fetchMessages = async (pageNum: number, size = 10, replace = false) => {
        if (!replace && (loading || !hasMore)) return

        setLoading(true)
        try {
            const data = await apiClient.messages.getList({ page: pageNum, size })

            if (replace) {
                setMessages(data.content)
            } else {
                setMessages((prev) => [...prev, ...data.content])
            }
            setHasMore(data.next !== null)
        } catch (error) {
            console.error('Failed to fetch messages:', error)
        } finally {
            setLoading(false)
        }
    }

    const createMessage = async (body: string, imageUrls: string[]) => {
        try {
            const imageIds = extractImageIds(imageUrls)
            await apiClient.messages.create({ body, imageIds })
            await fetchMessages(1, page * 10, true)
            setPage(1)
        } catch (error) {
            console.error('Failed to submit message:', error)
        }
    }

    const loadMore = () => {
        setPage((prev) => prev + 1)
    }

    return {
        messages,
        loading,
        hasMore,
        fetchMessages,
        createMessage,
        loadMore,
        page,
    }
}

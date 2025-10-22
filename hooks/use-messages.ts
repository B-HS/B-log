import type { MessageWithImages, PaginatedResponse } from '@/types'
import { extractImageIds } from '@/utils'
import { useState } from 'react'

export const useMessages = () => {
    const [messages, setMessages] = useState<MessageWithImages[]>([])
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)

    const fetchMessages = async (pageNum: number, size = 10, replace = false) => {
        if (!replace && (loading || !hasMore)) return

        setLoading(true)
        try {
            const response = await fetch(`/api/messages?page=${pageNum}&size=${size}`)
            const data: PaginatedResponse<MessageWithImages> = await response.json()

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

            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ body, imageIds }),
            })

            if (!response.ok) {
                throw new Error('Failed to create message')
            }

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

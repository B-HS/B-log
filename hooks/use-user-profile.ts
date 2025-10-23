import { useState, useEffect, type Dispatch, type SetStateAction } from 'react'
import type { UserProfile, MessageWithImages, PaginatedResponse } from '@/types'
import { apiClient } from '@/api/client'

export const useUserProfile = (userId: string, currentUserId?: string) => {
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [messages, setMessages] = useState<MessageWithImages[]>([])
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)

    const fetchProfile = async () => {
        setLoading(true)
        try {
            const data = await apiClient.users.getProfile(userId, currentUserId)
            setProfile(data)
        } catch (error) {
            console.error('Failed to fetch profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchMessages = async (pageNum: number, size = 10, replace = false) => {
        if (!replace && (loading || !hasMore)) return

        setLoading(true)
        try {
            const data = await apiClient.messages.getUserMessages(userId, {
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
        } catch (error) {
            console.error('Failed to fetch messages:', error)
        } finally {
            setLoading(false)
        }
    }

    const refreshProfile = async () => {
        await fetchProfile()
    }

    const refreshMessages = async () => {
        await fetchMessages(1, page * 10, true)
        setPage(1)
    }

    const loadMore = () => {
        setPage((prev) => prev + 1)
    }

    useEffect(() => {
        if (userId) {
            fetchProfile()
        }
    }, [userId, currentUserId])

    useEffect(() => {
        if (userId) {
            if (page === 1) {
                fetchMessages(1, 10, true)
            } else {
                fetchMessages(page)
            }
        }
    }, [page, userId, currentUserId])

    return {
        profile,
        messages,
        setMessages,
        loading,
        hasMore,
        refreshProfile,
        refreshMessages,
        loadMore,
        page,
    }
}

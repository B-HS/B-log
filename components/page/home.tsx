import { MessageItem } from '@/components/layout/message'
import type { MessageWithImages, PaginatedResponse } from '@/types'
import { extractImageIds } from '@/utils'
import { authClient } from '@/auth/client'
import { useCallback, useEffect, useState } from 'react'
import { MessageForm } from '../layout'
import { useInfiniteScroll, useMessageActions } from '@/hooks'

export const Home = () => {
    const [messages, setMessages] = useState<MessageWithImages[]>([])
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const { data: session, isPending } = authClient.useSession()
    const { deleteMessage, handleRetweet, deleteRetweet } = useMessageActions()

    const fetchMessages = useCallback(
        async (pageNum: number, size = 10, replace = false) => {
            if (!replace && (loading || !hasMore)) return

            setLoading(true)
            try {
                const url = session?.user?.id
                    ? `/api/messages?page=${pageNum}&size=${size}&currentUserId=${session.user.id}`
                    : `/api/messages?page=${pageNum}&size=${size}`
                const response = await fetch(url)
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
        },
        [loading, hasMore, session?.user?.id],
    )

    const handleMessageSubmit = async (body: string, imageUrls: string[]) => {
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

    const handleDelete = async (messageId: string) => {
        const success = await deleteMessage(messageId)
        if (success) {
            setMessages((prev) => prev.filter((m) => m.id !== messageId))
        }
    }

    const handleReplySubmit = async (messageId: string, body: string, imageUrls: string[]) => {
        try {
            const imageIds = extractImageIds(imageUrls)

            const response = await fetch('/api/messages/reply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ replyToId: messageId, body, imageIds }),
            })

            if (!response.ok) {
                throw new Error('Failed to create reply')
            }

            await fetchMessages(1, page * 10, true)
            setPage(1)
        } catch (error) {
            console.error('Failed to submit reply:', error)
        }
    }

    const handleRetweetClick = async (messageId: string) => {
        const success = await handleRetweet(messageId)
        if (success) {
            await fetchMessages(1, page * 10, true)
            setPage(1)
        }
    }

    const handleRetweetDelete = async (messageId: string) => {
        const success = await deleteRetweet(messageId)
        if (success) {
            await fetchMessages(1, page * 10, true)
            setPage(1)
        }
    }

    const observerTarget = useInfiniteScroll(
        () => {
            if (!loading) {
                setPage((prev) => prev + 1)
            }
        },
        hasMore,
        loading,
        page,
    )

    useEffect(() => {
        if (isPending) return

        if (page === 1) {
            fetchMessages(1, 10, true)
        } else {
            fetchMessages(page)
        }
    }, [page, isPending, fetchMessages])

    return (
        <>
            <h1 className='sr-only'>타임라인</h1>
            {session?.user?.id && <MessageForm onSubmit={handleMessageSubmit} />}
            <div role='feed' aria-label='메시지 타임라인'>
                {messages.map((message) => (
                    <MessageItem
                        key={message.id}
                        message={message}
                        currentUserId={session?.user?.id}
                        onDelete={handleDelete}
                        onReply={handleReplySubmit}
                        onRetweet={handleRetweetClick}
                        onRetweetDelete={handleRetweetDelete}
                    />
                ))}
            </div>

            {loading && (
                <div className='flex justify-center p-3.5' role='status' aria-live='polite'>
                    <div className='text-muted-foreground'>로딩 중...</div>
                </div>
            )}

            {!hasMore && messages.length > 0 && (
                <div className='flex justify-center p-3.5' role='status'>
                    <div className='text-muted-foreground'>모든 메시지를 불러왔습니다</div>
                </div>
            )}

            {messages.length === 0 && loading === false && <div className='flex justify-center p-8'></div>}

            <div ref={observerTarget} className='h-3.5' aria-hidden='true' />
        </>
    )
}

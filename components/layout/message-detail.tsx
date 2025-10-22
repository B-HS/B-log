import { MessageItem } from '@/components/layout/message'
import type { MessageWithImages, PaginatedResponse } from '@/types'
import { extractImageIds } from '@/utils'
import { authClient } from '@/auth/client'
import { useEffect, useState } from 'react'
import { useInfiniteScroll, useMessageActions } from '@/hooks'

export const MessageDetail = () => {
    const [message, setMessage] = useState<MessageWithImages | null>(null)
    const [replies, setReplies] = useState<MessageWithImages[]>([])
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const [messageId, setMessageId] = useState<string | null>(null)
    const { data: session } = authClient.useSession()
    const { deleteMessage, handleRetweet, handleShare } = useMessageActions()

    useEffect(() => {
        const id = new URLSearchParams(window.location.search).get('id')
        setMessageId(id)
    }, [])

    const fetchMessage = async () => {
        if (!messageId) return

        setLoading(true)
        try {
            const response = await fetch(`/api/messages/${messageId}`)

            if (response.ok) {
                const data: MessageWithImages = await response.json()
                setMessage(data)
            }
        } catch (error) {
            console.error('Failed to fetch message:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchReplies = async (pageNum: number, size = 10, replace = false) => {
        if (!messageId || (!replace && (loading || !hasMore))) return

        setLoading(true)
        try {
            const response = await fetch(`/api/messages/${messageId}/replies?page=${pageNum}&size=${size}`)
            const data: PaginatedResponse<MessageWithImages> = await response.json()

            if (replace) {
                setReplies(data.content)
            } else {
                setReplies((prev) => [...prev, ...data.content])
            }
            setHasMore(data.next !== null)
        } catch (error) {
            console.error('Failed to fetch replies:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (messageIdToDelete: string) => {
        const success = await deleteMessage(messageIdToDelete)
        if (success) {
            if (messageIdToDelete === messageId) {
                window.location.href = '/'
            } else {
                setReplies((prev) => prev.filter((m) => m.id !== messageIdToDelete))
            }
        }
    }

    const handleReplySubmit = async (replyToId: string, body: string, imageUrls: string[]) => {
        try {
            const imageIds = extractImageIds(imageUrls)

            const response = await fetch('/api/messages/reply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ replyToId, body, imageIds }),
            })

            if (!response.ok) {
                throw new Error('Failed to create reply')
            }

            await fetchReplies(1, page * 10, true)
            setPage(1)
        } catch (error) {
            console.error('Failed to submit reply:', error)
        }
    }

    const handleRetweetClick = async (msgId: string) => {
        const success = await handleRetweet(msgId)
        if (success) {
            await fetchMessage()
            await fetchReplies(1, page * 10, true)
            setPage(1)
        }
    }

    const observerTarget = useInfiniteScroll(() => setPage((prev) => prev + 1), hasMore, loading)

    useEffect(() => {
        if (messageId) {
            fetchMessage()
        }
    }, [messageId])

    useEffect(() => {
        if (messageId) {
            if (page === 1) {
                fetchReplies(1, 10, true)
            } else {
                fetchReplies(page)
            }
        }
    }, [page, messageId])

    if (!messageId) {
        return (
            <div className='flex justify-center items-center p-8'>
                <div className='text-muted-foreground'>Message ID not provided</div>
            </div>
        )
    }

    if (!message && !loading) {
        return (
            <div className='flex justify-center items-center p-8'>
                <div className='text-muted-foreground'>Message not found</div>
            </div>
        )
    }

    if (!message) {
        return (
            <div className='flex justify-center items-center p-8'>
                <div className='text-muted-foreground'>Loading...</div>
            </div>
        )
    }

    return (
        <>
            <section aria-labelledby='main-message-heading'>
                <h2 id='main-message-heading' className='sr-only'>
                    메인 메시지
                </h2>
                <div className='border-b-4 border-border'>
                    <MessageItem
                        message={message}
                        currentUserId={session?.user?.id}
                        onDelete={handleDelete}
                        onReply={handleReplySubmit}
                        onRetweet={handleRetweetClick}
                        onShare={handleShare}
                    />
                </div>
            </section>

            <section aria-labelledby='replies-heading'>
                <div className='p-4 border-b border-border'>
                    <h2 id='replies-heading' className='text-lg font-semibold'>
                        답글
                    </h2>
                </div>

                <div role='feed' aria-label='답글 목록'>
                    {replies.map((reply) => (
                        <MessageItem
                            key={reply.id}
                            message={reply}
                            currentUserId={session?.user?.id}
                            onDelete={handleDelete}
                            onReply={handleReplySubmit}
                            onRetweet={handleRetweetClick}
                            onShare={handleShare}
                        />
                    ))}
                </div>

                {loading && (
                    <div className='flex justify-center p-4' role='status' aria-live='polite'>
                        <div className='text-muted-foreground'>로딩 중...</div>
                    </div>
                )}

                {!hasMore && replies.length > 0 && (
                    <div className='flex justify-center p-4' role='status'>
                        <div className='text-muted-foreground'>모든 답글을 불러왔습니다</div>
                    </div>
                )}

                {replies.length === 0 && loading === false && (
                    <div className='flex justify-center p-8' role='status'>
                        <div className='text-muted-foreground'>아직 답글이 없습니다</div>
                    </div>
                )}

                <div ref={observerTarget} className='h-4' aria-hidden='true' />
            </section>
        </>
    )
}

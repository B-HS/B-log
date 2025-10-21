import { MessageItem } from '@/components/layout/message'
import { useEffect, useRef, useState } from 'react'

type MessageWithImages = {
    id: string
    userId: string
    body: string
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
    images: Array<{
        id: string
        r2Key: string
        bucket: string
        mimeType: string
        sizeBytes: number
        width: number | null
        height: number | null
        checksum: string | null
        uploadedBy: string | null
        createdAt: Date
        updatedAt: Date
    }>
    user: {
        id: string
        name: string
        email: string
        image: string | null
    }
}

type PaginatedResponse = {
    prev: number | null
    next: number | null
    totalElements: number
    totalPages: number
    content: MessageWithImages[]
}

export const Home = () => {
    const [messages, setMessages] = useState<MessageWithImages[]>([])
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const observerTarget = useRef<HTMLDivElement>(null)

    const fetchMessages = async (pageNum: number) => {
        if (loading || !hasMore) return

        setLoading(true)
        try {
            const response = await fetch(`/api/messages?page=${pageNum}&size=10`)
            const data: PaginatedResponse = await response.json()

            setMessages((prev) => [...prev, ...data.content])
            setHasMore(data.next !== null)
        } catch (error) {
            console.error('Failed to fetch messages:', error)
        } finally {
            setLoading(false)
        }
    }

    const messagesWithUrl = messages.map((msg) => ({
        ...msg,
        createdAt: new Date(msg.createdAt),
        updatedAt: new Date(msg.updatedAt),
        images: msg.images.map((img) => ({
            id: img.id,
            url: `/api/r2/${img.bucket}/${img.r2Key}`,
            alt: null,
        })),
    }))

    useEffect(() => {
        fetchMessages(page)
    }, [page])

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    setPage((prev) => prev + 1)
                }
            },
            { threshold: 0.1 },
        )

        if (observerTarget.current) {
            observer.observe(observerTarget.current)
        }

        return () => observer.disconnect()
    }, [hasMore, loading])

    return (
        <div className='flex flex-col'>
            {messagesWithUrl.map((message) => (
                <MessageItem key={message.id} message={message} />
            ))}

            {loading && (
                <div className='flex justify-center p-4'>
                    <div className='text-muted-foreground'>로딩 중...</div>
                </div>
            )}

            {!hasMore && messages.length > 0 && (
                <div className='flex justify-center p-4'>
                    <div className='text-muted-foreground'>모든 메시지를 불러왔습니다</div>
                </div>
            )}

            {messages.length === 0 && loading === false && <div className='flex justify-center p-8'></div>}

            <div ref={observerTarget} className='h-4' />
        </div>
    )
}

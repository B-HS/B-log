import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/ko'
import { FC } from 'react'

dayjs.extend(relativeTime)
dayjs.locale('ko')

type MessageWithImages = {
    id: string
    userId: string
    body: string
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
    images: Array<{
        id: string
        url: string
        alt?: string | null
    }>
    user: {
        id: string
        name: string
        email: string
        image: string | null
    }
}

interface MessageItemProps {
    message: MessageWithImages
}

export const MessageItem: FC<MessageItemProps> = ({ message }) => {
    const { user, body, createdAt, images } = message

    const initials = user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    const timeAgo = dayjs(createdAt).fromNow()

    return (
        <article className='flex gap-3 border-b border-border p-4 hover:bg-muted/50 transition-colors'>
            <div className='flex-shrink-0'>
                <Avatar className='h-10 w-10'>
                    <AvatarImage src={user.image || undefined} alt={user.name} />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
            </div>

            <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2 mb-1'>
                    <span className='font-semibold text-foreground truncate'>{user.name}</span>
                    <span className='text-muted-foreground text-sm'>·</span>
                    <time className='text-muted-foreground text-sm flex-shrink-0' dateTime={createdAt.toISOString()}>
                        {timeAgo}
                    </time>
                </div>

                <p className='text-foreground whitespace-pre-wrap break-words mb-3 text-pretty'>{body}</p>

                {images.length > 0 && (
                    <div
                        className={`grid gap-2 rounded-lg overflow-hidden ${
                            images.length === 1
                                ? 'grid-cols-1'
                                : images.length === 2
                                ? 'grid-cols-2'
                                : images.length === 3
                                ? 'grid-cols-2'
                                : 'grid-cols-2'
                        }`}>
                        {images.map((image, index) => (
                            <div
                                key={image.id}
                                className={`relative bg-muted ${
                                    images.length === 3 && index === 0 ? 'col-span-2' : images.length > 4 && index >= 3 ? 'hidden' : ''
                                } ${images.length === 1 ? 'aspect-video max-h-[500px]' : 'aspect-square'}`}>
                                <img
                                    src={image.url || '/placeholder.svg'}
                                    alt={image.alt || `Image ${index + 1}`}
                                    className='w-full h-full object-cover'
                                />
                                {images.length > 4 && index === 3 && (
                                    <div className='absolute inset-0 bg-black/60 flex items-center justify-center'>
                                        <span className='text-white text-2xl font-semibold'>+{images.length - 4}</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </article>
    )
}

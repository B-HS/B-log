import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DEFAULT_IMAGE_URL } from '@/constants'
import { cn } from '@/components/lib/utils'
import type { FC } from 'react'
import type { MessageWithImages } from '@/types'

interface MessageRetweetCardProps {
    retweetOf: NonNullable<MessageWithImages['retweetOf']>
}

export const MessageRetweetCard: FC<MessageRetweetCardProps> = ({ retweetOf }) => {
    const initials = retweetOf.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    return (
        <div className='border border-border rounded-lg p-3 mb-3'>
            <div className='flex items-center gap-2 mb-2'>
                <Avatar className='h-8 w-8'>
                    <AvatarImage src={retweetOf.user.image || undefined} alt={retweetOf.user.name} />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <span className='font-semibold text-sm'>{retweetOf.user.name}</span>
            </div>
            <p className='text-foreground whitespace-pre-wrap break-words mb-2 text-sm'>{retweetOf.body}</p>
            {retweetOf.images.length > 0 && (
                <div
                    className={cn(
                        'grid gap-2 rounded-xl overflow-hidden',
                        retweetOf.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2',
                    )}>
                    {retweetOf.images.slice(0, 4).map((image, index) => (
                        <div
                            key={image.id}
                            className={cn(
                                'relative bg-muted',
                                retweetOf.images.length === 1 ? 'aspect-video max-h-[300px]' : 'aspect-square',
                            )}>
                            <img src={image.url || DEFAULT_IMAGE_URL} alt={`Image ${index + 1}`} className='w-full h-full object-cover' />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

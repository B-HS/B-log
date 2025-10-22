import { DEFAULT_IMAGE_URL } from '@/constants'
import { cn } from '@/components/lib/utils'
import type { FC } from 'react'
import type { ImageAssetWithUrl } from '@/types'

interface MessageImagesProps {
    images: ImageAssetWithUrl[]
    userName: string
}

export const MessageImages: FC<MessageImagesProps> = ({ images, userName }) => {
    if (images.length === 0) return null

    return (
        <div
            className={cn(
                'grid gap-2 rounded-xl overflow-hidden mb-3',
                images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : images.length === 3 ? 'grid-cols-2' : 'grid-cols-2',
            )}>
            {images.map((image, index) => (
                <div
                    key={image.id}
                    className={cn(
                        'relative bg-muted',
                        images.length === 3 && index === 0 ? 'col-span-2' : images.length > 4 && index >= 3 ? 'hidden' : '',
                        images.length === 1 ? 'aspect-video max-h-[500px]' : 'aspect-square',
                    )}>
                    <img
                        src={image.url || DEFAULT_IMAGE_URL}
                        alt={`${userName}님이 첨부한 이미지 ${index + 1}/${images.length}`}
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
    )
}

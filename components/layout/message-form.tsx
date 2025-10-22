import { authClient } from '@/auth/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { getInitials } from '@/components/lib/utils'
import { useImageUpload } from '@/hooks'
import { ImageIcon, Loader2, X } from 'lucide-react'
import { type FC, useRef, useState } from 'react'

interface MessageFormProps {
    onSubmit?: (body: string, imageUrls: string[]) => void
}

export const MessageForm: FC<MessageFormProps> = ({ onSubmit }) => {
    const { data: session } = authClient.useSession()
    const [body, setBody] = useState('')
    const [attachedImages, setAttachedImages] = useState<string[]>([])
    const { uploadImage, isLoading: isImageLoading } = useImageUpload()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const imageUrl = await uploadImage(file)
            if (imageUrl) {
                setAttachedImages([...attachedImages, imageUrl])
            }
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleRemoveImage = (index: number) => {
        setAttachedImages(attachedImages.filter((_, i) => i !== index))
    }

    const handleSubmit = () => {
        if (body.trim() || attachedImages.length > 0) {
            onSubmit?.(body, attachedImages)
            setBody('')
            setAttachedImages([])
        }
    }

    return (
        <article className='flex gap-3 border-b border-border p-3 bg-background'>
            <div className='flex-shrink-0'>
                <Avatar className='h-10 w-10'>
                    <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || ''} />
                    <AvatarFallback>{getInitials(session?.user?.name || '')}</AvatarFallback>
                </Avatar>
            </div>

            <div className='flex-1 min-w-0 space-y-1'>
                <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className='focus-visible:ring-0 p-3 text-base shadow-none resize-none min-h-[60px] max-h-[300px] overflow-y-auto'
                    style={{ fieldSizing: 'content' } as React.CSSProperties}
                />

                {attachedImages.length > 0 && (
                    <div className='grid grid-cols-2 gap-2'>
                        {attachedImages.map((url, index) => (
                            <div key={index} className='relative aspect-square rounded-lg overflow-hidden bg-muted group'>
                                <img src={url || '/placeholder.svg'} alt={`첨부 이미지 ${index + 1}`} className='w-full h-full object-cover' />
                                <button
                                    onClick={() => handleRemoveImage(index)}
                                    className='absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
                                    aria-label='이미지 제거'>
                                    <X className='size-3.5' />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className='flex items-center justify-end-safe gap-2'>
                    <div className='flex items-center'>
                        <input
                            ref={fileInputRef}
                            type='file'
                            accept='image/*'
                            onChange={handleImageChange}
                            className='hidden'
                            id='image-upload'
                            disabled={isImageLoading}
                        />
                        <Button
                            type='button'
                            variant='outline'
                            size='icon'
                            className='shadow-none'
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isImageLoading}>
                            {isImageLoading ? <Loader2 className='size-3.5 animate-spin' /> : <ImageIcon className='size-3.5' />}
                        </Button>
                    </div>
                    <Button onClick={handleSubmit} disabled={!body.trim() && attachedImages.length === 0}>
                        게시
                    </Button>
                </div>
            </div>
        </article>
    )
}

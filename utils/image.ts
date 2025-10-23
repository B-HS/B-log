import { IMAGE_BASE_URL } from '@/constants/app'
import type { ImageVariant } from '@/types'

export const getImageUrl = (imageId: string, variant: ImageVariant = 'thumbnail') => {
    return `${IMAGE_BASE_URL}/images/${imageId}/${variant}.webp`
}

export const getOriginalImageUrl = (imageId: string, mimeType: string) => {
    const extension = mimeType.split('/')[1] || 'jpg'
    return `${IMAGE_BASE_URL}/images/${imageId}/original.${extension}`
}

export const extractImageIdFromUrl = (url: string) => {
    const match = url.match(/\/images\/([^/]+)\//)
    return match ? match[1] : null
}

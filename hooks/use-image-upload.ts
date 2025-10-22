import { getImageUrl } from '@/utils'
import { useState } from 'react'

export const useImageUpload = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const uploadImage = async (file: File) => {
        setIsLoading(true)
        setError(null)
        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await fetch('/api/r2/upload', {
                method: 'POST',
                body: formData,
            })
            const data = (await response.json()) as { id: string }
            if (data?.id) {
                return getImageUrl(data.id, 'thumbnail')
            }
            return null
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Image upload failed'
            setError(errorMessage)
            console.error('Image upload failed:', error)
            return null
        } finally {
            setIsLoading(false)
        }
    }

    return { uploadImage, isLoading, error }
}

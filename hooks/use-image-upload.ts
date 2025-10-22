import { apiClient, ApiError } from '@/api/client'
import { getImageUrl } from '@/utils'
import { useState } from 'react'

export const useImageUpload = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const uploadImage = async (file: File) => {
        setIsLoading(true)
        setError(null)

        try {
            const data = await apiClient.images.upload(file)
            if (data?.id) {
                return getImageUrl(data.id, 'thumbnail')
            }
            return null
        } catch (err) {
            const errorMessage = err instanceof ApiError ? err.message : '이미지 업로드에 실패했습니다'
            setError(errorMessage)
            return null
        } finally {
            setIsLoading(false)
        }
    }

    return { uploadImage, isLoading, error }
}

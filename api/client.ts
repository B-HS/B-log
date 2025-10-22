import type { MessageWithImages, PaginatedResponse, ApiResponse, ApiErrorResponse } from '@/types'

class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
        public data?: ApiErrorResponse,
    ) {
        super(message)
        this.name = 'ApiError'
    }
}

const handleResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
        const error = (await response.json().catch(() => ({
            error: response.statusText,
        }))) as ApiErrorResponse
        throw new ApiError(error.error || 'Request failed', response.status, error)
    }
    return response.json()
}

const request = async <T>(url: string, options?: RequestInit): Promise<T> => {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    })
    return handleResponse<T>(response)
}

export const apiClient = {
    messages: {
        getList: (params: { page?: number; size?: number; currentUserId?: string }) => {
            const searchParams = new URLSearchParams()
            if (params.page) searchParams.set('page', params.page.toString())
            if (params.size) searchParams.set('size', params.size.toString())
            if (params.currentUserId) searchParams.set('currentUserId', params.currentUserId)

            return request<PaginatedResponse<MessageWithImages>>(`/api/messages?${searchParams.toString()}`)
        },

        getById: (id: string) => {
            return request<MessageWithImages>(`/api/messages/${id}`)
        },

        create: (data: { body: string; imageIds: string[] }) => {
            return request<MessageWithImages>('/api/messages', {
                method: 'POST',
                body: JSON.stringify(data),
            })
        },

        delete: (id: string) => {
            return request<{ success: boolean }>(`/api/messages/${id}`, {
                method: 'DELETE',
            })
        },

        createReply: (data: { replyToId: string; body: string; imageIds: string[] }) => {
            return request<MessageWithImages>('/api/messages/reply', {
                method: 'POST',
                body: JSON.stringify(data),
            })
        },

        getReplies: (messageId: string, params: { page?: number; size?: number }) => {
            const searchParams = new URLSearchParams()
            if (params.page) searchParams.set('page', params.page.toString())
            if (params.size) searchParams.set('size', params.size.toString())

            return request<PaginatedResponse<MessageWithImages>>(`/api/messages/${messageId}/replies?${searchParams.toString()}`)
        },

        createRetweet: (messageId: string) => {
            return request<MessageWithImages>(`/api/messages/${messageId}/retweet`, {
                method: 'POST',
            })
        },

        deleteRetweet: (messageId: string) => {
            return request<{ success: boolean }>(`/api/messages/${messageId}/retweet`, {
                method: 'DELETE',
            })
        },
    },

    images: {
        upload: async (file: File) => {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/r2/upload', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const error = (await response.json().catch(() => ({
                    error: response.statusText,
                }))) as ApiErrorResponse
                throw new ApiError(error.error || 'Upload failed', response.status, error)
            }

            return response.json() as Promise<{
                id: string
                originalKey: string
                variants: Array<{ variant: string; key: string }>
                uploaded: boolean
            }>
        },
    },
}

export { ApiError }

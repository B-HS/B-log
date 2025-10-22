export type ApiResponse<T> = {
    data?: T
    error?: string
}

export type ApiErrorResponse = {
    error: string
}

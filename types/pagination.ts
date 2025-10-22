export type PaginatedResponse<T> = {
    prev: number | null
    next: number | null
    totalElements: number
    totalPages: number
    content: T[]
}

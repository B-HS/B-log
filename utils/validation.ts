export const validateRequired = (value: string | null | undefined, fieldName: string) => {
    if (!value || value.trim().length === 0) {
        throw new Error(`${fieldName} is required`)
    }
    return value.trim()
}

export const validateNonEmpty = (value: string, fieldName: string) => {
    if (value.trim().length === 0) {
        throw new Error(`${fieldName} cannot be empty`)
    }
    return value.trim()
}

export const extractImageIds = (imageUrls: string[]) => {
    return imageUrls
        .map((url) => {
            const match = url.match(/\/images\/([^/]+)\//)
            return match ? match[1] : null
        })
        .filter((id): id is string => id !== null)
}

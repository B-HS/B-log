import { useEffect, useRef } from 'react'

export const useInfiniteScroll = (onLoadMore: () => void, hasMore: boolean, loading: boolean) => {
    const observerTarget = useRef<HTMLDivElement>(null)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current)
                    }
                    timeoutRef.current = setTimeout(() => {
                        onLoadMore()
                    }, 300)
                }
            },
            { threshold: 0.1 },
        )

        if (observerTarget.current) {
            observer.observe(observerTarget.current)
        }

        return () => {
            observer.disconnect()
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [hasMore, loading, onLoadMore])

    return observerTarget
}

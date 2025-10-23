import { useEffect, useRef } from 'react'

export const useInfiniteScroll = (onLoadMore: () => void, hasMore: boolean, loading: boolean) => {
    const observerTarget = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    onLoadMore()
                }
            },
            { threshold: 0.1 },
        )

        if (observerTarget.current) {
            observer.observe(observerTarget.current)
        }

        return () => observer.disconnect()
    }, [hasMore, loading, onLoadMore])

    return observerTarget
}

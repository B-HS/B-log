import { useState, useEffect, useRef } from 'react'
import type { UserProfile } from '@/types'
import { apiClient } from '@/api/client'

const userCache = new Map<string, { data: UserProfile; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000

export const useUserCard = (userId: string, currentUserId?: string, enabled = false) => {
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    useEffect(() => {
        if (!enabled || !userId) {
            return
        }

        const cacheKey = currentUserId ? `${userId}-${currentUserId}` : userId
        const cached = userCache.get(cacheKey)

        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            setProfile(cached.data)
            return
        }

        const fetchProfile = async () => {
            setLoading(true)
            setError(null)

            abortControllerRef.current = new AbortController()

            try {
                const data = await apiClient.users.getProfile(userId, currentUserId)
                setProfile(data)

                userCache.set(cacheKey, {
                    data,
                    timestamp: Date.now(),
                })
            } catch (err) {
                if (err instanceof Error && err.name !== 'AbortError') {
                    setError(err.message)
                }
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()

        return () => {
            abortControllerRef.current?.abort()
        }
    }, [userId, currentUserId, enabled])

    return {
        profile,
        loading,
        error,
    }
}

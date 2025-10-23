import { useState } from 'react'
import { apiClient } from '@/api/client'

export const useFollow = () => {
    const [loading, setLoading] = useState(false)

    const followUser = async (userId: string) => {
        setLoading(true)
        try {
            await apiClient.follow.followUser(userId)
            return true
        } catch (error) {
            console.error('Follow error:', error)
            return false
        } finally {
            setLoading(false)
        }
    }

    const unfollowUser = async (userId: string) => {
        setLoading(true)
        try {
            await apiClient.follow.unfollowUser(userId)
            return true
        } catch (error) {
            console.error('Unfollow error:', error)
            return false
        } finally {
            setLoading(false)
        }
    }

    return {
        followUser,
        unfollowUser,
        loading,
    }
}

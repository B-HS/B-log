import { useState } from 'react'
import { apiClient } from '@/api/client'

export const useMessageActions = () => {
    const [isDeleting, setIsDeleting] = useState(false)
    const [isRetweeting, setIsRetweeting] = useState(false)

    const deleteMessage = async (messageId: string) => {
        setIsDeleting(true)
        try {
            await apiClient.messages.delete(messageId)
            return true
        } catch (error) {
            console.error('Failed to delete message:', error)
            return false
        } finally {
            setIsDeleting(false)
        }
    }

    const handleRetweet = async (messageId: string) => {
        setIsRetweeting(true)
        try {
            await apiClient.messages.createRetweet(messageId)
            return true
        } catch (error) {
            console.error('Failed to retweet message:', error)
            return false
        } finally {
            setIsRetweeting(false)
        }
    }

    const deleteRetweet = async (messageId: string) => {
        setIsRetweeting(true)
        try {
            await apiClient.messages.deleteRetweet(messageId)
            return true
        } catch (error) {
            console.error('Failed to delete retweet:', error)
            return false
        } finally {
            setIsRetweeting(false)
        }
    }

    return {
        deleteMessage,
        handleRetweet,
        deleteRetweet,
        isDeleting,
        isRetweeting,
    }
}

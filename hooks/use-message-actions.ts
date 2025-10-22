import { useState } from 'react'

export const useMessageActions = () => {
    const [isDeleting, setIsDeleting] = useState(false)
    const [isRetweeting, setIsRetweeting] = useState(false)

    const deleteMessage = async (messageId: string) => {
        setIsDeleting(true)
        try {
            const response = await fetch(`/api/messages/${messageId}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                throw new Error('Failed to delete message')
            }

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
            const response = await fetch(`/api/messages/${messageId}/retweet`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) {
                throw new Error('Failed to retweet message')
            }

            return true
        } catch (error) {
            console.error('Failed to retweet message:', error)
            return false
        } finally {
            setIsRetweeting(false)
        }
    }

    const handleShare = (messageId: string) => {
        console.log('Share message:', messageId)
    }

    return {
        deleteMessage,
        handleRetweet,
        handleShare,
        isDeleting,
        isRetweeting,
    }
}

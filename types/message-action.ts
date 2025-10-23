import type { LucideIcon } from 'lucide-react'

export type MessageActionType = 'reply' | 'retweet' | 'delete'

export type MessageAction = {
    type: MessageActionType
    label: string
    icon: LucideIcon
    variant?: 'default' | 'destructive'
    hoverColor?: string
}

export type MessageActionHandlers = {
    onReply?: (messageId: string, body: string, imageUrls: string[]) => void
    onRetweet?: (messageId: string) => void
    onRetweetDelete?: (messageId: string) => void
    onDelete?: (messageId: string) => void
}

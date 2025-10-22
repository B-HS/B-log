import type { FC } from 'react'
import type { MessageWithImages } from '@/types'
import type { MessageActionHandlers } from '@/types/message-action'
import { MessageCard } from './message/message-card'

interface MessageItemProps {
    message: MessageWithImages
    currentUserId?: string
}

type MessageItemWithActionsProps = MessageItemProps & MessageActionHandlers

export const MessageItem: FC<MessageItemWithActionsProps> = (props) => {
    return <MessageCard {...props} />
}

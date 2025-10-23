import { Button } from '@/components/ui/button'
import { MESSAGE_ACTIONS } from '@/constants/message-actions'
import { cn } from '@/components/lib/utils'
import type { FC } from 'react'

interface MessageActionsProps {
    messageId: string
    replyCount?: number
    retweetCount?: number
    isRetweeted?: boolean
    onReply?: () => void
    onRetweet?: (messageId: string) => void
}

export const MessageActions: FC<MessageActionsProps> = ({
    messageId,
    replyCount,
    retweetCount,
    isRetweeted,
    onReply,
    onRetweet,
}) => {
    const actionHandlers: Record<string, ((messageId: string) => void) | undefined> = {
        reply: onReply,
        retweet: onRetweet,
    }

    return (
        <div className='flex items-center gap-1 -ml-2'>
            {MESSAGE_ACTIONS.map((action) => {
                const Icon = action.icon
                const handler = actionHandlers[action.type]

                if (!handler) return null

                let displayLabel = action.label
                if (action.type === 'reply' && replyCount !== undefined && replyCount > 0) {
                    displayLabel = `${action.label} (${replyCount})`
                } else if (action.type === 'retweet' && retweetCount !== undefined && retweetCount > 0) {
                    displayLabel = `${action.label} (${retweetCount})`
                }

                const isRetweetedAction = action.type === 'retweet' && isRetweeted

                return (
                    <Button
                        key={action.type}
                        variant='ghost'
                        size='sm'
                        className={cn(
                            'h-9 px-3',
                            isRetweetedAction ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-muted-foreground',
                            action.hoverColor && !isRetweetedAction ? action.hoverColor : '',
                        )}
                        onClick={(e) => {
                            e.preventDefault()
                            handler(messageId)
                        }}>
                        <Icon className='h-5 w-5 mr-2' />
                        <span className='text-sm'>{displayLabel}</span>
                    </Button>
                )
            })}
        </div>
    )
}

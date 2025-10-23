import { MessageCircle, Repeat2 } from 'lucide-react'
import type { MessageAction } from '@/types/message-action'

export const MESSAGE_ACTIONS: MessageAction[] = [
    {
        type: 'reply',
        label: '답글',
        icon: MessageCircle,
        hoverColor: 'hover:text-primary hover:bg-primary/10',
    },
    {
        type: 'retweet',
        label: '리트윗',
        icon: Repeat2,
        hoverColor: 'hover:text-green-600 hover:bg-green-600/10',
    },
]

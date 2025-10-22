import * as schema from '@/db/schema'
import type { ImageAssetWithUrl } from './image'

export type MessageUser = {
    id: string
    name: string
    email: string
    image: string | null
}

export type MessageReplyTo = {
    id: string
    userId: string
    body: string
    user: MessageUser
}

export type MessageRetweetOf = {
    id: string
    userId: string
    body: string
    user: MessageUser
    images: ImageAssetWithUrl[]
}

export type MessageMetadata = {
    replyCount?: number
    retweetCount?: number
    isRetweeted?: boolean
}

export type Message = typeof schema.message.$inferSelect

export type MessageWithImages = Message & {
    images: ImageAssetWithUrl[]
    user: MessageUser
    replyTo?: MessageReplyTo
    retweetOf?: MessageRetweetOf
} & MessageMetadata

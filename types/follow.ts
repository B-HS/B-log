import * as schema from '@/db/schema'
import type { MessageUser } from './message'

export type Follow = typeof schema.follow.$inferSelect

export type FollowWithUser = Follow & {
    user: MessageUser
}

export type FollowStats = {
    followersCount: number
    followingCount: number
}

import * as schema from '@/db/schema'
import type { FollowStats } from './follow'

export type User = typeof schema.user.$inferSelect

export type UserProfile = User & FollowStats & {
    isFollowing?: boolean
    isFollowedBy?: boolean
}

export type UserWithFollowStatus = User & {
    isFollowing: boolean
}

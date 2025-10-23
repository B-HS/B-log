import { authClient } from '@/auth/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { getInitials } from '@/components/lib/utils'
import { useUserCard, useFollow } from '@/hooks'
import { UserPlus, UserMinus, Loader2 } from 'lucide-react'
import type { FC } from 'react'
import { useState } from 'react'

interface UserCardProps {
    userId: string
    enabled?: boolean
}

export const UserCard: FC<UserCardProps> = ({ userId, enabled = false }) => {
    const { data: session } = authClient.useSession()
    const { profile, loading, error } = useUserCard(userId, session?.user?.id, enabled)
    const { followUser, unfollowUser, loading: followLoading } = useFollow()
    const [localFollowState, setLocalFollowState] = useState<boolean | null>(null)

    const handleFollow = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!profile) return

        const currentState = localFollowState !== null ? localFollowState : profile.isFollowing
        const success = currentState ? await unfollowUser(profile.id) : await followUser(profile.id)

        if (success) {
            setLocalFollowState(!currentState)
        }
    }

    if (loading) {
        return (
            <div className='w-[300px] p-4 flex items-center justify-center'>
                <Loader2 className='size-5 animate-spin text-muted-foreground' />
            </div>
        )
    }

    if (error || !profile) {
        return (
            <div className='w-[300px] p-4'>
                <p className='text-sm text-muted-foreground text-center'>프로필을 불러올 수 없습니다</p>
            </div>
        )
    }

    const isOwnProfile = session?.user?.id === profile.id
    const isFollowing = localFollowState !== null ? localFollowState : profile.isFollowing

    return (
        <div className='w-[320px] p-4 bg-background' onClick={(e) => e.stopPropagation()}>
            <div className='flex gap-3 mb-3'>
                <a href={`/user?id=${profile.id}`} className='flex-shrink-0' onClick={(e) => e.stopPropagation()}>
                    <Avatar className='h-16 w-16 ring-2 ring-border'>
                        <AvatarImage src={profile.image || undefined} alt={profile.name} />
                        <AvatarFallback className='text-lg'>{getInitials(profile.name)}</AvatarFallback>
                    </Avatar>
                </a>

                <div className='flex-1 min-w-0'>
                    <a
                        href={`/user?id=${profile.id}`}
                        className='block font-bold text-foreground hover:underline truncate text-base'
                        onClick={(e) => e.stopPropagation()}>
                        {profile.name}
                    </a>
                    <p className='text-sm text-muted-foreground truncate'>{profile.email}</p>
                </div>
            </div>

            <div className='flex gap-3 text-sm mb-3'>
                <div>
                    <span className='font-semibold'>{profile.followingCount}</span>{' '}
                    <span className='text-muted-foreground'>팔로잉</span>
                </div>
                <div>
                    <span className='font-semibold'>{profile.followersCount}</span>{' '}
                    <span className='text-muted-foreground'>팔로워</span>
                </div>
            </div>

            {!isOwnProfile && session?.user?.id && (
                <Button onClick={handleFollow} disabled={followLoading} variant={isFollowing ? 'outline' : 'default'} size='sm' className='w-full'>
                    {followLoading ? (
                        <Loader2 className='size-3.5 animate-spin' />
                    ) : isFollowing ? (
                        <>
                            <UserMinus className='size-3.5' />
                            언팔로우
                        </>
                    ) : (
                        <>
                            <UserPlus className='size-3.5' />
                            팔로우
                        </>
                    )}
                </Button>
            )}
        </div>
    )
}

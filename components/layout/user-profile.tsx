import { authClient } from '@/auth/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { getInitials } from '@/components/lib/utils'
import { getRelativeTime } from '@/utils'
import { useUserProfile, useFollow, useInfiniteScroll, useMessageActions } from '@/hooks'
import { MessageItem } from './message'
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { UserPlus, UserMinus } from 'lucide-react'
import type { MessageWithImages } from '@/types'

export const UserProfile = () => {
    const [userId, setUserId] = useState<string | null>(null)
    const { data: session } = authClient.useSession()
    const profileData = useUserProfile(userId || '', session?.user?.id)
    const { profile, messages, loading, hasMore, refreshProfile, refreshMessages, loadMore } = profileData
    const setMessages = profileData.setMessages as Dispatch<SetStateAction<MessageWithImages[]>>
    const { followUser, unfollowUser, loading: followLoading } = useFollow()
    const { deleteMessage, handleRetweet, deleteRetweet } = useMessageActions()

    useEffect(() => {
        const id = new URLSearchParams(window.location.search).get('id')
        setUserId(id)
    }, [])

    const handleFollow = async () => {
        if (!profile) return

        const success = profile.isFollowing ? await unfollowUser(profile.id) : await followUser(profile.id)

        if (success) {
            await refreshProfile()
        }
    }

    const handleDelete = async (messageId: string) => {
        const success = await deleteMessage(messageId)
        if (success) {
            setMessages((prev) => prev.filter((m) => m.id !== messageId))
        }
    }

    const handleReplySubmit = async () => {
        await refreshMessages()
    }

    const handleRetweetClick = async (messageId: string) => {
        const success = await handleRetweet(messageId)
        if (success) {
            await refreshMessages()
        }
    }

    const handleRetweetDelete = async (messageId: string) => {
        const success = await deleteRetweet(messageId)
        if (success) {
            await refreshMessages()
        }
    }

    const observerTarget = useInfiniteScroll(() => loadMore(), hasMore, loading)

    if (!userId) {
        return (
            <div className='flex justify-center items-center p-8'>
                <div className='text-muted-foreground'>User ID not provided</div>
            </div>
        )
    }

    if (!profile && !loading) {
        return (
            <div className='flex justify-center items-center p-8'>
                <div className='text-muted-foreground'>User not found</div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className='flex justify-center items-center p-8'>
                <div className='text-muted-foreground'>Loading...</div>
            </div>
        )
    }

    const isOwnProfile = session?.user?.id === profile.id
    const joinDate = getRelativeTime(new Date(profile.createdAt))

    return (
        <>
            <section aria-labelledby='profile-heading' className='border-b border-border'>
                <div className='p-5'>
                    <div className='flex items-start gap-4'>
                        <Avatar className='h-20 w-20'>
                            <AvatarImage src={profile.image || undefined} alt={profile.name} />
                            <AvatarFallback className='text-lg'>{getInitials(profile.name)}</AvatarFallback>
                        </Avatar>

                        <div className='flex-1 min-w-0'>
                            <div className='flex items-center justify-between gap-3 mb-2'>
                                <div>
                                    <h1 id='profile-heading' className='text-xl font-bold'>
                                        {profile.name}
                                    </h1>
                                    <p className='text-sm text-muted-foreground'>{profile.email}</p>
                                </div>

                                {!isOwnProfile && session?.user?.id && (
                                    <Button onClick={handleFollow} disabled={followLoading} variant={profile.isFollowing ? 'outline' : 'default'} size='sm'>
                                        {profile.isFollowing ? (
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

                            <div className='flex gap-4 text-sm'>
                                <div>
                                    <span className='font-semibold'>{profile.followingCount}</span>{' '}
                                    <span className='text-muted-foreground'>팔로잉</span>
                                </div>
                                <div>
                                    <span className='font-semibold'>{profile.followersCount}</span>{' '}
                                    <span className='text-muted-foreground'>팔로워</span>
                                </div>
                            </div>

                            <p className='text-sm text-muted-foreground mt-2'>가입일: {joinDate}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section aria-labelledby='user-messages-heading' className='border-b border-border p-3.5'>
                <h2 id='user-messages-heading' className='text-lg font-semibold'>
                    메시지
                </h2>
            </section>

            <div role='feed' aria-label='사용자 메시지 목록'>
                {messages.map((message) => (
                    <MessageItem
                        key={message.id}
                        message={message}
                        currentUserId={session?.user?.id}
                        onDelete={handleDelete}
                        onReply={handleReplySubmit}
                        onRetweet={handleRetweetClick}
                        onRetweetDelete={handleRetweetDelete}
                    />
                ))}
            </div>

            {loading && (
                <div className='flex justify-center p-3.5' role='status' aria-live='polite'>
                    <div className='text-muted-foreground'>로딩 중...</div>
                </div>
            )}

            {!hasMore && messages.length > 0 && (
                <div className='flex justify-center p-3.5' role='status'>
                    <div className='text-muted-foreground'>모든 메시지를 불러왔습니다</div>
                </div>
            )}

            {messages.length === 0 && !loading && (
                <div className='flex justify-center p-8' role='status'>
                    <div className='text-muted-foreground'>아직 메시지가 없습니다</div>
                </div>
            )}

            <div ref={observerTarget} className='h-3.5' aria-hidden='true' />
        </>
    )
}

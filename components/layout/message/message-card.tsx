import { Repeat2, X } from 'lucide-react'
import { cn } from '@/components/lib/utils'
import { getRelativeTime } from '@/utils'
import type { FC } from 'react'
import { useState } from 'react'
import type { MessageWithImages } from '@/types'
import type { MessageActionHandlers } from '@/types/message-action'
import { MessageForm } from '../message-form'
import { MessageActions } from './message-actions'
import { MessageRetweetCard } from './message-retweet-card'
import { MessageHeader } from './message-header'
import { MessageImages } from './message-images'
import { Button } from '@/components/ui/button'

interface MessageCardProps {
    message: MessageWithImages
    currentUserId?: string
}

type MessageCardWithActionsProps = MessageCardProps & MessageActionHandlers

export const MessageCard: FC<MessageCardWithActionsProps> = ({ message, currentUserId, onDelete, onReply, onRetweet, onRetweetDelete }) => {
    const { user, body, createdAt, images } = message
    const [showReplyForm, setShowReplyForm] = useState(false)

    const timeAgo = getRelativeTime(new Date(createdAt))
    const isOwnMessage = currentUserId === message.userId

    const handleReplyClick = () => {
        setShowReplyForm(!showReplyForm)
    }

    const handleReplySubmit = (body: string, imageUrls: string[]) => {
        if (onReply) {
            onReply(message.id, body, imageUrls)
            setShowReplyForm(false)
        }
    }

    const handleRetweetClick = async () => {
        const targetId = message.retweetOfId || message.id

        if (message.isRetweeted) {
            if (onRetweetDelete) {
                onRetweetDelete(targetId)
            }
        } else {
            if (onRetweet) {
                onRetweet(targetId)
            }
        }
    }

    const handleDelete = () => {
        if (onDelete) {
            onDelete(message.id)
        }
    }

    return (
        <>
            <article
                className={cn('flex flex-col gap-0.5 px-3 py-5 hover:bg-muted/30 transition-colors', showReplyForm ? '' : 'border-b border-border')}>
                {message.retweetOfId && message.retweetOf && (
                    <>
                        <div className='flex items-center gap-1 text-sm text-muted-foreground mb-2'>
                            <Repeat2 className='size-3.5' />
                            <span>Pulled up by</span>
                            <span className='font-medium'>{user.name}</span>
                            {currentUserId === message.userId && onRetweetDelete && (
                                <Button
                                    variant='ghost'
                                    size='icon'
                                    className='size-5 text-muted-foreground hover:text-destructive hover:bg-transparent ml-0.5'
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        onRetweetDelete(message.retweetOfId!)
                                    }}>
                                    <X className='size-3.5' />
                                    <span className='sr-only'>리트윗 취소</span>
                                </Button>
                            )}
                        </div>
                        <MessageRetweetCard retweetOf={message.retweetOf} />
                    </>
                )}

                {!message.retweetOfId && message.replyTo && (
                    <a
                        href={`/detail?id=${message.replyTo.id}`}
                        className='flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors'
                        onClick={(e) => e.stopPropagation()}>
                        <span>To.</span>
                        <span className='truncate'>
                            {message.replyTo.body.slice(0, 50)}
                            {message.replyTo.body.length > 50 ? '...' : ''}
                        </span>
                        <span>|</span>
                        <span className='font-medium'>{message.replyTo.user.name}</span>
                    </a>
                )}

                {!message.retweetOfId && (
                    <>
                        <MessageHeader user={user} createdAt={createdAt} timeAgo={timeAgo} isOwnMessage={isOwnMessage} onDelete={handleDelete} />

                        <div className='pl-[52px]'>
                            <a href={`/detail?id=${message.id}`} className='block mb-3'>
                                <p className='text-foreground whitespace-pre-wrap break-words text-pretty leading-relaxed hover:underline'>{body}</p>
                            </a>

                            <MessageImages images={images} userName={user.name} />

                            <MessageActions
                                messageId={message.id}
                                replyCount={message.replyCount}
                                retweetCount={message.retweetCount}
                                isRetweeted={message.isRetweeted}
                                onReply={handleReplyClick}
                                onRetweet={handleRetweetClick}
                            />
                        </div>
                    </>
                )}
            </article>

            {showReplyForm && (
                <div className='border-b border-border'>
                    <MessageForm
                        onSubmit={handleReplySubmit}
                        replyTo={{
                            id: message.id,
                            userName: user.name,
                        }}
                        onCancel={() => setShowReplyForm(false)}
                    />
                </div>
            )}
        </>
    )
}

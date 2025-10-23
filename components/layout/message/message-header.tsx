import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { UserCard } from '@/components/layout/user-card'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import type { FC } from 'react'
import { useState } from 'react'

interface MessageHeaderProps {
    user: {
        id: string
        name: string
        image: string | null
    }
    createdAt: string | Date
    timeAgo: string
    isOwnMessage: boolean
    onDelete?: () => void
}

export const MessageHeader: FC<MessageHeaderProps> = ({ user, createdAt, timeAgo, isOwnMessage, onDelete }) => {
    const [tooltipOpen, setTooltipOpen] = useState(false)
    const initials = user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    return (
        <div className='flex gap-3'>
            <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen} delayDuration={500}>
                <TooltipTrigger asChild>
                    <div className='flex gap-3 items-center cursor-pointer w-full'>
                        <div className='flex-shrink-0'>
                            <Avatar className='h-10 w-10'>
                                <AvatarImage src={user.image || undefined} alt={user.name} />
                                <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className='flex-1 min-w-0'>
                            <div className='flex items-center justify-between gap-2'>
                                <div className='flex items-center gap-2 min-w-0'>
                                    <a
                                        href={`/user?id=${user.id}`}
                                        className='font-semibold text-foreground truncate hover:underline'
                                        onClick={(e) => e.stopPropagation()}>
                                        {user.name}
                                    </a>
                                    <span className='text-muted-foreground text-sm'>·</span>
                                    <time className='text-muted-foreground text-sm flex-shrink-0' dateTime={new Date(createdAt).toISOString()}>
                                        {timeAgo}
                                    </time>
                                </div>

                                {isOwnMessage && onDelete && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant='ghost'
                                                size='icon'
                                                className='size-8 text-muted-foreground hover:text-foreground hover:bg-accent'
                                                onClick={(e) => e.preventDefault()}>
                                                <MoreHorizontal className='size-5' />
                                                <span className='sr-only'>More options</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align='end'>
                                            <DropdownMenuItem
                                                className='text-destructive focus:text-destructive'
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    onDelete()
                                                }}>
                                                <Trash2 className='size-5 mr-2' />
                                                삭제
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        </div>
                    </div>
                </TooltipTrigger>
                <TooltipContent side='bottom' align='start' className='p-0 border-border'>
                    <UserCard userId={user.id} enabled={tooltipOpen} />
                </TooltipContent>
            </Tooltip>
        </div>
    )
}

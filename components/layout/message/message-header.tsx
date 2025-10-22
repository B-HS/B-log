import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import type { FC } from 'react'

interface MessageHeaderProps {
    user: {
        name: string
        image: string | null
    }
    createdAt: string | Date
    timeAgo: string
    isOwnMessage: boolean
    onDelete?: () => void
}

export const MessageHeader: FC<MessageHeaderProps> = ({ user, createdAt, timeAgo, isOwnMessage, onDelete }) => {
    const initials = user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    return (
        <div className='flex gap-3'>
            <div className='flex-shrink-0'>
                <Avatar className='h-10 w-10'>
                    <AvatarImage src={user.image || undefined} alt={user.name} />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
            </div>

            <div className='flex-1 min-w-0'>
                <div className='flex items-start justify-between gap-2 mb-1'>
                    <div className='flex items-center gap-2 min-w-0'>
                        <span className='font-semibold text-foreground truncate'>{user.name}</span>
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
                                    className='h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent'
                                    onClick={(e) => e.preventDefault()}>
                                    <MoreHorizontal className='h-5 w-5' />
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
                                    <Trash2 className='h-5 w-5 mr-2' />
                                    삭제
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </div>
    )
}

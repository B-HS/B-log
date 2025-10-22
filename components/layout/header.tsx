import { authClient } from '@/auth/client'
import { LoaderCircle, LogIn, User as UserIcon } from 'lucide-react'
import { Button } from '../ui/button'
import { UserForm } from './user-form'

export const Header = () => {
    const { data: session, isPending } = authClient.useSession()
    const handleSignIn = async () =>
        await authClient.signIn.social({
            provider: 'github',
        })
    return (
        <header className='flex justify-between items-center border-b border-border'>
            <a href='/' className='text-md font-bold px-2 py-0.75 hover:opacity-80 transition-opacity'>
                <h1>B-Log</h1>
            </a>
            <nav aria-label='사용자 메뉴'>
                <div className='flex items-center gap-2'>
                    {isPending ? (
                        <Button size={'icon'} variant='ghost' aria-label='로딩 중' disabled>
                            <LoaderCircle className='animate-spin' />
                        </Button>
                    ) : session?.user?.id ? (
                        <UserForm>
                            <Button size={'icon'} variant='ghost' aria-label='사용자 메뉴'>
                                <UserIcon />
                            </Button>
                        </UserForm>
                    ) : (
                        <Button size={'icon'} variant='ghost' onClick={handleSignIn} aria-label='GitHub로 로그인'>
                            <LogIn />
                        </Button>
                    )}
                </div>
            </nav>
        </header>
    )
}

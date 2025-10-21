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
            <h1 className='text-md font-bold px-2 py-0.75'>B-Log</h1>
            <div className='flex items-center gap-2'>
                {isPending ? (
                    <Button size={'icon'} variant='ghost'>
                        <LoaderCircle className='animate-spin' />
                    </Button>
                ) : session?.user?.id ? (
                    <UserForm>
                        <Button size={'icon'} variant='ghost'>
                            <UserIcon />
                        </Button>
                    </UserForm>
                ) : (
                    <Button size={'icon'} variant='ghost' onClick={handleSignIn}>
                        <LogIn />
                    </Button>
                )}
            </div>
        </header>
    )
}

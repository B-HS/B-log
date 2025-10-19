import { Button } from '../ui/button'
import { authClient } from '@/auth/client'

export const Home = () => {
    const { data: session, isPending } = authClient.useSession()

    const handleGithubLogin = async () => {
        await authClient.signIn.social({
            provider: 'github',
        })
    }

    const handleSignOut = async () => {
        await authClient.signOut()
    }

    if (isPending) {
        return <div>Loading...</div>
    }

    if (!session) {
        return (
            <div>
                <h1>Welcome</h1>
                <Button onClick={handleGithubLogin}>Login with GitHub</Button>
            </div>
        )
    }

    return (
        <div>
            <h1>Welcome, {session.user.name}!</h1>
            <p>Email: {session.user.email}</p>
            {session.user.image && <img src={session.user.image} alt='Profile' />}
            <Button onClick={handleSignOut}>Sign Out</Button>
        </div>
    )
}

import { Link, Script, ViteClient } from 'vite-ssr-components/react'
import { Header } from './header'

export const Layout = ({ children, page }: { children: React.ReactNode; page?: string }) => {
    return (
        <html>
            <head>
                <Link href='/components/global.css' rel='stylesheet' />
                {page && <script dangerouslySetInnerHTML={{ __html: `window.__PAGE__="${page}"` }} />}
                <Script src='/components/layout/client.tsx' />
                <ViteClient />
            </head>
            <body className='flex justify-center'>
                <div id='root' className='w-full max-w-screen-sm sm:border-l sm:border-r min-h-dvh'>
                    <Header />
                    {children}
                </div>
            </body>
        </html>
    )
}

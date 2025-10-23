import { Link, Script, ViteClient } from 'vite-ssr-components/react'
import { Header } from './header'
import { ToastProvider } from '../ui/toast'
import { TooltipProvider } from '../ui/tooltip'

export const Layout = ({ children, page }: { children: React.ReactNode; page?: string }) => {
    return (
        <html lang='ko'>
            <head>
                <meta charSet='utf-8' />
                <meta name='viewport' content='width=device-width, initial-scale=1.0' />
                <Link href='/components/global.css' rel='stylesheet' />
                {page && <script dangerouslySetInnerHTML={{ __html: `window.__PAGE__="${page}"` }} />}
                <Script src='/components/layout/client.tsx' />
                <ViteClient />
            </head>
            <body className='flex justify-center'>
                <a href='#main-content' className='skip-link'>
                    메인 콘텐츠로 건너뛰기
                </a>
                <div id='root' className='w-full max-w-screen-sm sm:border-l sm:border-r min-h-dvh'>
                    <ToastProvider>
                        <TooltipProvider delayDuration={500} skipDelayDuration={200}>
                            <Header />
                            <main id='main-content'>{children}</main>
                        </TooltipProvider>
                    </ToastProvider>
                </div>
            </body>
        </html>
    )
}

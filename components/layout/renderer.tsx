import { Link, ViteClient, Script } from 'vite-ssr-components/react'

export const Layout = ({ children, page }: { children: React.ReactNode; page?: string }) => {
    return (
        <html>
            <head>
                <Link href='/components/global.css' rel='stylesheet' />
                {page && <script dangerouslySetInnerHTML={{ __html: `window.__PAGE__="${page}"` }} />}
                <Script src='/components/layout/client.tsx' />
                <ViteClient />
            </head>
            <body>
                <header>B-Log</header>
                <div id='root'>{children}</div>
            </body>
        </html>
    )
}

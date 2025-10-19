import { Layout } from '@/components/layout'
import * as Pages from '@/components/page'
import { Hono } from 'hono'
import { renderToReadableStream } from 'react-dom/server'

const ROOT_PAGE = 'home'

export const createPageRouter = () => {
    const router = new Hono<{ Bindings: CloudflareBindings; Variables: CloudflareVariables }>()

    Object.entries(Pages).forEach(([key, Component]) => {
        const pageKey = ROOT_PAGE === key.toLowerCase() ? '' : key.toLowerCase()
        router.get(`/${pageKey}`, async (c) => {
            c.header('Content-Type', 'text/html')
            return c.body(
                await renderToReadableStream(
                    <Layout page={pageKey}>
                        <Component />
                    </Layout>,
                ),
            )
        })
    })

    return router
}

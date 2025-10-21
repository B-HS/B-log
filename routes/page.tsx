import { Layout } from '@/components/layout/renderer'
import * as Pages from '@/components/page'
import { Hono } from 'hono'
import { renderToReadableStream } from 'react-dom/server'

const ROOT_PAGE = 'home'

export const createPageRouter = () => {
    const router = new Hono<{ Bindings: CloudflareBindings; Variables: CloudflareVariables }>()

    Object.entries(Pages).forEach(([key, Component]) => {
        const path = ROOT_PAGE === key.toLowerCase() ? '' : key.toLowerCase()
        router.get(`/${path}`, async (c) => {
            c.header('Content-Type', 'text/html')
            return c.body(
                await renderToReadableStream(
                    <Layout page={key.toLowerCase()}>
                        <Component />
                    </Layout>,
                ),
            )
        })
    })

    return router
}

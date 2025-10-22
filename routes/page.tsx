import { Layout } from '@/components/layout/renderer'
import * as Pages from '@/components/page'
import { Hono } from 'hono'
import { renderToReadableStream } from 'react-dom/server'

const ROOT_PAGE = 'home'

export const createPageRouter = () => {
    const router = new Hono<{ Bindings: CloudflareBindings; Variables: CloudflareVariables }>()

    Object.entries(Pages).forEach(([key, Component]) => {
        const keyLower = key.toLowerCase()
        const path = ROOT_PAGE === keyLower ? '' : keyLower

        router.get(`/${path}`, async (c) => {
            c.header('Content-Type', 'text/html')
            return c.body(
                await renderToReadableStream(
                    <Layout page={key}>
                        <Component />
                    </Layout>,
                ),
            )
        })
    })

    return router
}

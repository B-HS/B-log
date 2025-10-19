import { Hono } from 'hono'
import { list, upload, removeById } from '../repository'
import { createAuth } from '../auth'
import { ImageService } from '../services'

export const createR2Router = () => {
    const router = new Hono<{ Bindings: CloudflareBindings; Variables: CloudflareVariables }>()

    router.use('*', async (c, next) => {
        const url = new URL(c.req.url)
        const baseURL = `${url.protocol}//${url.host}`
        const auth = createAuth(c.env, baseURL)
        const session = await auth.api.getSession({
            headers: c.req.raw.headers,
        })

        if (!session) {
            return c.json({ error: 'Unauthorized' }, 401)
        }

        c.set('userId', session.user.id)
        await next()
    })

    router.get('/files', async (c) => {
        const { prefix, limit, cursor } = c.req.query()
        const result = await list(c.env.BUCKET, {
            prefix,
            limit: limit ? parseInt(limit) : undefined,
            cursor,
        })
        return c.json(result)
    })

    router.post('/upload', async (c) => {
        const body = await c.req.parseBody()
        const file = body['file']

        if (!file || typeof file === 'string') {
            return c.json({ error: 'File is required' }, 400)
        }

        const userId = c.get('userId')
        const isImage = file.type.startsWith('image/')

        if (isImage) {
            try {
                const service = ImageService(c.env.BUCKET, c.env.DB, c.env)
                const result = await service.uploadImageWithConversion(file, userId)

                return c.json({
                    id: result.id,
                    originalKey: result.originalKey,
                    variants: result.variants,
                    uploaded: true,
                })
            } catch (error) {
                console.error('Image upload error:', error)
                return c.json(
                    {
                        error: error instanceof Error ? error.message : 'Image upload failed',
                    },
                    500,
                )
            }
        }

        const key = `${Date.now()}-${file.name}`
        const arrayBuffer = await file.arrayBuffer()

        const result = await upload(c.env.BUCKET, key, arrayBuffer, {
            httpMetadata: {
                contentType: file.type,
            },
        })

        return c.json({ key, uploaded: !!result })
    })

    router.delete('/files/:key', async (c) => {
        const key = c.req.param('key')
        await removeById(c.env.BUCKET, key)
        return c.json({ success: true })
    })

    return router
}

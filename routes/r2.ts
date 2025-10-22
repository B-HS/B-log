import { authMiddleware } from '@/auth/middleware'
import { handleError } from '@/utils'
import { DEFAULT_FILE_PREFIX } from '@/constants'
import { Hono } from 'hono'
import { list, upload, removeById } from '../repository'
import { ImageService } from '../services'

export const createR2Router = () => {
    const router = new Hono<{ Bindings: CloudflareBindings; Variables: CloudflareVariables }>()

    router.use('*', authMiddleware)

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
                return handleError(c, error, 'Image upload error')
            }
        }

        const key = `${DEFAULT_FILE_PREFIX}-${Date.now()}-${file.name}`
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

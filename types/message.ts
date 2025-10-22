import * as schema from '@/db/schema'
import type { ImageAssetWithUrl } from './image'

export type MessageWithImages = typeof schema.message.$inferSelect & {
    images: ImageAssetWithUrl[]
    user: {
        id: string
        name: string
        email: string
        image: string | null
    }
}

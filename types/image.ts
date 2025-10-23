import * as schema from '@/db/schema'

export type ImageAsset = typeof schema.imageAsset.$inferSelect

export type ImageAssetWithUrl = ImageAsset & {
    url: string
}

export type ImageVariant = 'thumbnail' | 'mobile' | 'tablet' | 'pc' | 'original'

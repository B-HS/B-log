import { drizzle } from 'drizzle-orm/d1'
import { eq, inArray } from 'drizzle-orm'
import * as schema from '@/db/schema'

export const ImageAssetRepository = (db: D1Database) => {
    const drizzleDb = drizzle(db, { schema })

    const createImageAsset = async (data: {
        id: string
        r2Key: string
        bucket: string
        mimeType: string
        sizeBytes: number
        uploadedBy: string | null
    }) => {
        const [imageAsset] = await drizzleDb
            .insert(schema.imageAsset)
            .values({
                id: data.id,
                r2Key: data.r2Key,
                bucket: data.bucket,
                mimeType: data.mimeType,
                sizeBytes: data.sizeBytes,
                width: null,
                height: null,
                checksum: null,
                uploadedBy: data.uploadedBy,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
            .returning()

        return imageAsset
    }

    return {
        createImageAsset,
    }
}

export const MessageImageRepository = (db: D1Database) => {
    const drizzleDb = drizzle(db, { schema })

    const createMessageImages = async (data: Array<{ messageId: string; imageId: string; order: number; createdAt: Date }>) => {
        await drizzleDb.insert(schema.messageImage).values(data)
    }

    const findMessageImages = async (messageIds: string[]) => {
        return await drizzleDb
            .select({
                messageId: schema.messageImage.messageId,
                imageId: schema.messageImage.imageId,
                order: schema.messageImage.order,
                image: schema.imageAsset,
            })
            .from(schema.messageImage)
            .innerJoin(schema.imageAsset, eq(schema.messageImage.imageId, schema.imageAsset.id))
            .where(inArray(schema.messageImage.messageId, messageIds))
            .orderBy(schema.messageImage.order)
            .all()
    }

    return {
        createMessageImages,
        findMessageImages,
    }
}

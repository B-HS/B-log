import { BUCKET_NAME } from '@/constants/app'
import { ImageAssetRepository } from '@/repository'
import type { ImageVariant } from '@/types'

type ConvertServerResponse = {
    mobile: string
    tablet: string
    pc: string
    thumbnail: string
    original: string
}

type SavedImageVariant = {
    type: ImageVariant
    r2Key: string
}

export const ImageService = (bucket: R2Bucket, db: D1Database, env: CloudflareBindings) => {
    const CONVERT_SERVER_URL = env?.CONVERT_SERVER_URL || process.env.CONVERT_SERVER_URL || ''
    const imageAssetRepo = ImageAssetRepository(db)

    const convertImage = async (file: File | Blob): Promise<ConvertServerResponse> => {
        const formData = new FormData()
        formData.append('image', file)

        const response = await fetch(`${CONVERT_SERVER_URL}/convert`, {
            method: 'POST',
            body: formData,
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Convert server error: ${response.statusText} - ${errorText}`)
        }

        const result = (await response.json()) as ConvertServerResponse
        return result
    }

    const downloadImageFromConvertServer = async (path: string): Promise<ArrayBuffer> => {
        const imageUrl = `${CONVERT_SERVER_URL}${path}`
        const response = await fetch(imageUrl)

        if (!response.ok) {
            throw new Error(`Failed to download image from ${imageUrl}`)
        }

        return response.arrayBuffer()
    }

    const saveOriginalToR2 = async (imageId: string, arrayBuffer: ArrayBuffer, mimeType: string): Promise<string> => {
        const extension = mimeType.split('/')[1] || 'jpg'
        const r2Key = `images/${imageId}/original.${extension}`

        await bucket.put(r2Key, arrayBuffer, {
            httpMetadata: {
                contentType: mimeType,
                cacheControl: 'public, max-age=31536000',
            },
        })

        return r2Key
    }

    const saveVariantToR2 = async (imageId: string, type: ImageVariant, buffer: ArrayBuffer): Promise<string> => {
        const r2Key = `images/${imageId}/${type}.webp`

        await bucket.put(r2Key, buffer, {
            httpMetadata: {
                contentType: 'image/webp',
                cacheControl: 'public, max-age=31536000',
            },
        })

        return r2Key
    }

    const rollbackImageUpload = async (imageId: string) => {
        try {
            const prefix = `images/${imageId}/`
            const objects = await bucket.list({ prefix })

            await Promise.all(objects.objects.map((obj) => bucket.delete(obj.key)))
        } catch (error) {
            console.error('Failed to rollback upload:', error)
        }
    }

    const uploadImageWithConversion = async (file: File | Blob, userId: string | null) => {
        const imageId = crypto.randomUUID()
        const arrayBuffer = await file.arrayBuffer()
        const mimeType = file.type
        const sizeBytes = arrayBuffer.byteLength

        try {
            const originalKey = await saveOriginalToR2(imageId, arrayBuffer, mimeType)

            const convertedUrls = await convertImage(file)

            const variants: SavedImageVariant[] = []

            for (const [type, path] of Object.entries(convertedUrls)) {
                if (type === 'original') continue

                const imageBuffer = await downloadImageFromConvertServer(path)
                const r2Key = await saveVariantToR2(imageId, type as ImageVariant, imageBuffer)

                variants.push({
                    type: type as ImageVariant,
                    r2Key,
                })
            }

            const imageAsset = await imageAssetRepo.createImageAsset({
                id: imageId,
                r2Key: originalKey,
                bucket: BUCKET_NAME,
                mimeType,
                sizeBytes,
                uploadedBy: userId,
            })

            return {
                id: imageAsset.id,
                originalKey,
                variants: {
                    mobile: variants.find((v) => v.type === 'mobile')?.r2Key || null,
                    tablet: variants.find((v) => v.type === 'tablet')?.r2Key || null,
                    pc: variants.find((v) => v.type === 'pc')?.r2Key || null,
                    thumbnail: variants.find((v) => v.type === 'thumbnail')?.r2Key || null,
                },
            }
        } catch (error) {
            await rollbackImageUpload(imageId)
            throw error
        }
    }

    return {
        convertImage,
        downloadImageFromConvertServer,
        saveOriginalToR2,
        saveVariantToR2,
        rollbackImageUpload,
        uploadImageWithConversion,
    }
}

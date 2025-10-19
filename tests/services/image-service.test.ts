import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { ImageService } from '../../services/image-service'
import { setupMiniflare, teardownMiniflare } from '../setup'

describe('ImageService', () => {
    let db: D1Database
    let bucket: R2Bucket
    let originalFetch: typeof global.fetch

    beforeAll(async () => {
        const setup = await setupMiniflare()
        db = setup.db
        bucket = setup.bucket as unknown as R2Bucket
        originalFetch = global.fetch
    })

    afterAll(async () => {
        global.fetch = originalFetch
        await teardownMiniflare()
    })

    describe('convertImage', () => {
        it('이미지를 convert 서버로 전송하고 결과를 반환해야 함', async () => {
            const mockFile = new Blob(['test'], { type: 'image/jpeg' })

            global.fetch = (async () =>
                ({
                    ok: true,
                    status: 200,
                    json: async () => ({
                        mobile: '/mobile.webp',
                        tablet: '/tablet.webp',
                        pc: '/pc.webp',
                        thumbnail: '/thumbnail.webp',
                        original: '/original.jpg',
                    }),
                }) as unknown as Response) as unknown as typeof fetch

            const service = ImageService(bucket, db)
            const result = await service.convertImage(mockFile)

            expect(result.mobile).toBe('/mobile.webp')
            expect(result.tablet).toBe('/tablet.webp')
            expect(result.pc).toBe('/pc.webp')
            expect(result.thumbnail).toBe('/thumbnail.webp')
        })

        it('convert 서버 에러 시 에러를 발생시켜야 함', async () => {
            const mockFile = new Blob(['test'], { type: 'image/jpeg' })

            global.fetch = (async () =>
                ({
                    ok: false,
                    status: 500,
                    statusText: 'Internal Server Error',
                    text: async () => 'Server error',
                }) as unknown as Response) as unknown as typeof fetch

            const service = ImageService(bucket, db)

            await expect(service.convertImage(mockFile)).rejects.toThrow('Convert server error')
        })
    })

    describe('downloadImageFromConvertServer', () => {
        it('convert 서버에서 이미지를 다운로드해야 함', async () => {
            global.fetch = (async () =>
                ({
                    ok: true,
                    status: 200,
                    arrayBuffer: async () => new ArrayBuffer(1024),
                }) as unknown as Response) as unknown as typeof fetch

            const service = ImageService(bucket, db)
            const result = await service.downloadImageFromConvertServer('/test.webp')

            expect(result).toBeInstanceOf(ArrayBuffer)
            expect(result.byteLength).toBe(1024)
        })

        it('다운로드 실패 시 에러를 발생시켜야 함', async () => {
            global.fetch = (async () =>
                ({
                    ok: false,
                    status: 404,
                }) as unknown as Response) as unknown as typeof fetch

            const service = ImageService(bucket, db)

            await expect(service.downloadImageFromConvertServer('/not-found.webp')).rejects.toThrow('Failed to download image')
        })
    })

    describe('saveOriginalToR2', () => {
        it('원본 이미지를 R2에 저장해야 함', async () => {
            const service = ImageService(bucket, db)
            const buffer = new ArrayBuffer(1024)

            const key = await service.saveOriginalToR2('test-id', buffer, 'image/jpeg')

            expect(key).toBe('images/test-id/original.jpeg')

            const stored = await bucket.get(key)
            expect(stored).not.toBeNull()
        })

        it('mimeType에서 확장자를 추출해야 함', async () => {
            const service = ImageService(bucket, db)
            const buffer = new ArrayBuffer(1024)

            const key = await service.saveOriginalToR2('test-id-2', buffer, 'image/png')

            expect(key).toBe('images/test-id-2/original.png')
        })
    })

    describe('saveVariantToR2', () => {
        it('변환된 이미지를 R2에 저장해야 함', async () => {
            const service = ImageService(bucket, db)
            const buffer = new ArrayBuffer(512)

            const key = await service.saveVariantToR2('test-id-3', 'mobile', buffer)

            expect(key).toBe('images/test-id-3/mobile.webp')

            const stored = await bucket.get(key)
            expect(stored).not.toBeNull()
        })

        it('모든 variant 타입을 저장할 수 있어야 함', async () => {
            const service = ImageService(bucket, db)
            const buffer = new ArrayBuffer(512)

            const variants = ['mobile', 'tablet', 'pc', 'thumbnail'] as const

            for (const variant of variants) {
                const key = await service.saveVariantToR2(`test-id-${variant}`, variant, buffer)
                expect(key).toBe(`images/test-id-${variant}/${variant}.webp`)

                const stored = await bucket.get(key)
                expect(stored).not.toBeNull()
            }
        })
    })

    describe('createImageAsset', () => {
        it('이미지 메타데이터를 DB에 저장해야 함', async () => {
            await db
                .prepare(
                    `INSERT INTO user (id, name, email, email_verified, image, created_at, updated_at) VALUES ('img-user-1', 'Image User', 'img@example.com', 0, null, unixepoch('subsec') * 1000, unixepoch('subsec') * 1000)`,
                )
                .run()

            const service = ImageService(bucket, db)

            const result = await service.createImageAsset({
                id: 'img-1',
                r2Key: 'images/img-1/original.jpg',
                bucket: 'b-log',
                mimeType: 'image/jpeg',
                sizeBytes: 1024,
                uploadedBy: 'img-user-1',
            })

            expect(result).toBeDefined()
            expect(result.id).toBe('img-1')
            expect(result.mimeType).toBe('image/jpeg')

            const stored = await db.prepare(`SELECT * FROM image_asset WHERE id = ?`).bind('img-1').first()
            expect(stored).not.toBeNull()
        })
    })

    describe('rollbackImageUpload', () => {
        it('업로드된 모든 이미지 파일을 삭제해야 함', async () => {
            await bucket.put('images/rollback-test/original.jpg', new ArrayBuffer(100))
            await bucket.put('images/rollback-test/mobile.webp', new ArrayBuffer(50))
            await bucket.put('images/rollback-test/tablet.webp', new ArrayBuffer(50))

            const service = ImageService(bucket, db)
            await service.rollbackImageUpload('rollback-test')

            const original = await bucket.get('images/rollback-test/original.jpg')
            const mobile = await bucket.get('images/rollback-test/mobile.webp')
            const tablet = await bucket.get('images/rollback-test/tablet.webp')

            expect(original).toBeNull()
            expect(mobile).toBeNull()
            expect(tablet).toBeNull()
        })

        it('에러 발생 시에도 실패하지 않아야 함', async () => {
            const service = ImageService(bucket, db)

            await service.rollbackImageUpload('non-existent-id')
        })
    })

    describe('uploadImageWithConversion', () => {
        it('이미지 업로드와 변환을 완료해야 함', async () => {
            await db
                .prepare(
                    `INSERT INTO user (id, name, email, email_verified, image, created_at, updated_at) VALUES ('upload-user', 'Upload User', 'upload@example.com', 0, null, unixepoch('subsec') * 1000, unixepoch('subsec') * 1000)`,
                )
                .run()

            const mockFile = new Blob(['test image data'], { type: 'image/jpeg' })

            global.fetch = (async (url: string | URL) => {
                const urlString = url.toString()
                if (urlString.includes('/convert')) {
                    return {
                        ok: true,
                        status: 200,
                        json: async () => ({
                            mobile: '/mobile.webp',
                            tablet: '/tablet.webp',
                            pc: '/pc.webp',
                            thumbnail: '/thumbnail.webp',
                            original: '/original.jpg',
                        }),
                        arrayBuffer: async () => new ArrayBuffer(0),
                    } as unknown as Response
                } else {
                    return {
                        ok: true,
                        status: 200,
                        json: async () => ({}),
                        arrayBuffer: async () => new ArrayBuffer(512),
                    } as unknown as Response
                }
            }) as unknown as typeof fetch

            const service = ImageService(bucket, db)
            const result = await service.uploadImageWithConversion(mockFile, 'upload-user')

            expect(result).toBeDefined()
            expect(result.id).toBeDefined()
            expect(result.originalKey).toContain('original.jpeg')
            expect(result.variants.mobile).toContain('mobile.webp')
            expect(result.variants.tablet).toContain('tablet.webp')
            expect(result.variants.pc).toContain('pc.webp')
            expect(result.variants.thumbnail).toContain('thumbnail.webp')

            const dbRecord = await db.prepare(`SELECT * FROM image_asset WHERE id = ?`).bind(result.id).first()
            expect(dbRecord).not.toBeNull()

            await db.prepare(`DELETE FROM image_asset WHERE id = ?`).bind(result.id).run()
        })

        it('변환 실패 시 롤백을 수행해야 함', async () => {
            const mockFile = new Blob(['test'], { type: 'image/jpeg' })

            global.fetch = (async () =>
                ({
                    ok: false,
                    status: 500,
                    statusText: 'Error',
                    text: async () => 'Conversion failed',
                }) as unknown as Response) as unknown as typeof fetch

            const service = ImageService(bucket, db)

            await expect(service.uploadImageWithConversion(mockFile, 'user-1')).rejects.toThrow()
        })
    })
})

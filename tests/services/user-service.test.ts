import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { UserService } from '../../services/user-service'
import { setupMiniflare, teardownMiniflare } from '../setup'

describe('UserService', () => {
    let db: D1Database

    beforeAll(async () => {
        const setup = await setupMiniflare()
        db = setup.db

        await db
            .prepare(
                `INSERT INTO user (id, name, email, email_verified, image, created_at, updated_at) VALUES ('user-1', 'Test User', 'test@example.com', 0, 'https://example.com/image.jpg', unixepoch('subsec') * 1000, unixepoch('subsec') * 1000)`,
            )
            .run()
    })

    afterAll(async () => {
        await teardownMiniflare()
    })

    describe('updateUserName', () => {
        it('사용자 이름을 업데이트해야 함', async () => {
            const service = UserService(db)
            const result = await service.updateUserName('user-1', 'New Name')

            expect(result).toBeDefined()
            expect(result.name).toBe('New Name')
            expect(result.updatedAt).toBeInstanceOf(Date)
        })
    })

    describe('updateUserImage', () => {
        it('사용자 이미지를 업데이트해야 함', async () => {
            const service = UserService(db)
            const result = await service.updateUserImage('user-1', 'https://new-image.com/photo.jpg')

            expect(result).toBeDefined()
            expect(result.image).toBe('https://new-image.com/photo.jpg')
            expect(result.updatedAt).toBeInstanceOf(Date)
        })
    })

    describe('updateUserProfile', () => {
        it('이름만 업데이트해야 함', async () => {
            const service = UserService(db)
            const result = await service.updateUserProfile('user-1', { name: 'Only Name' })

            expect(result).toBeDefined()
            expect(result.name).toBe('Only Name')
        })

        it('이미지만 업데이트해야 함', async () => {
            const service = UserService(db)
            const result = await service.updateUserProfile('user-1', { image: 'https://only-image.com/pic.png' })

            expect(result).toBeDefined()
            expect(result.image).toBe('https://only-image.com/pic.png')
        })

        it('이름과 이미지를 모두 업데이트해야 함', async () => {
            const service = UserService(db)
            const result = await service.updateUserProfile('user-1', {
                name: 'Both Name',
                image: 'https://both.com/image.jpg',
            })

            expect(result).toBeDefined()
            expect(result.name).toBe('Both Name')
            expect(result.image).toBe('https://both.com/image.jpg')
        })

        it('빈 객체로 호출 시 updatedAt만 업데이트해야 함', async () => {
            const service = UserService(db)
            const result = await service.updateUserProfile('user-1', {})

            expect(result).toBeDefined()
            expect(result.updatedAt).toBeInstanceOf(Date)
        })
    })
})

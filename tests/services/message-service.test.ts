import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test'
import { MessageService } from '../../services/message-service'
import { setupMiniflare, teardownMiniflare } from '../setup'

describe('MessageService', () => {
    let db: D1Database

    beforeAll(async () => {
        const setup = await setupMiniflare()
        db = setup.db

        await db
            .prepare(
                `INSERT INTO user (id, name, email, email_verified, image, created_at, updated_at) VALUES ('user-1', 'Test User', 'test@example.com', 0, null, unixepoch('subsec') * 1000, unixepoch('subsec') * 1000)`,
            )
            .run()
    })

    afterAll(async () => {
        await teardownMiniflare()
    })

    beforeEach(async () => {
        try {
            await db.prepare(`DELETE FROM message_image`).run()
        } catch (e) {
            // table might not exist yet
        }
        await db.prepare(`DELETE FROM message`).run()
    })

    describe('getMessages', () => {
        it('메시지 목록을 페이지네이션과 함께 반환해야 함', async () => {
            await db
                .prepare(
                    `INSERT INTO message (id, user_id, body, created_at, updated_at, deleted_at) VALUES ('msg-1', 'user-1', 'Test message', datetime('now'), datetime('now'), null)`,
                )
                .run()

            const service = MessageService(db)
            const result = await service.getMessages(1, 10)

            expect(result).toBeDefined()
            expect(result.content.length).toBe(1)
            expect(result.totalElements).toBe(1)
            expect(result.totalPages).toBe(1)
            expect(result.content[0].body).toBe('Test message')
            expect(result.content[0].user.name).toBe('Test User')
        })

        it('메시지가 없을 때 빈 배열을 반환해야 함', async () => {
            const service = MessageService(db)
            const result = await service.getMessages(1, 10)

            expect(result.content).toEqual([])
            expect(result.totalElements).toBe(0)
            expect(result.totalPages).toBe(0)
            expect(result.prev).toBeNull()
            expect(result.next).toBeNull()
        })

        it('user_id로 필터링된 메시지를 반환해야 함', async () => {
            await db
                .prepare(
                    `INSERT INTO user (id, name, email, email_verified, image, created_at, updated_at) VALUES ('user-2', 'User 2', 'user2@example.com', 0, null, unixepoch('subsec') * 1000, unixepoch('subsec') * 1000)`,
                )
                .run()

            await db
                .prepare(
                    `INSERT INTO message (id, user_id, body, created_at, updated_at, deleted_at) VALUES ('msg-1', 'user-1', 'Message 1', datetime('now'), datetime('now'), null)`,
                )
                .run()

            await db
                .prepare(
                    `INSERT INTO message (id, user_id, body, created_at, updated_at, deleted_at) VALUES ('msg-2', 'user-2', 'Message 2', datetime('now'), datetime('now'), null)`,
                )
                .run()

            const service = MessageService(db)
            const result = await service.getMessages(1, 10, 'user-1')

            expect(result.content.length).toBe(1)
            expect(result.content[0].userId).toBe('user-1')
        })

        it('삭제된 메시지는 제외해야 함', async () => {
            await db
                .prepare(
                    `INSERT INTO message (id, user_id, body, created_at, updated_at, deleted_at) VALUES ('msg-active', 'user-1', 'Active', unixepoch('subsec') * 1000, unixepoch('subsec') * 1000, null)`,
                )
                .run()

            await new Promise((resolve) => setTimeout(resolve, 10))

            await db
                .prepare(
                    `INSERT INTO message (id, user_id, body, created_at, updated_at, deleted_at) VALUES ('msg-deleted', 'user-1', 'Deleted', unixepoch('subsec') * 1000 + 1, unixepoch('subsec') * 1000 + 1, unixepoch('subsec') * 1000)`,
                )
                .run()

            const service = MessageService(db)
            const result = await service.getMessages(1, 10)

            expect(result.content.length).toBe(1)
            expect(result.content[0].body).toBe('Active')
        })

        it('pagination이 올바르게 작동해야 함', async () => {
            for (let i = 1; i <= 15; i++) {
                await db
                    .prepare(
                        `INSERT INTO message (id, user_id, body, created_at, updated_at, deleted_at) VALUES ('msg-page-${i}', 'user-1', 'Message ${i}', unixepoch('subsec') * 1000 + ${i}, unixepoch('subsec') * 1000 + ${i}, null)`,
                    )
                    .run()
                await new Promise((resolve) => setTimeout(resolve, 2))
            }

            const service = MessageService(db)

            const page1 = await service.getMessages(1, 10)
            expect(page1.content.length).toBe(10)
            expect(page1.totalElements).toBe(15)
            expect(page1.totalPages).toBe(2)
            expect(page1.prev).toBeNull()
            expect(page1.next).toBe(2)

            const page2 = await service.getMessages(2, 10)
            expect(page2.content.length).toBe(5)
            expect(page2.prev).toBe(1)
            expect(page2.next).toBeNull()
        })
    })

    describe('createMessage', () => {
        it('새 메시지를 생성해야 함', async () => {
            const service = MessageService(db)
            const result = await service.createMessage('user-1', 'New message', [])

            expect(result).toBeDefined()
            expect(result.body).toBe('New message')
            expect(result.userId).toBe('user-1')
            expect(result.deletedAt).toBeNull()
        })

        it('이미지와 함께 메시지를 생성해야 함', async () => {
            await db
                .prepare(
                    `INSERT INTO image_asset (id, r2_key, bucket, mime_type, size_bytes, width, height, checksum, uploaded_by, created_at, updated_at)
                     VALUES ('img-1', 'test.jpg', 'test', 'image/jpeg', 1024, null, null, null, 'user-1', datetime('now'), datetime('now'))`,
                )
                .run()

            await db
                .prepare(
                    `INSERT INTO image_asset (id, r2_key, bucket, mime_type, size_bytes, width, height, checksum, uploaded_by, created_at, updated_at)
                     VALUES ('img-2', 'test2.jpg', 'test', 'image/jpeg', 1024, null, null, null, 'user-1', datetime('now'), datetime('now'))`,
                )
                .run()

            const service = MessageService(db)
            const result = await service.createMessage('user-1', 'Message with images', ['img-1', 'img-2'])

            expect(result).toBeDefined()

            const images = await db.prepare(`SELECT * FROM message_image WHERE message_id = ?`).bind(result.id).all()
            expect(images.results.length).toBe(2)
        })
    })

    describe('softDeleteMessage', () => {
        it('메시지를 soft delete 해야 함', async () => {
            await db
                .prepare(
                    `INSERT INTO message (id, user_id, body, created_at, updated_at, deleted_at) VALUES ('msg-1', 'user-1', 'Test', datetime('now'), datetime('now'), null)`,
                )
                .run()

            const service = MessageService(db)
            const result = await service.softDeleteMessage('msg-1', 'user-1')

            expect(result.success).toBe(true)

            const deleted = await db.prepare(`SELECT deleted_at FROM message WHERE id = 'msg-1'`).first()
            expect(deleted).not.toBeNull()
            expect(deleted!.deleted_at).not.toBeNull()
        })

        it('존재하지 않는 메시지 삭제 시 에러를 발생시켜야 함', async () => {
            const service = MessageService(db)

            await expect(service.softDeleteMessage('non-existent', 'user-1')).rejects.toThrow('Message not found')
        })

        it('권한이 없는 사용자의 삭제 시도 시 에러를 발생시켜야 함', async () => {
            await db
                .prepare(
                    `INSERT INTO message (id, user_id, body, created_at, updated_at, deleted_at) VALUES ('msg-1', 'user-1', 'Test', datetime('now'), datetime('now'), null)`,
                )
                .run()

            const service = MessageService(db)

            await expect(service.softDeleteMessage('msg-1', 'user-2')).rejects.toThrow('Unauthorized')
        })

        it('이미 삭제된 메시지 삭제 시 에러를 발생시켜야 함', async () => {
            await db
                .prepare(
                    `INSERT INTO message (id, user_id, body, created_at, updated_at, deleted_at) VALUES ('msg-1', 'user-1', 'Test', datetime('now'), datetime('now'), datetime('now'))`,
                )
                .run()

            const service = MessageService(db)

            await expect(service.softDeleteMessage('msg-1', 'user-1')).rejects.toThrow('Message not found')
        })
    })
})

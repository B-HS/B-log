import { drizzle } from 'drizzle-orm/d1'
import { eq, and, sql, desc, SQL } from 'drizzle-orm'
import * as schema from '@/db/schema'

export const FollowRepository = (db: D1Database) => {
    const drizzleDb = drizzle(db, { schema })

    const createFollow = async (followerId: string, followingId: string) => {
        const [newFollow] = await drizzleDb
            .insert(schema.follow)
            .values({
                followerId,
                followingId,
                createdAt: new Date(),
            })
            .returning()
        return newFollow
    }

    const deleteFollow = async (followerId: string, followingId: string) => {
        await drizzleDb
            .delete(schema.follow)
            .where(and(eq(schema.follow.followerId, followerId), eq(schema.follow.followingId, followingId)))
    }

    const checkFollowExists = async (followerId: string, followingId: string) => {
        const result = await drizzleDb
            .select()
            .from(schema.follow)
            .where(and(eq(schema.follow.followerId, followerId), eq(schema.follow.followingId, followingId)))
            .limit(1)
            .all()
        return result.length > 0
    }

    const getFollowersByUserId = async (userId: string, page: number, size: number) => {
        const offset = (page - 1) * size

        return await drizzleDb
            .select({
                follow: schema.follow,
                user: schema.user,
            })
            .from(schema.follow)
            .innerJoin(schema.user, eq(schema.follow.followerId, schema.user.id))
            .where(eq(schema.follow.followingId, userId))
            .orderBy(desc(schema.follow.createdAt))
            .limit(size)
            .offset(offset)
            .all()
    }

    const getFollowingByUserId = async (userId: string, page: number, size: number) => {
        const offset = (page - 1) * size

        return await drizzleDb
            .select({
                follow: schema.follow,
                user: schema.user,
            })
            .from(schema.follow)
            .innerJoin(schema.user, eq(schema.follow.followingId, schema.user.id))
            .where(eq(schema.follow.followerId, userId))
            .orderBy(desc(schema.follow.createdAt))
            .limit(size)
            .offset(offset)
            .all()
    }

    const countFollowers = async (userId: string) => {
        const [{ count }] = await drizzleDb
            .select({ count: sql<number>`count(*)` })
            .from(schema.follow)
            .where(eq(schema.follow.followingId, userId))
            .all()
        return count
    }

    const countFollowing = async (userId: string) => {
        const [{ count }] = await drizzleDb
            .select({ count: sql<number>`count(*)` })
            .from(schema.follow)
            .where(eq(schema.follow.followerId, userId))
            .all()
        return count
    }

    const checkFollowStatus = async (currentUserId: string, targetUserId: string) => {
        const results = await drizzleDb
            .select()
            .from(schema.follow)
            .where(
                and(
                    sql`(${schema.follow.followerId} = ${currentUserId} AND ${schema.follow.followingId} = ${targetUserId}) OR (${schema.follow.followerId} = ${targetUserId} AND ${schema.follow.followingId} = ${currentUserId})`,
                ),
            )
            .all()

        const isFollowing = results.some((r) => r.followerId === currentUserId && r.followingId === targetUserId)
        const isFollowedBy = results.some((r) => r.followerId === targetUserId && r.followingId === currentUserId)

        return { isFollowing, isFollowedBy }
    }

    return {
        createFollow,
        deleteFollow,
        checkFollowExists,
        getFollowersByUserId,
        getFollowingByUserId,
        countFollowers,
        countFollowing,
        checkFollowStatus,
    }
}

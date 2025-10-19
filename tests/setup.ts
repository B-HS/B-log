import { Miniflare } from 'miniflare'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

let mf: Miniflare

export const setupMiniflare = async () => {
    mf = new Miniflare({
        modules: true,
        script: '',
        d1Databases: {
            DB: 'test-db',
        },
        r2Buckets: {
            BUCKET: 'test-bucket',
        },
    })

    const db = await mf.getD1Database('DB')
    const bucket = await mf.getR2Bucket('BUCKET')

    const drizzleDir = join(process.cwd(), 'drizzle')
    const sqlFiles = readdirSync(drizzleDir)
        .filter((f) => f.endsWith('.sql'))
        .sort()

    for (const file of sqlFiles) {
        const sql = readFileSync(join(drizzleDir, file), 'utf-8')
        const statements = sql
            .split('--> statement-breakpoint')
            .map((s) => s.trim())
            .filter((s) => s.length > 0 && !s.startsWith('--'))

        for (const statement of statements) {
            try {
                await db.prepare(statement).run()
            } catch (error) {
                console.warn(`Failed to execute statement: ${statement.substring(0, 100)}...`, error)
            }
        }
    }

    return { db, bucket, mf }
}

export const teardownMiniflare = async () => {
    if (mf) {
        await mf.dispose()
    }
}

export const getMiniflare = () => mf

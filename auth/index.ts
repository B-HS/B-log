import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../db/schema'

export const createAuth = (env?: CloudflareBindings, baseURL?: string) => {
    const db = env ? drizzle(env.DB, { schema, logger: true }) : ({} as ReturnType<typeof drizzle>)

    return betterAuth({
        baseURL: baseURL || 'https://log.gumyo.net',
        database: env
            ? drizzleAdapter(db, {
                  provider: 'sqlite',
                  schema: {
                      user: schema.user,
                      session: schema.session,
                      account: schema.account,
                      verification: schema.verification,
                  },
              })
            : drizzleAdapter({} as D1Database, {
                  provider: 'sqlite',
              }),
        socialProviders: {
            github: {
                clientId: env?.GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID || '',
                clientSecret: env?.GITHUB_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET || '',
            },
        },
        trustedOrigins: ['*.gumyo.net'],
    })
}

export const auth = createAuth()

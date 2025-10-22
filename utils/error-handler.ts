import type { Context } from 'hono'

export type ErrorResponse = {
    error: string
}

export const handleError = (c: Context, error: unknown, defaultMessage = 'Internal server error') => {
    console.error(defaultMessage, error)

    if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase()

        if (errorMessage.includes('not found')) {
            return c.json({ error: error.message }, 404)
        }

        if (errorMessage.includes('unauthorized')) {
            return c.json({ error: error.message }, 403)
        }

        if (errorMessage.includes('required') || errorMessage.includes('invalid')) {
            return c.json({ error: error.message }, 400)
        }

        return c.json({ error: error.message }, 500)
    }

    return c.json({ error: defaultMessage }, 500)
}

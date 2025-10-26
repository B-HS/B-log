import { Hono } from 'hono'
import { createAuthRouter, createMessageRouter, createR2Router, createUserRouter, createFollowRouter } from './routes'
import { createPageRouter } from './routes/page'
import { cors } from 'hono/cors'

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.use(
    '*',
    cors({
        origin: ['gumyo.net', 'localhost'],
    }),
)

const authRouter = createAuthRouter()
const r2Router = createR2Router()
const userRouter = createUserRouter()
const messageRouter = createMessageRouter()
const followRouter = createFollowRouter()
const pageRouter = createPageRouter()

app.route('/api/auth', authRouter)
app.route('/api/r2', r2Router)
app.route('/api/user', userRouter)
app.route('/api/messages', messageRouter)
app.route('/api/follow', followRouter)
app.route('/', pageRouter)
export default app

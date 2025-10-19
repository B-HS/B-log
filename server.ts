import { Hono } from 'hono'
import { createAuthRouter, createMessageRouter, createR2Router, createUserRouter } from './routes'
import { createPageRouter } from './routes/page'

const app = new Hono<{ Bindings: CloudflareBindings }>()

const authRouter = createAuthRouter()
const r2Router = createR2Router()
const userRouter = createUserRouter()
const messageRouter = createMessageRouter()
const pageRouter = createPageRouter()

app.route('/api/auth', authRouter)
app.route('/api/r2', r2Router)
app.route('/api/user', userRouter)
app.route('/api/messages', messageRouter)
app.route('/', pageRouter)
export default app

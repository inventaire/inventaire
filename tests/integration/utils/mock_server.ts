import express from 'express'
import { jsonBodyParser } from '#server/middlewares/content'
import requestsLogger from '#server/middlewares/requests_logger'
import type { Host, Origin } from '#types/common'

// Avoid reusing ports from the previous test session, as hosts bans data might be restored
let port = 10000 + parseInt(Date.now().toString().slice(-4))

type App = ReturnType<typeof express>
export type Server = ReturnType<App['listen']>

export function startGenericMockServer (serverSetupFn: (app: App) => void): Promise<{ port: number, host: Host, origin: Origin, server: Server }> {
  return new Promise(resolve => {
    port++
    const app = express()
    const host = `127.0.0.1:${port}`
    const origin: Origin = `http://${host}`
    app.use(requestsLogger)
    app.use(jsonBodyParser)
    serverSetupFn(app)
    const server = app.listen(port, () => resolve({ port, host, origin, server }))
  })
}

const express = require('express')
const requestsLogger = require('server/middlewares/requests_logger')
// Avoid reusing ports from the previous test session, as hosts bans data might be restored
let port = 10000 + parseInt(Date.now().toString().slice(-4))

const startGenericMockServer = serverSetupFn => new Promise(resolve => {
  port++
  const app = express()
  const host = `127.0.0.1:${port}`
  const origin = `http://${host}`
  app.use(requestsLogger)
  serverSetupFn(app)
  const server = app.listen(port, () => resolve({ port, host, origin, server }))
})

module.exports = { startGenericMockServer }

require('should')
const express = require('express')
const requests_ = require('lib/requests')
const { wait } = require('lib/promises')
let port = 39463

const startHangingupServer = () => new Promise(resolve => {
  port++
  const app = express()
  const host = `localhost:${port}`
  const origin = `http://${host}`
  let firstConnexion = true
  app.get('/', async (req, res) => {
    await wait(100)
    res.json({ ok: true })
  })
  const server = app.listen(port, () => resolve({ port, host, origin }))
  server.on('connection', socket => {
    if (firstConnexion) {
      console.log('hang up on first attempt', host)
      socket.destroy()
      firstConnexion = false
    } else {
      console.log('not hanging up on following attemps', host)
    }
  })
})

describe('socket', () => {
  it('should retry after a socket hang-out', async () => {
    const { origin } = await startHangingupServer()
    const { ok } = await requests_.get(origin)
    ok.should.be.true()
  })
})

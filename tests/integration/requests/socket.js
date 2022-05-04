require('should')
const requests_ = require('lib/requests')
const { wait } = require('lib/promises')
const { startGenericMockServer } = require('../utils/mock_server')

const startHangingupServer = async () => {
  let firstConnexion = true
  const { server, host, origin } = await startGenericMockServer(app => {
    app.get('/', async (req, res) => {
      await wait(100)
      res.json({ ok: true })
    })
  })
  server.on('connection', socket => {
    if (firstConnexion) {
      console.log('hang up on first attempt', host)
      socket.destroy()
      firstConnexion = false
    } else {
      console.log('not hanging up on following attemps', host)
    }
  })
  return { origin }
}

describe('socket', () => {
  it('should retry after a socket hang-out', async () => {
    const { origin } = await startHangingupServer()
    const { ok } = await requests_.get(origin)
    ok.should.be.true()
  })
})

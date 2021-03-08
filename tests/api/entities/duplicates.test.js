const CONFIG = require('config')
const __ = CONFIG.universalPath
const { wait } = require('lib/promises')
const { adminReq } = require('../utils/utils')
const endpoint = '/api/entities?action=duplicates'
const { createHuman, humanName } = require('../fixtures/entities')

describe('entities:duplicates', () => {
  it('should return names and duplicates number', async () => {
    const someName = humanName()
    await Promise.all([
      createHuman({ labels: { en: someName } }),
      createHuman({ labels: { en: someName } })
    ])
    await wait(100)
    const { names } = await adminReq('get', endpoint)
    names.should.be.an.Array()
    const foundRow = names.find(row => row.key === someName.toLowerCase())
    foundRow.value.should.equal(2)
  })
})

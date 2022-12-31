import { wait } from 'lib/promises'
import { adminReq } from '../utils/utils'
import { createHuman, humanName } from '../fixtures/entities'
const endpoint = '/api/entities?action=duplicates'

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

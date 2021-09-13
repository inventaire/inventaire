require('should')
const { publicReq } = require('../utils/utils')
const { generateIsbn13 } = require('../fixtures/entities')

describe('actions_controllers', () => {
  it('should accept request with the action as a query string parameter', async () => {
    const isbn = generateIsbn13()
    await publicReq('get', `/api/data?action=isbn&isbn=${isbn}`)
  })

  it('should accept request with the action in the path', async () => {
    const isbn = generateIsbn13()
    await publicReq('get', `/api/data/isbn?isbn=${isbn}`)
  })
})

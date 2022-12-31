import 'should'
import { authReq } from '../utils/utils'
const endpoint = '/api/relations'

describe('relations:get', () => {
  it('should return user relations data', async () => {
    const res = await authReq('get', endpoint)
    res.friends.should.be.an.Array()
    res.otherRequested.should.be.an.Array()
    res.network.should.be.an.Array()
  })
})

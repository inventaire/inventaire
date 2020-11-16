const { adminReq } = require('../utils/utils')
const endpoint = '/api/entities?action=activity'

describe('entities:activity', () => {
  it('should return user and contributions number', async () => {
    const { activity } = await adminReq('get', endpoint)
    activity.should.be.an.Array()
    activity[0].user.should.be.a.String()
    activity[0].contributions.should.be.a.Number()
  })
})

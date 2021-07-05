const { simpleDay } = require('lib/utils/base')
const { adminReq } = require('../utils/utils')
const endpoint = '/api/entities?action=activity'

describe('entities:activity', () => {
  it('should return user and contributions number', async () => {
    const { activity } = await adminReq('get', endpoint)
    activity.should.be.an.Array()
    activity[0].user.should.be.a.String()
    activity[0].contributions.should.be.a.Number()
  })

  it('should restrict activity to the specfied period', async () => {
    const { activity, start, end } = await adminReq('get', `${endpoint}&period=1`)
    const yesterdayTime = Date.now() - (24 * 60 * 60 * 1000)
    const yesterday = simpleDay(yesterdayTime)
    const today = simpleDay()
    activity.should.be.an.Array()
    start.should.equal(yesterday)
    end.should.equal(today)
  })
})

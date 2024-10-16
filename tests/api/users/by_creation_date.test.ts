import { map } from 'lodash-es'
import { createUser } from '#fixtures/users'
import { buildUrl } from '#lib/utils/url'
import { abuseErr } from '#tests/api/user/abuse_reports.test'
import { customAuthReq } from '#tests/api/utils/request'
import { adminReq } from '#tests/api/utils/utils'

const getUrl = query => buildUrl('/api/users', { action: 'by-creation-date', ...query })

describe('users:by-creation-date', () => {
  it('should get the latest users', async () => {
    const user = await createUser()
    const { users } = await adminReq('get', getUrl({ limit: 2 }))
    users.should.be.an.Array()
    users.length.should.equal(2)
    map(users, '_id').should.containEql(user._id)
  })

  it('should include abuse reports', async () => {
    const user = await createUser()
    await customAuthReq(user, 'post', '/api/reports?action=error-report', { error: abuseErr })
    const { users } = await adminReq('get', getUrl({ limit: 2 }))
    const resUser = users.find(resUser => resUser._id === user._id)
    resUser.reports.length.should.equal(1)
  })
})

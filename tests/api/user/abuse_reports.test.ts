import should from 'should'
import { createUser } from '#fixtures/users'
import { newError } from '#lib/error/error'
import { buildUrl } from '#lib/utils/url'
import { customAuthReq } from '#tests/api/utils/request'
import { adminReq, authReq, publicReq } from '#tests/api/utils/utils'

const context = { type: 'spam', text: 'SEO! https://spamers.corp' }
export const abuseErr = newError('possible spam attempt', 598, context)

describe('user:abuse reports', () => {
  it('should ignore an abuse report without user', async () => {
    await publicReq('post', '/api/reports?action=error-report', { error: abuseErr })
  })

  it('should save an abuse report', async () => {
    const user = await createUser()
    await customAuthReq(user, 'post', '/api/reports?action=error-report', { error: abuseErr })
    const { users: adminViewUsers } = await adminReq('get', buildUrl('/api/users', { action: 'by-ids', ids: user._id }))
    const adminViewUser = adminViewUsers[user._id]
    adminViewUser.reports.length.should.equal(1)
    adminViewUser.reports[0].type.should.equal('spam')
  })

  it('should not let non-admin users get the abuse report', async () => {
    const user = await createUser()
    await customAuthReq(user, 'post', '/api/reports?action=error-report', { error: abuseErr })
    const { users: nonAdminViewUsers } = await authReq('get', buildUrl('/api/users', { action: 'by-ids', ids: user._id }))
    const nonAdminViewUser = nonAdminViewUsers[user._id]
    should(nonAdminViewUser.reports).not.be.ok()
  })
})

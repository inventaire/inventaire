import { map } from 'lodash-es'
import { createUser, someSpamText } from '#fixtures/users'
import { wait } from '#lib/promises'
import { buildUrl } from '#lib/utils/url'
import { catchSpamRejection, updateUser } from '#tests/api/utils/users'
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
    const spammyUser = await createUser()
    await updateUser({ user: spammyUser, attribute: 'bio', value: someSpamText }).catch(catchSpamRejection)
    await wait(200)
    const { users } = await adminReq('get', getUrl({ limit: 10 }))
    const resUser = users.find(resUser => resUser._id === spammyUser._id)
    resUser.reports.length.should.equal(1)
  })

  describe('filter=with-reports', () => {
    it('should only include users with reports', async () => {
      const spammyUser = await createUser()
      await updateUser({ user: spammyUser, attribute: 'bio', value: someSpamText }).catch(catchSpamRejection)
      const { users } = await adminReq('get', getUrl({ limit: 10, filter: 'with-reports' }))
      users.length.should.be.above(0)
      for (const user of users) {
        user.reports.length.should.be.above(0)
      }
    })
  })
})

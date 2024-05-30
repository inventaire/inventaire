import { map } from 'lodash-es'
import { createUser } from '#fixtures/users'
import { buildUrl } from '#lib/utils/url'
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
})

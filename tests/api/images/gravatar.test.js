import 'should'
import { authReq } from '../utils/utils'
const endpoint = '/api/images?action=gravatar'

describe('images:gravatar', () => {
  it('should return a gravatar url', async () => {
    const { url } = await authReq('get', endpoint)
    url.should.startWith('https://www.gravatar.com/avatar/')
    url.should.endWith('?d=404&s=500')
    const md5Hash = url.split('/').at(-1).split('?')[0]
    md5Hash.should.match(/^[0-9a-f]{32}$/)
  })
})

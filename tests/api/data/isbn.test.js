import 'should'
import { publicReq, shouldNotBeCalled } from '../utils/utils'
import randomString from 'lib/utils/random_string'
import { generateIsbn13 } from '../fixtures/entities'
const endpoint = '/api/data?action=isbn'

describe('data:isbn', () => {
  it('should reject requests without isbn', async () => {
    await publicReq('get', endpoint)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: isbn')
    })
  })

  it('should reject requests with invalid isbn', async () => {
    await publicReq('get', `${endpoint}&isbn=${randomString(10)}`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid isbn')
    })
  })

  it('should return isbn information', async () => {
    const isbn = generateIsbn13()
    await publicReq('get', `${endpoint}&isbn=${isbn}`)
    .then(res => {
      res.isValid.should.be.true()
      res.isbn13.should.equal(isbn)
    })
  })
})

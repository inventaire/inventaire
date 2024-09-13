import 'should'
import { generateIsbn13 } from '#fixtures/entities'
import { getRandomString } from '#lib/utils/random_string'
import { publicReq } from '#tests/api/utils/utils'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

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
    await publicReq('get', `${endpoint}&isbn=${getRandomString(10)}`)
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

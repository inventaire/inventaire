const should = require('should')
const { publicReq, shouldNotBeCalled } = require('../utils/utils')
const endpoint = '/api/data?action=wp-extract'
const randomString = require('lib/utils/random_string')

describe('wikipedia:extract', () => {
  it('should reject without title', async () => {
    await publicReq('get', endpoint)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: title')
    })
  })

  it('should return empty response when no page is found', async () => {
    const randomTitle = randomString(15)
    await publicReq('get', `${endpoint}&title=${randomTitle}`)
    .then(res => {
      should(res.extract).not.be.ok()
    })
  })

  it('should get english Wikipedia article by default', async () => {
    await publicReq('get', `${endpoint}&title=Gilbert_Simondon`)
    .then(res => {
      res.url.should.equal('https://en.wikipedia.org/wiki/Gilbert_Simondon')
      res.extract.should.startWith('Gilbert Simondon')
    })
  })

  it('should get an extract in the appropriate language', async () => {
    await publicReq('get', `${endpoint}&lang=fr&title=Gilbert_Simondon`)
    .then(res => {
      res.url.should.equal('https://fr.wikipedia.org/wiki/Gilbert_Simondon')
      res.extract.should.startWith('Gilbert Simondon')
    })
  })
})

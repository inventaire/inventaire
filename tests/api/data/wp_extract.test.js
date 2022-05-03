require('should')
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

  it('should reject when no page is found', async () => {
    const randomTitle = randomString(15)
    await publicReq('get', `${endpoint}&title=${randomTitle}`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(404)
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

  it("should correctly encode title's special characters", async () => {
    const title = encodeURIComponent("Qu'est-ce que la vie ?")
    await publicReq('get', `${endpoint}&lang=fr&title=${title}`)
    .then(res => {
      res.url.should.equal('https://fr.wikipedia.org/wiki/Qu%27est-ce_que_la_vie_%3F')
    })
  })
})

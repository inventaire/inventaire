
require('should')
const { nonAuthReq } = require('../utils/utils')

describe('wikipedia:extract', () => it('should get an extract of a Wikipedia article', done => {
  nonAuthReq('get', '/api/data?action=wp-extract&lang=fr&title=Gilbert_Simondon')
  .then(res => {
    res.url.should.equal('https://fr.wikipedia.org/wiki/Gilbert_Simondon')
    res.extract.should.startWith('Gilbert Simondon')
    done()
  })
  .catch(done)
}))

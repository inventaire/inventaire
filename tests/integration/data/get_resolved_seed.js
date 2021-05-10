const should = require('should')
const getResolvedSeed = require('data/dataseed/get_resolved_seed')

describe('get resolved seed', () => {
  it('should get an edition entity', async () => {
    const edition = await getResolvedSeed('978-2-207-11674-6')
    edition.claims['wdt:P629'].should.deepEqual([ 'wd:Q3210286' ])
    edition.claims['wdt:P268'].should.deepEqual([ '437169336' ])
  })

  it('should not get an entry from an unknown ISBN', async () => {
    const edition = await getResolvedSeed('978-3-9818987-4-3')
    should(edition).not.be.ok()
  })
})

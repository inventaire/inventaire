import { getAnalyzedTokens } from 'tests/api/utils/search'
// Testing on the entities index, but as all index are created with the same settings
// by server/db/elasticsearch/create_index.js, they all get the same analyzers
const indexBaseName = 'entities'

describe('analyzers', () => {
  describe('autocomplete', () => {
    const analyzer = 'autocomplete'
    it('should generate edge-ngrams tokens', async () => {
      const tokens = await getAnalyzedTokens({ indexBaseName, text: 'charles dickens', analyzer })
      tokens.should.deepEqual([
        'ch', 'cha', 'char', 'charl', 'charle', 'charles',
        'di', 'dic', 'dick', 'dicke', 'dicken', 'dickens',
      ])
    })

    it('should generate lowercased tokens', async () => {
      const tokens = await getAnalyzedTokens({ indexBaseName, text: 'ChArLes', analyzer })
      tokens.should.deepEqual([ 'ch', 'cha', 'char', 'charl', 'charle', 'charles' ])
    })

    it('should generate asciifolded tokens', async () => {
      const tokens = await getAnalyzedTokens({ indexBaseName, text: 'chärlés', analyzer })
      tokens.should.deepEqual([ 'ch', 'cha', 'char', 'charl', 'charle', 'charles' ])
    })

    it('should not generate tokens above the max ngram of 10', async () => {
      const tokens = await getAnalyzedTokens({ indexBaseName, text: 'charleshenrydecomptesponville', analyzer })
      tokens.should.deepEqual([ 'ch', 'cha', 'char', 'charl', 'charle', 'charles', 'charlesh', 'charleshe', 'charleshen' ])
    })

    it('should generate a single letter token', async () => {
      const tokens = await getAnalyzedTokens({ indexBaseName, text: 'o', analyzer })
      tokens.should.deepEqual([ 'o' ])
    })

    it('should drop dashes', async () => {
      const tokens = await getAnalyzedTokens({ indexBaseName, text: 'foo-bar', analyzer })
      tokens.should.deepEqual([ 'fo', 'foo', 'ba', 'bar' ])
    })

    it('should drop apostrophes', async () => {
      const tokens = await getAnalyzedTokens({ indexBaseName, text: "l'eau", analyzer })
      tokens.should.deepEqual([ 'le', 'lea', 'leau', 'l', 'ea', 'eau' ])
    })
  })

  describe('standard_truncated', () => {
    const analyzer = 'standard_truncated'
    standardAnalyzersCommonTests(analyzer)

    it('should truncate above the max ngram of 10', async () => {
      const tokens = await getAnalyzedTokens({ indexBaseName, text: 'charleshenrydecomptesponville', analyzer })
      tokens.should.deepEqual([ 'charleshen' ])
    })

    it('should generate a single letter token', async () => {
      const tokens = await getAnalyzedTokens({ indexBaseName, text: 'o', analyzer })
      tokens.should.deepEqual([ 'o' ])
    })

    it('should drop dashes', async () => {
      const tokens = await getAnalyzedTokens({ indexBaseName, text: 'foo-bar', analyzer })
      tokens.should.deepEqual([ 'foo', 'bar' ])
    })
  })

  describe('standard_full', () => {
    const analyzer = 'standard_full'
    standardAnalyzersCommonTests(analyzer)

    it('should not truncate tokens', async () => {
      const tokens = await getAnalyzedTokens({ indexBaseName, text: 'charleshenrydecomptesponville', analyzer })
      tokens.should.deepEqual([ 'charleshenrydecomptesponville' ])
    })

    it('should generate a single letter token', async () => {
      const tokens = await getAnalyzedTokens({ indexBaseName, text: 'o', analyzer })
      tokens.should.deepEqual([ 'o' ])
    })

    it('should drop dashes', async () => {
      const tokens = await getAnalyzedTokens({ indexBaseName, text: 'foo-bar', analyzer })
      tokens.should.deepEqual([ 'foo', 'bar' ])
    })
  })
})

function standardAnalyzersCommonTests (analyzer) {
  it('should not generate edge-ngrams tokens', async () => {
    const tokens = await getAnalyzedTokens({ indexBaseName, text: 'charles', analyzer })
    tokens.should.deepEqual([ 'charles' ])
  })

  it('should generate a lowercased token', async () => {
    const tokens = await getAnalyzedTokens({ indexBaseName, text: 'ChArLes', analyzer })
    tokens.should.deepEqual([ 'charles' ])
  })

  it('should generate an asciifolded token', async () => {
    const tokens = await getAnalyzedTokens({ indexBaseName, text: 'chärlés', analyzer })
    tokens.should.deepEqual([ 'charles' ])
  })
}

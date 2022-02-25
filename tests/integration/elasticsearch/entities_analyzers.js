const { getAnalyzedTokens } = require('tests/api/utils/search')
const indexBaseName = 'entities'

describe('entities analyzers', () => {
  describe('autocomplete', () => {
    const analyzer = 'autocomplete'
    it('should generate edge-ngrams tokens', async () => {
      const tokens = await getAnalyzedTokens({ indexBaseName, text: 'charles', analyzer })
      tokens.should.deepEqual([ 'ch', 'cha', 'char', 'charl', 'charle', 'charles' ])
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
  })

  describe('standard_truncated', () => {
    const analyzer = 'standard_truncated'
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

    it('should truncate above the max ngram of 10', async () => {
      const tokens = await getAnalyzedTokens({ indexBaseName, text: 'charleshenrydecomptesponville', analyzer })
      tokens.should.deepEqual([ 'charleshen' ])
    })

    it('should generate a single letter token', async () => {
      const tokens = await getAnalyzedTokens({ indexBaseName, text: 'o', analyzer })
      tokens.should.deepEqual([ 'o' ])
    })
  })

  describe('standard_full', () => {
    const analyzer = 'standard_full'
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

    it('should not truncate tokens', async () => {
      const tokens = await getAnalyzedTokens({ indexBaseName, text: 'charleshenrydecomptesponville', analyzer })
      tokens.should.deepEqual([ 'charleshenrydecomptesponville' ])
    })

    it('should generate a single letter token', async () => {
      const tokens = await getAnalyzedTokens({ indexBaseName, text: 'o', analyzer })
      tokens.should.deepEqual([ 'o' ])
    })
  })
})

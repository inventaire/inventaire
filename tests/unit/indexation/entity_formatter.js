const _ = require('builders/utils')
const Q535 = require('./fixtures/Q535.customized.json')
require('should')
const entityFormatter = require('db/elasticsearch/formatters/entity')

describe('indexation: entity formatter', () => {
  describe('flatten fields', () => {
    it('should include words from inactive languages', async () => {
      const doc = await entityFormatter(_.cloneDeep(Q535), { quick: true })
      doc.flattenedLabels.includes('rdtfgexupo').should.be.true()
      doc.flattenedAliases.includes('bbcpsptnhh').should.be.true()
      doc.flattenedAliases.includes('ebnkwspgrw').should.be.true()
      doc.flattenedAliases.includes('depfrznqhb').should.be.true()
      doc.flattenedDescriptions.includes('tstnhvhwvv').should.be.true()
    })

    it('should not duplicate main fields words', async () => {
      const doc = await entityFormatter(_.cloneDeep(Q535), { quick: true })
      const flattenedLabelsWords = doc.flattenedLabels.split(' ')
      const flattenedAliasesWords = doc.flattenedAliases.split(' ')
      const flattenedDescriptionsWords = doc.flattenedDescriptions.split(' ')
      const mainFieldsTerms = Object.values(doc.labels)
        .concat(Object.values(doc.descriptions))
        .concat(_.flatten(Object.values(doc.aliases)))
      mainFieldsTerms.forEach(term => {
        term.split(' ').forEach(termWord => {
          flattenedLabelsWords.should.not.containEql(termWord)
          flattenedAliasesWords.should.not.containEql(termWord)
          flattenedDescriptionsWords.should.not.containEql(termWord)
        })
      })
    })
  })
})

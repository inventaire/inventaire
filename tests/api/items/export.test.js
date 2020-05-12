const CONFIG = require('config')
const __ = CONFIG.universalPath
const host = CONFIG.fullPublicHost()
require('should')
const { customAuthReq, getReservedUser } = __.require('apiTests', 'utils/utils')
const { createItem } = require('../fixtures/items')
const { createEditionWithWorkAuthorAndSerie, addPublisher, addTranslator } = require('../fixtures/entities')
const { getByUri, addClaim, parseLabel } = require('../utils/entities')
const { parse } = require('papaparse')

const endpoint = '/api/items?action=export&format=csv'
const genresUris = [ 'wd:Q131539', 'wd:Q192782' ]
const subjectUri = 'wd:Q18120925'
const details = 'my details: \'Lorem?!#$ ipsum\' dolor; sit amet, consectetur "adipisicing" elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. (See also https://en.wikipedia.org/wiki/Lorem_ipsum).'
const notes = 'some private notes'
const generateUrl = path => `${host}${path}`
const generateEntityUrl = uri => generateUrl(`/entity/${uri}`)
const generateEntitiesUrls = uris => uris.map(generateEntityUrl).join(',')

describe('items:export', () => {
  describe('csv', () => {
    it('should return a csv export of the requesting user', async () => {
      const user = await getReservedUser()
      const edition = await createEditionWithWorkAuthorAndSerie()
      const publisher = await addPublisher(edition)
      const publisherLabel = parseLabel(publisher)
      const translator = await addTranslator(edition)
      const translatorLabel = parseLabel(translator)
      await addClaim(edition.uri, 'wdt:P1104', 10)
      const workUri = edition.claims['wdt:P629'][0]
      const work = await getByUri(workUri)
      const workLabel = parseLabel(work)
      const serieUri = work.claims['wdt:P179'][0]
      await addClaim(work.uri, 'wdt:P921', subjectUri)
      await addClaim(work.uri, 'wdt:P364', edition.claims['wdt:P407'][0])
      // Do not add in parallel so that they are added in that order
      await addClaim(work.uri, 'wdt:P136', genresUris[0])
      await addClaim(work.uri, 'wdt:P136', genresUris[1])
      const authorUri = work.claims['wdt:P50'][0]
      const author = await getByUri(authorUri)
      const authorLabel = parseLabel(author)
      const item = await createItem(user, { entity: edition.uri, details, notes })
      const res = await customAuthReq(user, 'get', endpoint)
      const { data, errors } = parse(res, { header: true })
      // Checking that we generate standard CSV as validated by the papaparse lib
      errors.should.deepEqual([])
      const itemRow = data[0]
      itemRow['Item URL'].should.equal(generateUrl(`/items/${item._id}`))
      itemRow['Edition URL'].should.equal(generateEntityUrl(item.entity))
      itemRow['ISBN-13'].should.equal('')
      itemRow['ISBN-10'].should.equal('')
      itemRow.Title.should.equal(edition.claims['wdt:P1476'][0])
      itemRow.Subtitle.should.equal(edition.claims['wdt:P1680'][0])
      itemRow['Publication Date'].should.equal('')
      itemRow.Cover.should.equal(generateUrl('/img/entities/aaaaaaaaaabbbbbbbbbbccccccccccdddddddddd'))
      itemRow['Number of pages'].should.equal('10')
      itemRow['Edition Lang'].should.equal('English')
      itemRow['Original Lang'].should.equal('English')
      itemRow['Translators labels'].should.equal(translatorLabel)
      itemRow['Translators URLs'].should.equal(generateEntityUrl(translator.uri))
      itemRow['Works URLs'].should.equal(generateEntityUrl(workUri))
      itemRow['Works labels'].should.equal(workLabel)
      itemRow['Works Series ordinals'].should.equal('')
      itemRow['Authors URLs'].should.equal(generateEntityUrl(authorUri))
      itemRow['Authors labels'].should.equal(authorLabel)
      itemRow['Series URLs'].should.equal(generateEntityUrl(serieUri))
      itemRow['Series labels'].should.be.a.String()
      itemRow['Genres URLs'].should.equal(generateEntitiesUrls(genresUris))
      itemRow['Genres labels'].should.be.a.String()
      itemRow['Subjects URLs'].should.equal(generateEntityUrl(subjectUri))
      itemRow['Subjects labels'].should.be.a.String()
      itemRow['Publisher URLs'].should.equal(generateEntityUrl(publisher.uri))
      itemRow['Publisher label'].should.equal(publisherLabel)
      itemRow['Item details'].should.equal(details)
      itemRow['Item notes'].should.equal(notes)
      itemRow['Item created'].should.equal(new Date(item.created).toISOString())
    })
  })
})

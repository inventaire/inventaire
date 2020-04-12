const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { customAuthReq, getReservedUser } = __.require('apiTests', 'utils/utils')
const { createItem } = require('../fixtures/items')
const { createEditionWithWorkAuthorAndSerie, addPublisher } = require('../fixtures/entities')
const { getByUri, addClaim, parseLabel } = require('../utils/entities')
const { parse } = require('papaparse')

const endpoint = '/api/items?action=export&format=csv'
const genresUris = [ 'wd:Q131539', 'wd:Q192782' ]
const subjectUri = 'wd:Q18120925'
const details = 'my details: \'Lorem?!#$ ipsum\' dolor; sit amet, consectetur "adipisicing" elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. (See also https://en.wikipedia.org/wiki/Lorem_ipsum).'
const notes = 'some private notes'

describe('items:export', () => {
  describe('csv', () => {
    it('should return a csv export of the requesting user', async () => {
      const user = await getReservedUser()
      const edition = await createEditionWithWorkAuthorAndSerie()
      const publisher = await addPublisher(edition)
      const publisherLabel = parseLabel(publisher)
      const workUri = edition.claims['wdt:P629'][0]
      const work = await getByUri(workUri)
      const workLabel = parseLabel(work)
      const serieUri = work.claims['wdt:P179'][0]
      await addClaim(work.uri, 'wdt:P921', subjectUri)
      // Do not add in parallel so that they are added in that order
      await addClaim(work.uri, 'wdt:P136', genresUris[0])
      await addClaim(work.uri, 'wdt:P136', genresUris[1])
      const authorUri = work.claims['wdt:P50'][0]
      const author = await getByUri(authorUri)
      const authorLabel = parseLabel(author)
      const item = await createItem(user, { entity: edition.uri, details, notes })
      const res = await customAuthReq(user, 'get', endpoint)
      const { data, errors } = parse(res, { header: true })
      errors.should.deepEqual([])
      const itemRow = data[0]
      itemRow['Item ID'].should.equal(item._id)
      itemRow['Edition URI'].should.equal(item.entity)
      itemRow['ISBN-13'].should.equal('')
      itemRow['ISBN-10'].should.equal('')
      itemRow.Title.should.equal(edition.claims['wdt:P1476'][0])
      itemRow.Subtitle.should.equal(edition.claims['wdt:P1680'][0])
      itemRow.PublicationDate.should.equal('')
      itemRow.Cover.should.equal('')
      itemRow['Works URIs'].should.equal(workUri)
      itemRow['Works labels'].should.equal(workLabel)
      itemRow['Works Series ordinals'].should.equal('')
      itemRow['Authors URIs'].should.equal(authorUri)
      itemRow['Authors labels'].should.equal(authorLabel)
      itemRow['Series URIs'].should.equal(serieUri)
      itemRow['Series labels'].should.be.a.String()
      itemRow['Genres URIs'].should.equal(genresUris.join(','))
      itemRow['Genres labels'].should.be.a.String()
      itemRow['Subjects URIs'].should.equal(subjectUri)
      itemRow['Subjects labels'].should.be.a.String()
      itemRow['Publisher URIs'].should.equal(publisher.uri)
      itemRow['Publisher label'].should.equal(publisherLabel)
      itemRow['Item details'].should.equal(details)
      itemRow['Item notes'].should.equal(notes)
      itemRow['Item created'].should.equal(new Date(item.created).toISOString())
    })
  })
})

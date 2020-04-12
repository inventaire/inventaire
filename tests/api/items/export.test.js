const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { customAuthReq, getReservedUser } = __.require('apiTests', 'utils/utils')
const { createItem } = require('../fixtures/items')
const { createEditionWithWorkAuthorAndSerie, addPublisher } = require('../fixtures/entities')
const { getByUri, addClaim, parseLabel } = require('../utils/entities')

const endpoint = '/api/items?action=export&format=csv'
const genresUris = [ 'wd:Q131539', 'wd:Q192782' ]
const subjectUri = 'wd:Q18120925'

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
      const item = await createItem(user, { entity: edition.uri })
      const res = await customAuthReq(user, 'get', endpoint)
      const [ header, itemRow ] = res.split('\n')
      const headerParts = header.split(',')
      headerParts[0].should.equal('Item ID')
      const itemRowParts = itemRow.split(',')

      // itemRowParts.forEach((part, i) => console.log(i, part))

      // Item ID
      itemRowParts[0].should.equal(item._id)
      // Edition URI
      itemRowParts[1].should.equal(item.entity)
      // ISBN-13
      itemRowParts[2].should.equal('')
      // ISBN-10
      itemRowParts[3].should.equal('')
      // Title
      itemRowParts[4].should.equal(edition.claims['wdt:P1476'][0])
      // Subtitle
      itemRowParts[5].should.equal(edition.claims['wdt:P1680'][0])
      // PublicationDate
      itemRowParts[6].should.equal('')
      // Cover
      itemRowParts[7].should.equal('')
      // Works URIs
      itemRowParts[8].should.equal(workUri)
      // Works Labels
      itemRowParts[9].should.equal(workLabel)
      // Works Series ordinals
      itemRowParts[10].should.equal('')
      // Authors URIs
      itemRowParts[11].should.equal(authorUri)
      // Authors Labels
      itemRowParts[12].should.equal(authorLabel)
      // Series URIs
      itemRowParts[14].should.equal(serieUri)
      // Series Labels
      // Genres URIs
      itemRowParts[15].should.equal(`"${genresUris[0]}`)
      itemRowParts[18].should.equal(`${genresUris[1]}"`)
      // Genres Labels
      // Subjects URIs
      itemRowParts[20].should.equal(subjectUri)
      // Subjects Labels
      // Publisher URIs
      itemRowParts[21].should.equal(publisher.uri)
      // Publisher Label
      itemRowParts[22].should.equal(publisherLabel)
    })
  })
})

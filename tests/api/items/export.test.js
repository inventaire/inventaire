const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const host = CONFIG.fullPublicHost()
require('should')
const { rawCustomAuthReq } = __.require('apiTests', 'utils/request')
const { getReservedUser } = __.require('apiTests', 'utils/utils')
const { createItem } = require('../fixtures/items')
const { createEdition, createWork, createEditionFromWorks, createEditionWithWorkAuthorAndSerie, addPublisher, addTranslator, someImageHash } = require('../fixtures/entities')
const { createUser } = require('../fixtures/users')
const { getByUri, addClaim, parseLabel, updateLabel } = require('../utils/entities')
const { parse } = require('papaparse')

const endpoint = '/api/items?action=export&format=csv'
const generateUrl = path => `${host}${path}`
const generateEntityUrl = uri => generateUrl(`/entity/${uri}`)
const generateEntitiesUrls = uris => uris.map(generateEntityUrl)
const userPromise = getReservedUser()

const reqAndParse = async (itemId, user) => {
  if (!user) { user = userPromise }
  const { body } = await rawCustomAuthReq(user, 'get', endpoint)
  const { data, errors } = parse(body, { header: true })
  // Checking that we generate standard CSV as validated by the papaparse lib
  errors.should.deepEqual([])
  return data.find(row => {
    const dataItemId = _.last(row['Item URL'].split('/'))
    return dataItemId === itemId
  })
}

describe('items:export', () => {
  describe('csv', () => {
    it('should return items data', async () => {
      const details = 'my details: \'Lorem?!#$ ipsum\' dolor; sit amet, consectetur "adipisicing" elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. (See also https://en.wikipedia.org/wiki/Lorem_ipsum).'
      const notes = 'some private notes'
      const item = await createItem(userPromise, { details, notes })

      const itemRow = await reqAndParse(item._id)
      itemRow['Item URL'].should.equal(generateUrl(`/items/${item._id}`))
      itemRow['Item details'].should.equal(details)
      itemRow['Item notes'].should.equal(notes)
      itemRow['Item created'].should.equal(new Date(item.created).toISOString())
      itemRow['Item visibility'].should.equal('public')
      itemRow['Item transaction'].should.equal('inventorying')
    })

    it('should return minimal entities data', async () => {
      const work = await createWork()
      const edition = await createEditionFromWorks(work)
      const item = await createItem(userPromise, { entity: edition.uri })

      const itemRow = await reqAndParse(item._id)
      itemRow['Edition URL'].should.equal(generateEntityUrl(item.entity))
      itemRow['ISBN-13'].should.equal('')
      itemRow['ISBN-10'].should.equal('')
      itemRow.Title.should.equal(edition.claims['wdt:P1476'][0])
      itemRow['Works URLs'].should.equal(generateEntityUrl(work.uri))
    })

    it('should return edition and work language', async () => {
      const user = createUser({ language: 'fr' })
      const edition = await createEdition({ lang: 'fr' })
      const workUri = edition.claims['wdt:P629'][0]
      const work = await getByUri(workUri)
      await addClaim(work.uri, 'wdt:P407', edition.claims['wdt:P407'][0])

      const item = await createItem(user, { entity: edition.uri })

      const itemRow = await reqAndParse(item._id, user)
      itemRow['Edition Lang'].should.equal('français')
      itemRow['Original Lang'].should.equal('français')
    })

    it('should return entities labels by user language or fallback to english', async () => {
      const user = createUser({ language: 'fr' })
      const edition = await createEditionWithWorkAuthorAndSerie()
      const workUri = edition.claims['wdt:P629'][0]
      const work = await getByUri(workUri)
      const author = await getByUri(work.claims['wdt:P50'][0])
      const frenchTitle = 'titre en français'
      await updateLabel(work.uri, 'fr', frenchTitle)
      const item = await createItem(user, { entity: edition.uri })
      const authorLabel = parseLabel(author)
      await updateLabel(author.uri, 'es', 'shall not display this')
      const itemRow = await reqAndParse(item._id, user)

      itemRow['Works labels'].should.equal(frenchTitle)
      itemRow['Authors labels'].should.equal(authorLabel)
    })

    it('should return a csv export of the requesting user', async () => {
      const genresUris = [ 'wd:Q131539', 'wd:Q192782' ]
      const subjectUri = 'wd:Q18120925'
      const edition = await createEditionWithWorkAuthorAndSerie()
      const publisher = await addPublisher(edition)
      const publisherLabel = parseLabel(publisher)
      const translator = await addTranslator(edition)
      const translatorLabel = parseLabel(translator)
      await addClaim(edition.uri, 'wdt:P1104', 10)
      const workUri = edition.claims['wdt:P629'][0]
      const work = await getByUri(workUri)
      const authorUri = work.claims['wdt:P50'][0]
      const serieUri = work.claims['wdt:P179'][0]
      await Promise.all([
        addClaim(work.uri, 'wdt:P921', subjectUri),
        addClaim(work.uri, 'wdt:P136', genresUris[0]),
        addClaim(work.uri, 'wdt:P136', genresUris[1])
      ])
      const item = await createItem(userPromise, { entity: edition.uri })

      const itemRow = await reqAndParse(item._id)
      itemRow.Subtitle.should.equal(edition.claims['wdt:P1680'][0])
      itemRow.Cover.should.equal(`${host}/img/entities/${someImageHash}`)
      itemRow['Publication Date'].should.equal('')
      itemRow['Number of pages'].should.equal('10')
      itemRow['Translators labels'].should.equal(translatorLabel)
      itemRow['Translators URLs'].should.equal(generateEntityUrl(translator.uri))
      itemRow['Authors URLs'].should.equal(generateEntityUrl(authorUri))
      itemRow['Works Series ordinals'].should.equal('')
      itemRow['Series URLs'].should.equal(generateEntityUrl(serieUri))
      itemRow['Series labels'].should.be.a.String()
      itemRow['Genres URLs'].split(',').sort().should.deepEqual((generateEntitiesUrls(genresUris)))
      itemRow['Genres labels'].should.be.a.String()
      itemRow['Subjects URLs'].should.equal(generateEntityUrl(subjectUri))
      itemRow['Subjects labels'].should.be.a.String()
      itemRow['Publisher URLs'].should.equal(generateEntityUrl(publisher.uri))
      itemRow['Publisher label'].should.equal(publisherLabel)
    })

    it('should escape double quotes', async () => {
      const user = createUser({ language: 'fr' })
      const title = '"foo" : bar, buzz'
      const edition = await createEdition({ title })
      const item = await createItem(user, { entity: edition.uri })
      const itemRow = await reqAndParse(item._id, user)
      itemRow.Title.should.equal(title)
    })
  })
})

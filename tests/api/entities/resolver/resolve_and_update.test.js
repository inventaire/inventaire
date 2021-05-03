const CONFIG = require('config')
const _ = require('builders/utils')
require('should')
const { wait } = require('lib/promises')
const { authReq, shouldNotBeCalled } = require('apiTests/utils/utils')
const { getByUris, getByUri, addClaim, getHistory } = require('apiTests/utils/entities')
const { createWork, createHuman, createEditionWithIsbn, someGoodReadsId, someLibraryThingsWorkId, generateIsbn13, createEdition, generateIsbn13h } = require('apiTests/fixtures/entities')
const resolveAndUpdate = entries => {
  entries = _.forceArray(entries)
  return authReq('post', '/api/entities?action=resolve', {
    entries,
    update: true
  })
}

describe('entities:resolver:update-resolved', () => {
  it('should not update entity claim values if property exists', async () => {
    const libraryThingsWorkId = someLibraryThingsWorkId()
    const authorUri = 'wd:Q35802'
    const authorUri2 = 'wd:Q184226'
    const entry = {
      edition: { isbn: generateIsbn13() },
      works: [ {
        claims: {
          'wdt:P1085': [ libraryThingsWorkId ],
          'wdt:P50': [ authorUri ]
        }
      }
      ]
    }
    const work = await createWork()
    await addClaim(work.uri, 'wdt:P1085', libraryThingsWorkId)
    await addClaim(work.uri, 'wdt:P50', authorUri2)
    const { entries } = await resolveAndUpdate(entry)
    const entityUri = entries[0].works[0].uri
    const { claims } = await getByUri(entityUri)
    claims['wdt:P50'].should.not.containEql(authorUri)
  })

  it('should update entities claims values if property does not exist', async () => {
    const entryA = someEntryWithAGoodReadsWorkId()
    const entryB = someEntryWithAGoodReadsWorkId()
    const libraryThingsWorkIdA = entryA.works[0].claims['wdt:P1085'][0]
    const libraryThingsWorkIdB = entryB.works[0].claims['wdt:P1085'][0]
    const [ workA, workB ] = await Promise.all([ createWork(), createWork() ])
    await Promise.all([
      addClaim(workA.uri, 'wdt:P1085', libraryThingsWorkIdA),
      addClaim(workB.uri, 'wdt:P1085', libraryThingsWorkIdB)
    ])
    const { entries } = await resolveAndUpdate([ entryA, entryB ])
    const workAUri = entries[0].works[0].uri
    const workBUri = entries[1].works[0].uri
    const { entities } = await getByUris([ workAUri, workBUri ])
    const updatedWorkA = entities[workAUri]
    const updatedWorkB = entities[workBUri]
    updatedWorkA.claims['wdt:P50'][0].should.equal(entryA.works[0].claims['wdt:P50'][0])
    updatedWorkB.claims['wdt:P50'][0].should.equal(entryB.works[0].claims['wdt:P50'][0])
  })

  it('should update authors claims', async () => {
    const goodReadsId = someGoodReadsId()
    const officialWebsite = 'http://Q35802.org'
    const entry = {
      edition: { isbn: generateIsbn13() },
      authors: [ {
        claims: {
          'wdt:P2963': [ goodReadsId ],
          'wdt:P856': [ officialWebsite ]
        }
      }
      ]
    }
    const human = await createHuman()
    await addClaim(human.uri, 'wdt:P2963', goodReadsId)
    const { entries } = await resolveAndUpdate(entry)
    const authorUri = entries[0].authors[0].uri
    authorUri.should.equal(human.uri)
    const { claims } = await getByUri(authorUri)
    claims['wdt:P856'].should.containEql(officialWebsite)
  })

  it('should update edition claims', async () => {
    const numberOfPages = 3
    const { uri, isbn } = await createEditionWithIsbn()
    const entry = {
      edition: {
        isbn,
        claims: { 'wdt:P1104': numberOfPages }
      }
    }
    await resolveAndUpdate(entry)
    await wait(10)
    const { claims } = await getByUri(uri)
    claims['wdt:P1104'].should.containEql(numberOfPages)
  })

  // Requires a running dataseed service and CONFIG.dataseed.enabled=true
  xit('should add an image claim from an image url to the updated edition', async () => {
    const { uri: editionUri, isbn } = await createEditionWithIsbn()
    const entry = {
      edition: {
        isbn,
        image: 'https://covers.openlibrary.org/w/id/263997-M.jpg'
      }
    }
    await resolveAndUpdate(entry)
    await wait(10)
    const { claims } = await getByUri(editionUri)
    claims['invp:P2'][0].should.be.ok()
  })

  // Requires a running dataseed service and CONFIG.dataseed.enabled=true
  xit('should refuse to add an invalid image', async () => {
    const validUrlButNotAnImage = `${CONFIG.fullHost()}/api/tests`
    const { isbn } = await createEditionWithIsbn()
    const entry = {
      edition: {
        isbn,
        image: validUrlButNotAnImage
      }
    }
    try {
      await resolveAndUpdate(entry).then(shouldNotBeCalled)
    } catch (err) {
      err.statusCode.should.equal(400)
      // Having a more specific error would be nice,
      // but that's better than nothing
      err.body.status_verbose.should.equal('request error')
    }
  })

  it('should not override an existing image', async () => {
    const isbn13h = generateIsbn13h()
    const edition = await createEdition({
      claims: {
        'wdt:P212': [ isbn13h ]
      }
    })
    const originalImageHash = edition.claims['invp:P2'][0]
    originalImageHash.should.be.ok()
    const entry = {
      edition: {
        isbn: isbn13h,
        image: 'https://covers.openlibrary.org/w/id/263997-M.jpg'
      }
    }
    await resolveAndUpdate(entry)
    await wait(10)
    const { claims } = await getByUri(edition.uri)
    claims['invp:P2'][0].should.equal(originalImageHash)
  })

  it('should add a batch timestamp to patches', async () => {
    const startTime = Date.now()
    const entryA = someEntryWithAGoodReadsWorkId()
    const entryB = someEntryWithAGoodReadsWorkId()
    const libraryThingsWorkIdA = entryA.works[0].claims['wdt:P1085'][0]
    const libraryThingsWorkIdB = entryB.works[0].claims['wdt:P1085'][0]
    const [ workA, workB ] = await Promise.all([ createWork(), createWork() ])
    await Promise.all([
      addClaim(workA.uri, 'wdt:P1085', libraryThingsWorkIdA),
      addClaim(workB.uri, 'wdt:P1085', libraryThingsWorkIdB)
    ])
    await resolveAndUpdate([ entryA, entryB ])
    const [ workAPatches, workBPatches ] = await Promise.all([
      getHistory(workA.uri),
      getHistory(workB.uri)
    ])
    const lastWorkAPatch = workAPatches.slice(-1)[0]
    const lastWorkBPatch = workBPatches.slice(-1)[0]
    lastWorkBPatch.batch.should.equal(lastWorkAPatch.batch)
    const { batch: batchId } = lastWorkAPatch
    batchId.should.be.a.Number()
    batchId.should.above(startTime)
    batchId.should.below(Date.now())
  })

  it('should not update if entry date is as precise as entity date', async () => {
    const year = '2020'
    const { uri, isbn } = await createEditionWithIsbn({ publicationDate: year })
    const entry = {
      edition: {
        isbn,
        claims: { 'wdt:P577': year }
      }
    }
    const { version } = await getByUri(uri)
    const preResolvedEntityVersion = version

    await resolveAndUpdate(entry)
    await wait(10)
    const { version: postResolvedVersion } = await getByUri(uri)
    postResolvedVersion.should.equal(preResolvedEntityVersion)
  })

  it('should not update if entry date disagree with entity date', async () => {
    const entryDate = '2020-01-01'
    const entityDate = '2021'
    const { uri, isbn } = await createEditionWithIsbn({ publicationDate: entityDate })
    const entry = {
      edition: {
        isbn,
        claims: { 'wdt:P577': entryDate }
      }
    }
    const { version } = await getByUri(uri)
    const preResolvedEntityVersion = version

    await resolveAndUpdate(entry)
    await wait(10)
    const { version: postResolvedVersion } = await getByUri(uri)
    postResolvedVersion.should.equal(preResolvedEntityVersion)
  })

  it('should update if entry date is more precise than entity date', async () => {
    const entryDate = '2020-01-01'
    const entityDate = '2020'
    const { uri, isbn } = await createEditionWithIsbn({ publicationDate: entityDate })
    const entry = {
      edition: {
        isbn,
        claims: { 'wdt:P577': entryDate }
      }
    }
    const { version } = await getByUri(uri)
    const preResolvedEntityVersion = version

    await resolveAndUpdate(entry)
    await wait(10)
    const { version: postResolvedVersion } = await getByUri(uri)
    postResolvedVersion.should.equal(preResolvedEntityVersion + 1)
  })

  it('should update if is an entry date and no current date', async () => {
    const entryDate = '2020-02-03'
    const { uri, isbn } = await createEditionWithIsbn({ publicationDate: null })
    const entry = {
      edition: {
        isbn,
        claims: { 'wdt:P577': entryDate }
      }
    }
    await resolveAndUpdate(entry)
    await wait(10)
    const updatedEntity = await getByUri(uri)
    updatedEntity.claims['wdt:P577'].should.deepEqual([ entryDate ])
  })

  it('should update authors date claims', async () => {
    const entryDate = '2020-01-01'
    const entityDate = '2020'
    const goodReadsId = someGoodReadsId()
    const entry = {
      edition: { isbn: generateIsbn13() },
      authors: [ {
        claims: {
          'wdt:P2963': [ goodReadsId ],
          'wdt:P569': [ entryDate ]
        }
      }
      ]
    }
    const human = await createHuman()
    await addClaim(human.uri, 'wdt:P2963', goodReadsId)
    await addClaim(human.uri, 'wdt:P569', entityDate)
    const { entries } = await resolveAndUpdate(entry)
    const authorUri = entries[0].authors[0].uri
    const { claims } = await getByUri(authorUri)
    claims['wdt:P569'].should.containEql(entryDate)
  })
})

const someEntryWithAGoodReadsWorkId = () => ({
  edition: { isbn: generateIsbn13() },
  works: [
    {
      claims: {
        'wdt:P1085': [ someLibraryThingsWorkId() ],
        'wdt:P50': [ 'wd:Q35802' ]
      }
    }
  ]
})

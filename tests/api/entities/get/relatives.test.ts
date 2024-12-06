import {
  createEditionWithWorkAuthorAndSerie,
  createWorkWithAuthor,
} from '#tests/api/fixtures/entities'
import { getByUris } from '#tests/api/utils/entities'
import { rethrowShouldNotBeCalledErrors, shouldNotBeCalled } from '#tests/unit/utils/utils'

let workWithAuthorPromise

describe('entities:get:by-uris:relatives', () => {
  before(() => {
    workWithAuthorPromise = createWorkWithAuthor()
  })
  it("should accept a 'relatives' parameter", async () => {
    const work = await workWithAuthorPromise
    const { uri: workUri } = work
    const authorUri = work.claims['wdt:P50'][0]
    const res = await getByUris(workUri, 'wdt:P50')
    res.entities[workUri].should.be.an.Object()
    res.entities[authorUri].should.be.an.Object()
  })

  it("should reject a non-allowlisted 'relatives' parameter", async () => {
    const work = await workWithAuthorPromise
    const { uri: workUri } = work
    try {
      await getByUris(workUri, 'wdt:P31')
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid relative')
    }
  })

  it('should be able to include the works, authors, and series of an edition', async () => {
    const { uri: editionUri } = await createEditionWithWorkAuthorAndSerie()
    const res = await getByUris(editionUri, 'wdt:P50|wdt:P179|wdt:P629')
    const edition = res.entities[editionUri]
    edition.should.be.an.Object()

    const workUri = edition.claims['wdt:P629'][0]
    const work = res.entities[workUri]
    work.should.be.an.Object()

    const authorUri = work.claims['wdt:P50'][0]
    const author = res.entities[authorUri]
    author.should.be.an.Object()

    const serieUri = work.claims['wdt:P179'][0]
    const serie = res.entities[serieUri]
    serie.should.be.an.Object()
  })
})

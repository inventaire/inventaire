const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { Promise, Wait } = __.require('lib', 'promises')
const { authReq, getUserId } = require('../utils/utils')
const { getById: getItem } = require('../utils/items')
let { getByUris, merge, revertMerge, updateLabel, updateClaim } = require('../utils/entities')
const { ensureEditionExists } = require('../fixtures/entities')
const { createWork, createHuman, addAuthor, addSerie, createEdition, createEditionFromWorks, createWorkWithAuthor, humanName, someImageHash } = require('../fixtures/entities');
({ updateClaim } = require('../utils/entities'))

describe('items:snapshot', () => {
  it("should snapshot the item's work series names", done => {
    createWork()
    .then(workEntity => {
      return addSerie(workEntity)
      .then(Wait(100))
      .then(serieEntity => {
        return authReq('post', '/api/items', { entity: workEntity.uri, lang: 'en' })
        .then(item => {
          const title = _.values(serieEntity.labels)[0]
          item.snapshot['entity:series'].should.equal(title)
          done()
        })
      })
    })
    .catch(done)
  })

  it("should snapshot the item's work series ordinal", done => {
    createWork()
    .then(workEntity => {
      return Promise.all([
        authReq('post', '/api/items', { entity: workEntity.uri, lang: 'en' }),
        addSerie(workEntity)
      ])
      .then(Wait(100))
      .then(([ item, serieEntity ]) => {
        return updateClaim(workEntity.uri, 'wdt:P1545', null, '5')
        .then(Wait(100))
        .then(() => getItem(item))
        .then(item => {
          item.snapshot['entity:ordinal'].should.equal('5')
          return updateClaim(workEntity.uri, 'wdt:P1545', '5', '6')
          .then(Wait(100))
          .then(() => getItem(item))
          .then(item => {
            item.snapshot['entity:ordinal'].should.equal('6')
            done()
          })
        })
      })
    })
    .catch(done)
  })

  it('should snapshot data from all the works of a composite edition', done => {
    Promise.all([
      createWork(),
      createWork()
    ])
    .then(([ workA, workB ]) => {
      return Promise.all([
        addAuthor(workA),
        addAuthor(workB)
      ])
      .then(authors => {
        return Promise.all([
          addSerie(workA),
          addSerie(workB)
        ])
        .then(series => {
          return createEditionFromWorks(workA, workB)
          .then(edition => authReq('post', '/api/items', { entity: edition.uri }))
          .then(item => {
            const authorsNames = authors.map(author => author.labels.en).join(', ')
            const seriesNames = series.map(serie => serie.labels.en).join(', ')
            item.snapshot['entity:authors'].should.equal(authorsNames)
            item.snapshot['entity:series'].should.equal(seriesNames)
            done()
          })
        })
      })
    })
    .catch(done)
  })

  it('should snapshot the image of an edition', done => {
    createEdition()
    .then(edition => {
      edition.image.url.should.equal(`/img/entities/${someImageHash}`)
      return authReq('post', '/api/items', { entity: edition.uri })
      .then(item => {
        item.snapshot['entity:image'].should.equal(edition.image.url)
        done()
      })
    })
    .catch(done)
  })

  it('should snapshot the subtitle of an edition', done => {
    createEdition()
    .then(edition => {
      const subtitle = edition.claims['wdt:P1680'][0]
      subtitle.should.a.String()
      return authReq('post', '/api/items', { entity: edition.uri })
      .then(item => {
        item.snapshot['entity:subtitle'].should.equal(subtitle)
        done()
      })
    })
    .catch(done)
  })

  it('should snapshot the image of an edition after a work-related refresh', done => {
    createEdition()
    .then(edition => {
      return authReq('post', '/api/items', { entity: edition.uri })
      .then(item => {
        item.snapshot['entity:image'].should.equal(edition.image.url)
        const workUri = edition.claims['wdt:P629'][0]
        return updateClaim(workUri, 'wdt:P50', null, 'wd:Q535')
        .then(() => getItem(item))
      })
      .then(item => {
        item.snapshot['entity:image'].should.equal(edition.image.url)
        done()
      })
    })
    .catch(done)
  })

  describe('update', () => {
    it('should be updated when its local edition entity title changes', done => {
      createWork()
      .then(createEditionFromWorks)
      .then(res => {
        const { _id: entityId, uri } = res
        return authReq('post', '/api/items', { entity: uri })
        .then(item => {
          const currentTitle = item.snapshot['entity:title']
          const updatedTitle = `${currentTitle.split('$$')[0]}$$${new Date().toISOString()}`

          return updateClaim(entityId, 'wdt:P1476', currentTitle, updatedTitle)
          .then(Wait(100))
          .then(() => getItem(item))
          .then(updatedItem => {
            updatedItem.snapshot['entity:title'].should.equal(updatedTitle)
            done()
          })
        })
      })
      .catch(done)
    })

    it('should be updated when its local work entity title changes', done => {
      createWork()
      .then(res => {
        const { _id: entityId, uri } = res
        return authReq('post', '/api/items', { entity: uri, lang: 'en' })
        .then(item => {
          const currentTitle = item.snapshot['entity:title']
          const updatedTitle = `${currentTitle} ${new Date().toISOString()}`
          return updateLabel(entityId, 'en', updatedTitle)
          .then(Wait(100))
          .then(() => getItem(item))
          .then(updatedItem => {
            updatedItem.snapshot['entity:title'].should.equal(updatedTitle)
            done()
          })
        })
      })
      .catch(done)
    })

    it('should be updated when its local serie entity title changes', done => {
      createWork()
      .then(workEntity => {
        return authReq('post', '/api/items', { entity: workEntity.uri, lang: 'en' })
        .then(Wait(200))
        .then(item => {
          return addSerie(workEntity)
          .then(Wait(200))
          .then(serieEntity => {
            const title = _.values(serieEntity.labels)[0]
            return getItem(item)
            .then(updatedItem => {
              updatedItem.snapshot['entity:series'].should.equal(title)
              const updatedTitle = `${title}-updated`
              return updateLabel(serieEntity._id, 'en', updatedTitle)
              .then(Wait(200))
              .then(() => getItem(item))
              .then(reupdatedItem => {
                reupdatedItem.snapshot['entity:series'].should.equal(updatedTitle)
                done()
              })
            })
          })
        })
      })
      .catch(done)
    })

    it('should be updated when its local author entity title changes (edition entity)', done => {
      ensureEditionExists('isbn:9788389920935', null, {
        labels: {},
        claims: {
          'wdt:P31': [ 'wd:Q3331189' ],
          'wdt:P212': [ '978-83-89920-93-5' ],
          'wdt:P1476': [ 'some title' ]
        }
      })
      .then(editionDoc => {
        const workUri = editionDoc.claims['wdt:P629'][0]
        return getByUris(workUri)
      })
      .then(res => {
        const workEntity = _.values(res.entities)[0]
        const trueAuthorUri = workEntity.claims['wdt:P50'][0]
        return authReq('post', '/api/items', { entity: 'isbn:9788389920935' })
        .then(Wait(200))
        .then(item => {
          const updateAuthorName = humanName()
          return updateLabel(trueAuthorUri, 'en', updateAuthorName)
          .then(Wait(200))
          .then(() => getItem(item))
          .then(updatedItem => {
            updatedItem.snapshot['entity:authors'].should.equal(updateAuthorName)
            done()
          })
        })
      })
      .catch(done)
    })

    it('should be updated when its local author entity title changes (work entity)', done => {
      createWorkWithAuthor()
      .then(workEntity => {
        return authReq('post', '/api/items', { entity: workEntity.uri, lang: 'en' })
        .then(item => {
          const updateAuthorName = humanName()
          const uri = workEntity.claims['wdt:P50'][0]
          return updateLabel(uri, 'en', updateAuthorName)
          .then(Wait(100))
          .then(() => getItem(item))
          .then(item => {
            item.snapshot['entity:authors'].should.equal(updateAuthorName)
            done()
          })
        })
      })
      .catch(done)
    })

    it('should be updated when its local work entity is merged (work entity)', done => {
      Promise.all([
        getUserId(),
        createWork(),
        createWork()
      ])
      .then(([ userId, workEntityA, workEntityB ]) => {
        return authReq('post', '/api/items', { entity: workEntityA.uri, lang: 'en' })
        .tap(() => merge(workEntityA.uri, workEntityB.uri))
        .then(getItem)
        .then(updatedItem => {
          const updatedTitle = workEntityB.labels.en
          updatedItem.snapshot['entity:title'].should.equal(updatedTitle)
          done()
        })
      })
      .catch(done)
    })

    it('should be updated when its local work entity is merged (edition entity)', done => {
      Promise.all([
        getUserId(),
        createWork(),
        createWork()
      ])
      .then(([ userId, workEntityA, workEntityB ]) => {
        return createEditionFromWorks(workEntityA)
        .then(editionEntity => {
          return Promise.all([
            authReq('post', '/api/items', { entity: editionEntity.uri }),
            addAuthor(workEntityB)
          ])
          .then(Wait(200))
          .tap(() => merge(workEntityA.uri, workEntityB.uri))
          .then(Wait(200))
          .then(([ item, addedAuthor ]) => {
            return getItem(item)
            .then(updatedItem => {
              const authorName = _.values(addedAuthor.labels)[0]
              updatedItem.snapshot['entity:authors'].should.equal(authorName)
              done()
            })
          })
        })
      })
      .catch(done)
    })

    it('should be updated when its local author entity is merged', done => {
      Promise.all([
        getUserId(),
        createHuman(),
        createHuman()
      ])
      .then(([ userId, authorEntityA, authorEntityB ]) => {
        return createWorkWithAuthor(authorEntityA)
        .then(workEntity => authReq('post', '/api/items', { entity: workEntity.uri, lang: 'en' }))
        .then(Wait(200))
        .tap(() => merge(authorEntityA.uri, authorEntityB.uri))
        .then(Wait(200))
        .then(getItem)
        .then(updatedItem => {
          const updatedAuthors = authorEntityB.labels.en
          updatedItem.snapshot['entity:authors'].should.equal(updatedAuthors)
          done()
        })
      })
      .catch(done)
    })

    it('should be updated when its local author entity is merged and reverted', done => {
      Promise.all([
        getUserId(),
        createHuman(),
        createHuman()
      ])
      .then(([ userId, authorEntityA, authorEntityB ]) => {
        return createWorkWithAuthor(authorEntityA)
        .then(workEntity => authReq('post', '/api/items', { entity: workEntity.uri, lang: 'en' }))
        .then(Wait(200))
        .tap(() => merge(authorEntityA.uri, authorEntityB.uri))
        .then(Wait(200))
        .then(getItem)
        .then(updatedItem => {
          const updatedAuthors = authorEntityB.labels.en
          updatedItem.snapshot['entity:authors'].should.equal(updatedAuthors)
          return revertMerge(authorEntityA.uri)
          .then(Wait(200))
          .then(() => getItem(updatedItem))
          .then(reupdatedItem => {
            const oldAuthors = authorEntityA.labels.en
            reupdatedItem.snapshot['entity:authors'].should.equal(oldAuthors)
            done()
          })
        })
      })
      .catch(done)
    })

    it('should be updated when its entity changes', done => {
      Promise.all([
        getUserId(),
        createWork()
      ])
      .then(([ userId, workEntityA ]) => {
        return Promise.all([
          createEditionFromWorks(workEntityA),
          authReq('post', '/api/items', { entity: workEntityA.uri, lang: 'en' })
        ])
        .then(Wait(100))
        .then(([ editionEntity, item ]) => {
          return getItem(item)
          .then(item => {
            item.entity = editionEntity.uri
            return authReq('put', '/api/items', item)
          })
          .then(updatedItem => {
            const editionTitle = editionEntity.claims['wdt:P1476'][0]
            updatedItem.snapshot['entity:title'].should.equal(editionTitle)
            done()
          })
        })
      })
      .catch(done)
    })

    it('should be updated when its remote work entity changes', done => {
      // Simulating a change on the Wikidata work by merging an inv work into it
      Promise.all([
        getUserId(),
        createWork()
      ])
      .then(([ userId, workEntity ]) => {
        return createEditionFromWorks(workEntity)
        .then(editionEntity => {
          return authReq('post', '/api/items', { entity: editionEntity.uri })
          .tap(() => merge(workEntity.uri, 'wd:Q3209796'))
          .then(Wait(1000))
          .then(item => {
            return getItem(item)
            .then(updatedItem => {
              updatedItem.snapshot['entity:authors'].should.equal('Alain Damasio')
              done()
            })
          })
        })
      })
      .catch(done)
    })

    it('should be updated when its remote author entity changes', done => {
      // Simulating a change on the Wikidata author by merging an inv author into it
      createWork()
      .then(work => {
        return Promise.all([
          createEdition({ work }),
          addAuthor(work)
        ])
        .then(([ edition, author ]) => {
          return authReq('post', '/api/items', { entity: edition.uri })
          .then(Wait(200))
          .tap(() => merge(author.uri, 'wd:Q2829704'))
          .then(Wait(200))
          .then(item => {
            return getItem(item)
            .then(updatedItem => {
              updatedItem.snapshot['entity:authors'].should.equal('Alain Damasio')
              done()
            })
          })
        })
      })
      .catch(done)
    })
  })
})

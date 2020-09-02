const CONFIG = require('config')
const __ = CONFIG.universalPath
const should = require('should')
const { wait } = __.require('lib', 'promises')
const { customAuthReq, nonAuthReq } = __.require('apiTests', 'utils/utils')
const { createEdition } = require('../fixtures/entities')
const { createUserWithItems } = require('../fixtures/populate')
const { createItem } = require('../fixtures/items')
const { createUser } = require('../fixtures/users')
const { addClaim } = require('../utils/entities')
const editionUriPromise = createEdition().then(({ uri }) => uri)
const userPromise = createUserWithItems()

const endpoint = '/api/items?action=inventory-view'
const dryReq = `${endpoint}&dry=true`

const refreshUserPublicCache = userId => { return nonAuthReq('get', `${endpoint}&user=${userId}`) }
const getUserPublicCache = userId => { return nonAuthReq('get', `${dryReq}&user=${userId}`) }

describe('inventory-view:cache', () => {
  it('should add an item uri to cache on item creation', async () => {
    const { _id: userId } = await userPromise
    const { itemsByDate: oldItemsByDate } = await refreshUserPublicCache(userId)
    const editionUri = await editionUriPromise

    await createItem(userPromise, { entity: editionUri, listing: 'public' })
    await wait(100)
    const { itemsByDate: refreshedItemsByDate } = await getUserPublicCache(userId)
    refreshedItemsByDate.length.should.equal(oldItemsByDate.length + 1)
  })

  it('should refresh on private item creation', async () => {
    const { _id: userId } = await userPromise
    const { itemsByDate: oldItemsByDate } = await refreshUserPublicCache(userId)
    const editionUri = await editionUriPromise

    await createItem(userPromise, { entity: editionUri, listing: 'private' })
    await wait(100)
    const { itemsByDate: ownerViewFreshItems } = await customAuthReq(userPromise, 'get', `${dryReq}&user=${userId}`)
    ownerViewFreshItems.length.should.equal(oldItemsByDate.length + 1)
  })

  it('should refresh on private to public item update', async () => {
    const userPromise = createUser()
    const { _id: userId } = await userPromise
    const item = await createItem(userPromise, { listing: 'private' })
    const { itemsByDate: privateItemsByDate } = await customAuthReq(userPromise, 'get', `${endpoint}&user=${userId}`)
    const { itemsByDate: publicItemsByDate } = await refreshUserPublicCache(userId)
    publicItemsByDate.length.should.equal(privateItemsByDate.length - 1)

    item.listing = 'public'
    await customAuthReq(userPromise, 'put', '/api/items', item)
    await wait(100)
    const { itemsByDate: refreshedPublicItemsByDate } = await getUserPublicCache(userId)
    refreshedPublicItemsByDate.length.should.equal(privateItemsByDate.length)
  })

  it('should refresh on item deletion', async () => {
    const { _id: userId } = await userPromise
    const editionUri = await editionUriPromise
    const { _id: itemId } = await createItem(userPromise, { entity: editionUri, listing: 'public' })
    await customAuthReq(userPromise, 'post', '/api/items?action=delete-by-ids', { ids: [ itemId ] })

    const { itemsByDate: refreshedItemsByDate } = await getUserPublicCache(userId)
    refreshedItemsByDate.should.not.containEql(itemId)
  })

  it('should refresh on updating work claims', async () => {
    const { _id: userId } = await userPromise
    const edition = await createEdition()
    const workUri = await edition.claims['wdt:P629'][0]
    await createItem(userPromise, { entity: edition.uri, listing: 'public' })
    const res = await refreshUserPublicCache(userId)
    const subjectValue = 'wd:Q35760'
    should(res.worksTree.subject[subjectValue]).not.be.ok()

    await addClaim(workUri, 'wdt:P921', subjectValue)
    await wait(200)
    const res2 = await getUserPublicCache(userId)
    res2.worksTree.subject[subjectValue].should.be.an.Array()
  })

  it('should refresh on updating edition claims', async () => {
    const { _id: userId } = await userPromise
    const edition = await createEdition()
    await createItem(userPromise, { entity: edition.uri, listing: 'public' })
    const res = await refreshUserPublicCache(userId)
    const workValue = 'wd:Q6911'
    should(res.worksTree.subject[workValue]).not.be.ok()

    await addClaim(edition.uri, 'wdt:P629', workValue)
    await wait(200)
    const res2 = await getUserPublicCache(userId)
    res2.worksTree.subject.unknown.should.containEql(workValue)
  })
})

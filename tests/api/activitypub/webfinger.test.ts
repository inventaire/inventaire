import 'should'
import { find } from 'lodash-es'
import { getEntityActorName } from '#controllers/activitypub/lib/helpers'
import { createHuman } from '#fixtures/entities'
import { createShelf } from '#fixtures/shelves'
import { createUser, createUsername } from '#fixtures/users'
import { wait } from '#lib/promises'
import config from '#server/config'
import { getActorName } from '#tests/api/utils/shelves'
import { updateUser } from '#tests/api/utils/users'
import { publicReq } from '#tests/api/utils/utils'
import { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } from '#tests/unit/utils/utils'

const publicOrigin = config.getPublicOrigin()
const publicHost = publicOrigin.split('://')[1]

const endpoint = '/.well-known/webfinger?resource='

describe('activitypub:webfinger', () => {
  it('should reject invalid resource', async () => {
    try {
      const endpoint = '/.well-known/webfinger?rezzzzzz='
      const invalidResource = 'bar.org'
      invalidResource.should.not.equal(config.hostname)
      const actor = `acct:foo@${invalidResource}`
      await publicReq('get', `${endpoint}${actor}`).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('missing parameter')
    }
  })

  it('should reject invalid host', async () => {
    try {
      const invalidResource = 'bar.org'
      invalidResource.should.not.equal(config.hostname)
      const actor = `acct:foo@${invalidResource}`
      await publicReq('get', `${endpoint}${actor}`).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid resource')
    }
  })

  it('should reject an invalid resource scheme', async () => {
    try {
      const actor = `bcct:foo@${publicHost}`
      await publicReq('get', `${endpoint}${actor}`).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid resource')
    }
  })

  it('should reject invalid actor', async () => {
    try {
      const invalidActorResource = 'acct:foobar.org'
      await publicReq('get', `${endpoint}${invalidActorResource}`).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid resource')
    }
  })

  it('should reject unknown actor', async () => {
    try {
      const unknownLocalActorResource = `acct:${createUsername()}@${publicHost}`
      await publicReq('get', `${endpoint}${unknownLocalActorResource}`).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(404)
      err.body.status_verbose.should.equal('not found')
    }
  })

  describe('users', () => {
    it('should reject if user is not on the fediverse', async () => {
      try {
        const username = createUsername()
        await createUser({ username })
        const resource = `acct:${username}@${publicHost}`
        await publicReq('get', `${endpoint}${resource}`).then(shouldNotBeCalled)
      } catch (err) {
        rethrowShouldNotBeCalledErrors(err)
        err.statusCode.should.equal(404)
      }
    })

    it('should return an activitypub compliant webfinger', async () => {
      const username = createUsername()
      await createUser({ username, fediversable: true })
      const resource = `acct:${username}@${publicHost}`
      const res = await publicReq('get', `${endpoint}${resource}`)
      const { subject, aliases, links } = res
      subject.should.equal(resource)
      const actorUrl = `${publicOrigin}/api/activitypub?action=actor&name=${username}`
      aliases[0].should.equal(actorUrl)
      aliases.should.matchAny(actorUrl)
      const firstLink = find(links, { rel: 'self' })
      firstLink.should.be.an.Object()
      firstLink.type.should.equal('application/activity+json')
      firstLink.href.should.equal(actorUrl)
    })

    it('should ignore case', async () => {
      const username = createUsername().toLowerCase()
      const user = await createUser({ fediversable: true, username })
      user.stableUsername.should.equal(username)
      const resource = `acct:${username.toUpperCase()}@${publicHost}`
      const res = await publicReq('get', `${endpoint}${resource}`)
      res.subject.should.equal(`acct:${username}@${publicHost}`)
    })

    it('should find a user after a username change', async () => {
      const initialUsername = createUsername()
      const user = await createUser({ fediversable: true, username: initialUsername })
      user.stableUsername.should.equal(initialUsername)
      const newUsername = createUsername()
      await updateUser({ user, attribute: 'username', value: newUsername })
      await wait(500)
      const resource = `acct:${initialUsername}@${publicHost}`
      const res1 = await publicReq('get', `${endpoint}${resource}`)
      res1.subject.should.equal(resource)
      const resourceAlias = `acct:${newUsername}@${publicHost}`
      const res2 = await publicReq('get', `${endpoint}${resourceAlias}`)
      res2.subject.should.equal(resource)
    })
  })

  describe('entities', () => {
    it('should return an activitypub compliant webfinger', async () => {
      const { uri } = await createHuman()
      const actorName = getEntityActorName(uri)
      const resource = `acct:${actorName}@${publicHost}`
      const res = await publicReq('get', `${endpoint}${resource}`)
      const { subject, aliases, links } = res
      subject.should.equal(resource)
      const actorUrl = `${publicOrigin}/api/activitypub?action=actor&name=${actorName}`
      aliases[0].should.equal(actorUrl)
      aliases.should.matchAny(actorUrl)
      const firstLink = find(links, { rel: 'self' })
      firstLink.href.should.equal(actorUrl)
    })
  })

  describe('shelves', () => {
    it('should reject if user is not on the fediverse', async () => {
      try {
        const user = createUser({ fediversable: false })
        const { shelf } = await createShelf(user)
        const name = getActorName(shelf)
        const resource = `acct:${name}@${publicHost}`
        await publicReq('get', `${endpoint}${resource}`).then(shouldNotBeCalled)
      } catch (err) {
        rethrowShouldNotBeCalledErrors(err)
        err.statusCode.should.equal(404)
        err.body.status_verbose.should.equal("shelf's owner is not on the fediverse")
      }
    })

    it('should return an activitypub compliant webfinger', async () => {
      const user = createUser({ fediversable: true })
      const { shelf } = await createShelf(user)
      const name = getActorName(shelf)
      const resource = `acct:${name}@${publicHost}`
      const res = await publicReq('get', `${endpoint}${resource}`)
      const { subject, aliases, links } = res
      subject.should.equal(resource)
      const actorUrl = `${publicOrigin}/api/activitypub?action=actor&name=${name}`
      decodeURIComponent(aliases[0]).should.equal(actorUrl)
      const firstLink = find(links, { rel: 'self' })
      decodeURIComponent(firstLink.href).should.equal(actorUrl)
    })
  })

  describe('actor URL as resource', () => {
    it('should accept an actor URL as resource', async () => {
      const username = createUsername()
      await createUser({ username, fediversable: true })
      const actorUrl = `${publicOrigin}/api/activitypub?action=actor&name=${username}`
      const res = await publicReq('get', `${endpoint}${encodeURIComponent(actorUrl)}`)
      const { subject } = res
      subject.should.equal(`acct:${username}@${publicHost}`)
    })
  })
})

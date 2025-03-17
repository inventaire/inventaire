import fetch from 'node-fetch'
import should from 'should'
import { authorizedCouchdbHeaders as headers } from '#db/couchdb/init/credentials'
import { initCouchDbs } from '#db/couchdb/init/init_couch_dbs'
import { getStringifiedDesignDoc } from '#db/couchdb/init/sync_design_docs'
import config from '#server/config'
import { someDesignDocView } from '#tests/integration/couchdb/fixtures'

const couchdbOrigin = config.db.getOrigin()
const dbName = 'couch-init-tests'
const someDesignDocName = 'some-design-doc'
const dbUrl = `${couchdbOrigin}/${dbName}`

const dbsList = [
  {
    name: dbName,
    designDocs: {
      [someDesignDocName]: someDesignDocView,
    },
  },
]

const stringifiedDesignDoc = getStringifiedDesignDoc(someDesignDocName, someDesignDocView)

const db = {
  info: async () => await fetch(dbUrl, { headers }).then(res => res.json()),
  get: async id => await fetch(`${dbUrl}/${id}`, { headers }).then(res => res.json()),
  put: async (id, body) => {
    return fetch(`${dbUrl}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers,
    })
  },
  delete: async () => {
    const res = await fetch(dbUrl, { method: 'DELETE', headers })
    if (res.status >= 400 && res.status !== 404) {
      throw new Error(`${res.status}: ${res.statusText}`)
    }
  },
}

describe('initCouchDbs', () => {
  beforeEach(async () => {
    await db.delete()
  })

  it('should create a missing database', async () => {
    const { ok } = await initCouchDbs(dbsList)
    ok.should.be.true()
    const info = await db.info()
    // Check that we have our 1 design docs
    info.doc_count.should.equal(1)
  })

  it('should return operations summary', async () => {
    const { operations } = await initCouchDbs(dbsList)
    operations.should.be.an.Object()
    const dbOps = operations[dbName]
    dbOps.should.deepEqual({
      created: true,
      designDocs: { [someDesignDocName]: { created: true } },
    })
  })

  it('should create security documents (if not already set)', async () => {
    await initCouchDbs(dbsList)
    const securityDoc = await fetch(`${dbUrl}/_security`, { headers }).then(res => res.json())
    securityDoc.should.deepEqual({
      admins: { roles: [ '_admin' ] },
      members: { roles: [ '_admin' ] },
    })
  })

  it('should create a secured database', async () => {
    await initCouchDbs(dbsList)
    const res = await fetch(dbUrl)
    res.status.should.equal(401)
  })

  it('should create missing design docs', async () => {
    await initCouchDbs(dbsList)
    const designDoc = await fetch(`${dbUrl}/_design/${someDesignDocName}`, { headers }).then(res => res.json())
    designDoc._rev.split('-')[0].should.equal('1')
    delete designDoc._rev
    designDoc.should.deepEqual(JSON.parse(stringifiedDesignDoc))
  })

  it('should update an existing design docs', async () => {
    await initCouchDbs(dbsList)
    const designDoc = await fetch(`${dbUrl}/_design/${someDesignDocName}`, { headers }).then(res => res.json())
    delete designDoc.views.byExample2
    await db.put(`_design/${someDesignDocName}`, designDoc)
    const updatedDesignDoc = await db.get(`_design/${someDesignDocName}`)
    updatedDesignDoc._rev.split('-')[0].should.equal('2')
    should(updatedDesignDoc.views.byExample2).not.be.ok()
    const { operations } = await initCouchDbs(dbsList)
    const dbOps = operations[dbName]
    dbOps.should.deepEqual({
      created: false,
      designDocs: { [someDesignDocName]: { updated: true } },
    })
    const reupdatedDesignDoc = await db.get(`_design/${someDesignDocName}`)
    reupdatedDesignDoc._rev.split('-')[0].should.equal('3')
    reupdatedDesignDoc.views.byExample2.map.should.be.a.String()
  })
})

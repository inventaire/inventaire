import should from 'should'
import {
  createHuman,
  createWorkWithAuthor,
} from '#fixtures/entities'
import { getByUri, deleteByUris } from '#tests/api/utils/entities'
import { authReq } from '#tests/api/utils/utils'
import type { SerializedInvEntity } from '#types/entity'

describe('entities:recover', () => {
  it('should recover a deleted entity', async () => {
    const { uri } = await createHuman()
    await deleteByUris([ uri ])
    const entity = await getByUri(uri) as SerializedInvEntity
    should(entity._meta_type).equal('removed:placeholder')
    await authReq('post', '/api/entities?action=recover', { uris: [ uri ] })
    const updatedEntity = await getByUri(uri) as SerializedInvEntity
    should(updatedEntity._meta_type).not.equal('removed:placeholder')
  })

  it('should recover claims where the entity is the value', async () => {
    const work = await createWorkWithAuthor()
    const authorUri = work.claims['wdt:P50'][0]
    await deleteByUris([ authorUri ])
    const updatedWork = await getByUri(work.uri)
    should(updatedWork.claims['wdt:P50']).not.be.ok()
    await authReq('post', '/api/entities?action=recover', { uris: [ authorUri ] })
    const reupdatedWork = await getByUri(work.uri) as SerializedInvEntity
    reupdatedWork.claims['wdt:P50'].should.deepEqual([ authorUri ])
  })
})

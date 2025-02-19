import should from 'should'
import { createEdition } from '#fixtures/entities'
import { federatedMode } from '#server/config'
import { merge, getByUri, revertMerge } from '#tests/api/utils/entities'
import { getItem } from '#tests/api/utils/items'
import { authReq } from '#tests/api/utils/utils'

describe('items:entity changes', () => {
  describe('entity merge', () => {
    it('should trigger the update of an item entity', async () => {
      const [ { uri: uriA }, { uri: uriB } ] = await Promise.all([
        createEdition(),
        createEdition(),
      ])
      const item = await authReq('post', '/api/items', { entity: uriA })
      item.entity.should.equal(uriA)
      await merge(uriA, uriB)
      // Trigger an entity revision cache refresh
      if (federatedMode) await getByUri(uriA)
      const updatedItem = await getItem(item)
      updatedItem.entity.should.equal(uriB)
    })
  })

  describe('entity merge revert', () => {
    it('should trigger the revert of an item entity', async () => {
      const [ { uri: uriA }, { uri: uriB } ] = await Promise.all([
        createEdition(),
        createEdition(),
      ])
      const item = await authReq('post', '/api/items', { entity: uriA })
      item.entity.should.equal(uriA)
      await merge(uriA, uriB)
      // Trigger an entity revision cache refresh
      if (federatedMode) await getByUri(uriA)
      const updatedItem = await getItem(item)
      updatedItem.entity.should.equal(uriB)
      await revertMerge(uriA, uriB)
      const reupdatedItem = await getItem(item)
      reupdatedItem.entity.should.equal(uriA)
    })

    it('should trigger the revert of an item entity several times redirected (first merge)', async () => {
      const [ { uri: uriA }, { uri: uriB }, { uri: uriC } ] = await Promise.all([
        createEdition(),
        createEdition(),
        createEdition(),
      ])
      const item = await authReq('post', '/api/items', { entity: uriA })
      item.entity.should.equal(uriA)
      await merge(uriA, uriB)
      // Trigger an entity revision cache refresh
      if (federatedMode) await getByUri(uriA)

      await merge(uriB, uriC)
      if (federatedMode) await getByUri(uriB)

      const updatedItem = await getItem(item)
      updatedItem.entity.should.equal(uriC)

      await revertMerge(uriA, uriB)
      const reupdatedItem = await getItem(item)
      reupdatedItem.entity.should.equal(uriA)
      should(reupdatedItem.previousEntity).not.be.ok()
    })

    it('should trigger the revert of an item entity several times redirected (intermediary merge)', async () => {
      const [ { uri: uriA }, { uri: uriB }, { uri: uriC } ] = await Promise.all([
        createEdition(),
        createEdition(),
        createEdition(),
      ])
      const item = await authReq('post', '/api/items', { entity: uriA })
      item.entity.should.equal(uriA)
      await merge(uriA, uriB)
      // Trigger an entity revision cache refresh
      if (federatedMode) await getByUri(uriA)

      await merge(uriB, uriC)
      if (federatedMode) await getByUri(uriB)

      const updatedItem = await getItem(item)
      updatedItem.entity.should.equal(uriC)

      await revertMerge(uriB, uriC)
      const reupdatedItem = await getItem(item)
      reupdatedItem.entity.should.equal(uriB)
      reupdatedItem.previousEntity.should.deepEqual([ uriA ])
    })
  })
})

import should from 'should'
import { createWork } from '#fixtures/entities'
import { createElement } from '#fixtures/listings'
import { federatedMode } from '#server/config'
import { getByUri, merge, revertMerge } from '#tests/api/utils/entities'
import { getListingElementById } from '#tests/api/utils/listings'

describe('listings:entity changes', () => {
  it('should update element uri after merging entities', async () => {
    const work = await createWork()
    const { element, uri } = await createElement({})
    await merge(uri, work.uri)
    // Trigger the merge propagation
    if (federatedMode) await getByUri(uri)
    const { element: updatedElement } = await getListingElementById({ id: element._id })
    updatedElement.uri.should.equal(work.uri)
  })

  it('should revert element uri after an entity merge was reverted', async () => {
    const work = await createWork()
    const { element, uri } = await createElement({})
    await merge(uri, work.uri)
    // Trigger the merge propagation and subscribe to the revert merge event
    if (federatedMode) await getByUri(uri)
    await revertMerge(uri)
    const { element: updatedElement } = await getListingElementById({ id: element._id })
    updatedElement.uri.should.equal(uri)
  })

  it('should trigger the revert of an element uri several times redirected (first merge)', async () => {
    const { element, uri } = await createElement({})
    const [ workB, workC ] = await Promise.all([ createWork(), createWork() ])
    await merge(uri, workB.uri)
    // Trigger the merge propagation and subscribe to the revert merge event
    if (federatedMode) await getByUri(uri)
    await merge(workB.uri, workC.uri)
    if (federatedMode) await getByUri(workB.uri)
    const { element: updatedElement } = await getListingElementById({ id: element._id })
    updatedElement.uri.should.equal(workC.uri)
    await revertMerge(uri)
    const { element: reupdatedElement } = await getListingElementById({ id: element._id })
    reupdatedElement.uri.should.equal(uri)
    should(reupdatedElement.previousUris).not.be.ok()
  })

  it('should trigger the revert of an element uri several times redirected (intermediary merge)', async () => {
    const { element, uri } = await createElement({})
    const [ workB, workC ] = await Promise.all([ createWork(), createWork() ])
    await merge(uri, workB.uri)
    // Trigger the merge propagation and subscribe to the revert merge event
    if (federatedMode) await getByUri(uri)
    await merge(workB.uri, workC.uri)
    if (federatedMode) await getByUri(workB.uri)
    const { element: updatedElement } = await getListingElementById({ id: element._id })
    updatedElement.uri.should.equal(workC.uri)
    await revertMerge(workB.uri)
    const { element: reupdatedElement } = await getListingElementById({ id: element._id })
    reupdatedElement.uri.should.equal(workB.uri)
    reupdatedElement.previousUris.should.deepEqual([ uri ])
  })
})

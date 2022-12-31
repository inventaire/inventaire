import 'should'
import { wait } from 'lib/promises'
import { getByUris, updateClaim } from '../utils/entities'
import { createWork, createEditionFromWorks } from '../fixtures/entities'

describe('entities:update-claims-hooks', () => {
  it('should update a work label from an edition title update if in sync', async () => {
    const work = await createWork()
    const edition = await createEditionFromWorks(work)
    const value = edition.claims['wdt:P1476'][0]
    const updatedValue = `${value}updated`
    const { uri } = edition
    await updateClaim({ uri, property: 'wdt:P1476', oldValue: value, newValue: updatedValue })
    await wait(100)
    const res = await getByUris(work.uri)
    const refreshedWork = res.entities[work.uri]
    refreshedWork.labels.en.should.equal(updatedValue)
  })

  it('should not update a work label if editions disagree on the title', async () => {
    const work = await createWork()
    const [ editionA ] = await Promise.all([
      createEditionFromWorks(work),
      createEditionFromWorks(work)
    ])
    const valueA = editionA.claims['wdt:P1476'][0]
    const updatedValueA = `${valueA}updated`
    const { uri } = editionA
    await updateClaim({ uri, property: 'wdt:P1476', oldValue: valueA, newValue: updatedValueA })
    await wait(100)
    const res = await getByUris(work.uri)
    const refreshedWork = res.entities[work.uri]
    refreshedWork.labels.en.should.equal(work.labels.en)
  })
})

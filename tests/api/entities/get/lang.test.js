import { buildUrl } from '#lib/utils/url'
import {
  createHuman,
} from '#tests/api/fixtures/entities'
import { publicReq } from '#tests/api/utils/utils'

describe('entities:get:by-uris:lang', () => {
  it('should return only the requested lang (with attributes)', async () => {
    const wdHumanUri = 'wd:Q2300248'
    const { uri: invHumanUri } = await createHuman({ labels: { es: 'foo', fr: 'bar' } })
    const url = buildUrl('/api/entities', {
      action: 'by-uris',
      uris: `${invHumanUri}|${wdHumanUri}`,
      attributes: 'labels',
      lang: 'es',
    })
    const { entities } = await publicReq('get', url)
    Object.keys(entities[invHumanUri].labels).should.deepEqual([ 'es' ])
    entities[invHumanUri].labels.es.should.equal('foo')
    Object.keys(entities[wdHumanUri].labels).should.deepEqual([ 'es' ])
  })

  it('should return only the requested lang (without attributes)', async () => {
    const wdHumanUri = 'wd:Q2300248'
    const { uri: invHumanUri } = await createHuman({ labels: { es: 'foo', fr: 'bar' } })
    const url = buildUrl('/api/entities', {
      action: 'by-uris',
      uris: `${invHumanUri}|${wdHumanUri}`,
      lang: 'es',
    })
    const { entities } = await publicReq('get', url)
    Object.keys(entities[invHumanUri].labels).should.deepEqual([ 'es' ])
    entities[invHumanUri].labels.es.should.equal('foo')
    Object.keys(entities[wdHumanUri].labels).should.deepEqual([ 'es' ])
  })

  it('should fallback on what is available', async () => {
    const { uri: invHumanUri } = await createHuman({ labels: { es: 'foo' } })
    const url = buildUrl('/api/entities', {
      action: 'by-uris',
      uris: `${invHumanUri}`,
      attributes: 'labels',
      lang: 'fr',
    })
    const { entities } = await publicReq('get', url)
    Object.keys(entities[invHumanUri].labels).should.deepEqual([ 'es' ])
    entities[invHumanUri].labels.es.should.equal('foo')
  })
})

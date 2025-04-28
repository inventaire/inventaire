import 'should'
import { buildUrl } from '#lib/utils/url'
import { publicReq } from '#tests/api/utils/utils'

describe('entities:languages', () => {
  it('should get language entity labels by wikimedia language code', async () => {
    const url = buildUrl('/api/entities', { action: 'languages', langs: 'ca|it|zh-hans', lang: 'fr' })
    const { languages } = await publicReq('get', url)
    languages.ca.should.deepEqual({ uri: 'wd:Q7026', label: { value: 'catalan', lang: 'fr' } })
    languages.it.should.deepEqual({ uri: 'wd:Q652', label: { value: 'italien', lang: 'fr' } })
    languages['zh-hans'].should.deepEqual({ uri: 'wd:Q13414913', label: { value: 'chinois simplifié', lang: 'fr' } })
  })
})

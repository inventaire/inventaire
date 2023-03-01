import 'should'
import { publicReq } from '#tests/api/utils/utils'

const endpoint = '/api/entities?action=languages'

// The following tests require to have language entities indexed locally.
// This can be done by running `npm run indexation:wikidata:load-languages-from-query`
describe('entities:languages:search', () => {
  it('should find a language by its label in the requested language', async () => {
    const res = await publicReq('get', `${endpoint}&search=Korsische&lang=de`)
    res.languages.should.be.an.Array()
    const language = res.languages[0]
    language.uri.should.equal('wd:Q33111')
  })

  it('should find a language by its label in another language', async () => {
    const res = await publicReq('get', `${endpoint}&search=Korsische&lang=fr`)
    res.languages.should.be.an.Array()
    const language = res.languages[0]
    language.uri.should.equal('wd:Q33111')
  })

  it('should find a language by its language code', async () => {
    const res = await publicReq('get', `${endpoint}&search=nb`)
    res.languages.should.be.an.Array()
    const language = res.languages[0]
    language.uri.should.equal('wd:Q25167')
  })

  it('should ignore the code case', async () => {
    const res = await publicReq('get', `${endpoint}&search=Nb`)
    res.languages.should.be.an.Array()
    const language = res.languages[0]
    language.uri.should.equal('wd:Q25167')
  })

  it('should find a language by its wikidata entity id', async () => {
    const res = await publicReq('get', `${endpoint}&search=Q10134`)
    res.languages.should.be.an.Array()
    const language = res.languages[0]
    language.uri.should.equal('wd:Q10134')
  })

  it('should find a language by its wikidata entity uri', async () => {
    const res = await publicReq('get', `${endpoint}&search=wd:Q10134`)
    res.languages.should.be.an.Array()
    const language = res.languages[0]
    language.uri.should.equal('wd:Q10134')
  })
})

import { wait } from 'lib/promises'
import 'should'
import automergeAuthorWorks from 'controllers/tasks/lib/automerge_author_works'
import { checkEntities } from '../utils/tasks'
import { getByUris, findOrIndexEntities } from '../utils/entities'
import { createHuman, createWorkWithAuthor, addSerie } from '../fixtures/entities'

describe('automerge_author_works: only from inv works to wd works', () => {
  before(async () => {
    // Tests dependency: having a populated ElasticSearch wikidata index
    const wikidataUris = [ 'wd:Q205739', 'wd:Q1748845', 'wd:Q172140', 'wd:Q732060' ]
    await findOrIndexEntities(wikidataUris)
  })

  it('should automerge inv works to a wd work', async () => {
    const authorUri = 'wd:Q205739' // Alan Moore uri
    const workLabel = 'Voice of the Fire'
    const workWdUri = 'wd:Q3825051' // 'Voice of the Fire' uri

    const [ work1, work2 ] = await Promise.all([
      createWorkWithAuthor({ uri: authorUri }, workLabel),
      createWorkWithAuthor({ uri: authorUri }, workLabel)
    ])
    await automergeAuthorWorks(authorUri)
    await wait(300)
    const { redirects } = await getByUris([ work1.uri, work2.uri ])
    redirects[work1.uri].should.equal(workWdUri)
    redirects[work2.uri].should.equal(workWdUri)
  })

  it('should automerge if suspect and suggestion wd and inv short works labels match', async () => {
    const humanLabel = 'Michael Crichton'
    const workLabel = 'Timeline' // wd:Q732060
    const workWdUri = 'wd:Q732060'
    const human = await createHuman({ labels: { en: humanLabel } })
    const work = await createWorkWithAuthor({ uri: human.uri }, workLabel)
    const tasks = await checkEntities(human.uri)
    tasks.length.should.equal(0)
    const { redirects } = await getByUris(work.uri)
    redirects[work.uri].should.equal(workWdUri)
  })

  it('should not automerge if authors works do not match', async () => {
    // Alan Moore uri
    const authorUri = 'wd:Q205739'
    // Corresponding to wd:Q3825051 label
    const workLabel = 'Voice of the Fire'

    const invWork = await createWorkWithAuthor({ uri: authorUri }, `${workLabel} Vol. 1`)
    await automergeAuthorWorks(authorUri)
    await wait(300)
    const { entities } = await getByUris(invWork.uri)
    entities[invWork.uri].should.be.ok()
  })

  it('should not automerge work if suggestion is a serie or part of a serie', async () => {
    // Alan Moore uri
    const authorUri = 'wd:Q205739'
    // Corresponding to wd:Q3825051 label
    const workLabel = 'Voice of the Fire'

    const invWork = await createWorkWithAuthor({ uri: authorUri }, workLabel)
    await addSerie(invWork)
    await wait(300)
    await automergeAuthorWorks(authorUri)
    await wait(300)
    const { entities } = await getByUris(invWork.uri)
    entities[invWork.uri].should.be.ok()
  })
})

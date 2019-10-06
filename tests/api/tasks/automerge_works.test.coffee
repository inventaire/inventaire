CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
should = require 'should'

automergeWorks = __.require 'controllers', 'tasks/lib/automerge_works'
{ undesiredErr } = require '../utils/utils'
{ checkEntities } = require '../utils/tasks'
{ getByUris } = require '../utils/entities'
{ createHuman, createWorkWithAuthor, createWorkWithAuthorAndSerie, randomLabel, addSerie } = require '../fixtures/entities'

describe 'automerge_works', ->
  it 'should automerge inv works to a wd work', (done)->
    # Alan Moore uri
    authorUri = 'wd:Q205739'
    workLabel = 'Voice of the Fire'
    wdWorkUri = 'wd:Q3825051' # 'Voice of the Fire' uri

    Promise.all [
      createWorkWithAuthor { uri: authorUri }, workLabel
      createWorkWithAuthor { uri: authorUri }, workLabel
    ]
    .spread (work1, work2)->
      automergeWorks authorUri
      .delay 300
      .then ->
        Promise.all [
          getByUris(work1.uri)
          getByUris(work2.uri)
        ]
        .spread (work1, work2)->
          # entity should have merged, thus URI is now a WD uri
          _.values(work1.redirects)[0].should.equal wdWorkUri
          _.values(work2.redirects)[0].should.equal wdWorkUri

          done()
    .catch undesiredErr(done)

    return

  it 'should automerge inv works if authors works match exactly', (done)->
    workLabel = randomLabel()

    createHuman { labels: { en: randomLabel() } }
    .then (human)->
      Promise.all [
        createWorkWithAuthor human, workLabel
        createWorkWithAuthor human, workLabel
      ]
      .spread (work1, work2)->
        automergeWorks human.uri
        .delay 300
        .then ->
          Promise.all [
            getByUris(work1.uri).get('redirects')
            getByUris(work2.uri).get('redirects')
          ]
          .then (redirects)->
            redirectCount = redirects.map((redirect)-> Object.keys(redirect))
            _.flatten(redirectCount).length.should.equal 1
            done()
    .catch undesiredErr(done)

    return

  it 'should not automerge if authors works do not match', (done)->
    workLabel = randomLabel()
    workLabel2 = "#{workLabel} Vol. 1"

    createHuman { labels: { en: randomLabel() } }
    .then (human)->
      Promise.all [
        createWorkWithAuthor human, workLabel
        createWorkWithAuthor human, workLabel2
      ]
      .spread (work1, work2)->
        automergeWorks human.uri
        .delay 300
        .then ->
          Promise.all [
            getByUris(work1.uri).get('entities')
            getByUris(work2.uri).get('entities')
          ]
          .spread (res1, res2)->
            res1[work1.uri].should.be.ok()
            res2[work2.uri].should.be.ok()

            done()
    .catch undesiredErr(done)

    return

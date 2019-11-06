CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
should = require 'should'

automergeAuthorWorks = __.require 'controllers', 'tasks/lib/automerge_author_works'
{ undesiredErr } = require '../utils/utils'
{ checkEntities } = require '../utils/tasks'
{ getByUris } = require '../utils/entities'
{ createHuman, createWorkWithAuthor, createWorkWithAuthorAndSerie, randomLabel, addSerie } = require '../fixtures/entities'

describe 'automerge_author_works: only from inv works to wd works', ->
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
      automergeAuthorWorks authorUri
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

  it 'should not automerge if authors works do not match', (done)->
    # Alan Moore uri
    authorUri = 'wd:Q205739'
    # Corresponding to wd:Q3825051 label
    workLabel = 'Voice of the Fire'

    createWorkWithAuthor { uri: authorUri }, "#{workLabel} Vol. 1"
    .then (invWork)->
      automergeAuthorWorks authorUri
      .delay 300
      .then -> getByUris invWork.uri
      .then (res)->
        res.entities[invWork.uri].should.be.ok()
        done()
    .catch undesiredErr(done)

    return

  it 'should not automerge work if suggestion is a serie or part of a serie', (done)->
    # Alan Moore uri
    authorUri = 'wd:Q205739'
    # Corresponding to wd:Q3825051 label
    workLabel = 'Voice of the Fire'

    createWorkWithAuthor { uri: authorUri }, workLabel
    .tap (invWork)-> addSerie invWork
    .delay 300
    .then (invWork)->
      automergeAuthorWorks authorUri
      .delay 300
      .then -> getByUris invWork.uri
      .then (res)->
        res.entities[invWork.uri].should.be.ok()
        done()
    .catch undesiredErr(done)

    return

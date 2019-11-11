// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const should = require('should')
const Task = __.require('models', 'task')

const validDoc = () => ({
  type: 'deduplicate',
  suspectUri: 'inv:035a93cc360f4e285e955bc1230415c4',
  suggestionUri: 'wd:Q42',
  state: 'requested',
  lexicalScore: 4.2,
  relationScore: 1,
  externalSourcesOccurrences: []
})

describe('task model', () => {
  describe('create', () => {
    it('should return an object with type', (done) => {
      const taskDoc = Task.create(validDoc())
      taskDoc.should.be.an.Object()
      taskDoc.type.should.equal('deduplicate')
      done()
    })

    it('should return suspectUri and a suggestionUri', (done) => {
      const taskDoc = Task.create(validDoc())
      taskDoc.suspectUri.should.equal(validDoc().suspectUri)
      taskDoc.suggestionUri.should.equal(validDoc().suggestionUri)
      _.expired(taskDoc.created, 100).should.be.false()
      done()
    })

    it('should throw if no suspect', (done) => {
      const invalidDoc = {
        type: 'deduplicate',
        suggestionUri: 'wd:Q42'
      }
      const taskDoc = () => Task.create(invalidDoc)
      taskDoc.should.throw()
      done()
    })

    it('should throw if empty suspect', (done) => {
      const invalidDoc = {
        type: 'deduplicate',
        suspectId: '',
        suggestionUri: 'wd:Q42'
      }
      const taskDoc = () => Task.create(invalidDoc)
      try { taskDoc() }
      catch (err) { err.message.should.startWith('invalid suspect') }
      taskDoc.should.throw()
      done()
    })

    it('should throw if no lexicalScore', (done) => {
      const invalidDoc = validDoc()
      delete invalidDoc.lexicalScore
      const taskDoc = () => Task.create(invalidDoc)
      try { taskDoc() }
      catch (err) { err.message.should.startWith('invalid lexicalScore') }
      taskDoc.should.throw()
      done()
    })

    it('should throw if no externalSourcesOccurrences', (done) => {
      const invalidDoc = validDoc()
      delete invalidDoc.externalSourcesOccurrences
      const taskDoc = () => Task.create(invalidDoc)
      try { taskDoc() }
      catch (err) { err.message.should.startWith('invalid externalSourcesOccurrences') }
      taskDoc.should.throw()
      done()
    })
  })

  describe('update', () => {
    it('should update a valid task with an dismissed state', (done) => {
      const taskDoc = Task.update(validDoc(), 'state', 'dismissed')
      taskDoc.state.should.equal('dismissed')
      done()
    })

    it('should throw if invalid attribute to update', (done) => {
      const taskDoc = () => Task.update(validDoc(), 'blob', 'dismissed')
      try { taskDoc() }
      catch (err) { err.message.should.startWith('invalid attribute') }
      taskDoc.should.throw()
      done()
    })

    it('should throw if invalid value', (done) => {
      const taskDoc = () => Task.update(validDoc(), 'state', 'invalidValue')
      try { taskDoc() }
      catch (err) { err.message.should.startWith('invalid state') }
      taskDoc.should.throw()
      done()
    })
  })
})

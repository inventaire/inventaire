const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const Task = __.require('models', 'task')
const { expired } = __.require('lib', 'time')

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
    it('should return an object with type', () => {
      const taskDoc = Task.create(validDoc())
      taskDoc.should.be.an.Object()
      taskDoc.type.should.equal('deduplicate')
    })

    it('should return suspectUri and a suggestionUri', () => {
      const taskDoc = Task.create(validDoc())
      taskDoc.suspectUri.should.equal(validDoc().suspectUri)
      taskDoc.suggestionUri.should.equal(validDoc().suggestionUri)
      expired(taskDoc.created, 100).should.be.false()
    })

    it('should throw if no suspect', () => {
      const invalidDoc = {
        type: 'deduplicate',
        suggestionUri: 'wd:Q42'
      }
      const taskDoc = () => Task.create(invalidDoc)
      taskDoc.should.throw()
    })

    it('should throw if empty suspect', () => {
      const invalidDoc = {
        type: 'deduplicate',
        suspectId: '',
        suggestionUri: 'wd:Q42'
      }
      const taskDoc = () => Task.create(invalidDoc)
      try {
        taskDoc()
      } catch (err) {
        err.message.should.startWith('invalid suspect')
      }
      taskDoc.should.throw()
    })
  })

  describe('update', () => {
    it('should update a valid task with an dismissed state', () => {
      const taskDoc = Task.update(validDoc(), 'state', 'dismissed')
      taskDoc.state.should.equal('dismissed')
    })

    it('should throw if invalid attribute to update', () => {
      const taskDoc = () => Task.update(validDoc(), 'blob', 'dismissed')
      try { taskDoc() } catch (err) { err.message.should.startWith('invalid attribute') }
      taskDoc.should.throw()
    })

    it('should throw if invalid value', () => {
      const taskDoc = () => Task.update(validDoc(), 'state', 'invalidValue')
      try { taskDoc() } catch (err) { err.message.should.startWith('invalid state') }
      taskDoc.should.throw()
    })
  })
})

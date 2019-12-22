const __ = require('config').universalPath
const _ = __.require('builders', 'utils')

const should = require('should')

const levelBase = __.require('level', 'base')
const db = levelBase.simpleSubDb('test db')

describe('simplified level', () => {
  it('should put and get an object value', done => {
    db.put('ohoh', { ahoy: 'georges' })
    .then(() => db.get('ohoh'))
    .then(res => {
      res.should.be.an.Object()
      res.ahoy.should.equal('georges')
      done()
    })
    .catch(done)
  })

  it('should batch and reset', done => {
    db.reset()
    .then(() => db.batch([
      { key: 'a', value: 'b' },
      { key: 'c', value: 'd' },
      { key: 'e', value: { f: 1 } },
      { key: 'g', value: 'h' }
    ]))
    .then(() => db.batch([
      { type: 'del', key: 'c' },
      { type: 'del', key: 'g' },
      { type: 'put', key: 'i', value: 'j' }
    ]))
    .then(() => levelBase.streamPromise(db.sub.createReadStream()))
    .then(dump => {
      dump.should.deepEqual([
        { key: 'a', value: 'b' },
        { key: 'e', value: { f: 1 } },
        { key: 'i', value: 'j' }
      ])
      done()
    })
  })

  it('should put and get a string value', done => {
    db.put('what', 'zup')
    .then(() => db.get('what'))
    .then(res => {
      res.should.equal('zup')
      done()
    })
    .catch(done)
  })

  it('should catch notFound errors', done => {
    let spyCount = 0
    db.get('not defined')
    .catch(err => {
      _.error(err, 'GET err')
      return spyCount++
    })
    .then(res => {
      spyCount.should.equal(0)
      should(res).not.be.ok()
      done()
    })
    .catch(done)
  })
})

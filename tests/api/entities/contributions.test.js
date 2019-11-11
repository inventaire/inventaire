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
const { adminReq, getUser, undesiredErr } = require('../utils/utils')
const { createWork } = require('../fixtures/entities')

describe('entities:get:contributions', () => {
  it('should return a list of patches', (done) => {
    getUser()
    .then((user) => {
      const { _id } = user
      return adminReq('get', `/api/entities?action=contributions&user=${_id}`)
      .then((res) => {
        res.patches.should.be.an.Array()
        return done()
      })}).catch(undesiredErr(done))

  })

  it('should return a list of patches ordered by timestamp', (done) => {
    create2WorksAndGetUser()
    .delay(1000)
    .spread((workA, workB, user) => {
      const { _id } = user
      return adminReq('get', `/api/entities?action=contributions&user=${_id}`)
      .then((res) => {
        const { patches } = res
        const patchesIds = patches.map(getPatchEntityId);
        (patchesIds.includes(workB._id)).should.be.true();
        (patchesIds.includes(workA._id)).should.be.true();
        (patches[0].timestamp > patches[1].timestamp).should.be.true()
        return done()
      })}).catch(undesiredErr(done))

  })

  it('should take a limit parameter', (done) => {
    create2WorksAndGetUser()
    .delay(1000)
    .spread((workA, workB, user) => {
      const { _id } = user
      return adminReq('get', `/api/entities?action=contributions&user=${_id}&limit=1`)
      .then((res) => {
        const { patches } = res
        patches.length.should.equal(1)
        workB._id.should.equal(patches[0]._id.split(':')[0])
        return done()
      })}).catch(undesiredErr(done))

  })

  it('should take an offset parameter', (done) => {
    create2WorksAndGetUser()
    .delay(1000)
    .spread((workA, workB, user) => {
      const { _id } = user
      return adminReq('get', `/api/entities?action=contributions&user=${_id}&limit=1&offset=1`)
      .then((res) => {
        const { patches } = res
        patches.length.should.equal(1)
        workA._id.should.equal(patches[0]._id.split(':')[0])
        return done()
      })}).catch(undesiredErr(done))

  })

  return it('should return total and continue data', (done) => {
    create2WorksAndGetUser()
    .delay(1000)
    .spread((workA, workB, user) => {
      const { _id } = user
      return adminReq('get', `/api/entities?action=contributions&user=${_id}&limit=1`)
      .then((res1) => {
        res1.total.should.be.a.Number()
        should(res1.total >= 2).be.true()
        res1.continue.should.be.a.Number()
        res1.continue.should.equal(1)
        getWorkId(res1.patches[0]._id).should.equal(workB._id)
        return create2WorksAndGetUser()
        .delay(1000)
        .spread((workC, workD) => adminReq('get', `/api/entities?action=contributions&user=${_id}&limit=3`)
        .then((res2) => {
          getWorkId(res2.patches[0]._id).should.equal(workD._id)
          getWorkId(res2.patches[1]._id).should.equal(workC._id)
          getWorkId(res2.patches[2]._id).should.equal(workB._id)
          res2.continue.should.equal(3)
          res2.total.should.equal(res1.total + 2)
          return adminReq('get', `/api/entities?action=contributions&user=${_id}&offset=3`)
          .then((res3) => {
            getWorkId(res3.patches[0]._id).should.equal(workA._id)
            return done()
          })
        }))
      })}).catch(undesiredErr(done))

  })
})

var create2WorksAndGetUser = () => createWork()
.delay(10)
.then(workA => createWork()
.delay(10)
.then(workB => getUser()
.then(user => [ workA, workB, user ])))

var getWorkId = id => id.split(':')[0]
var getPatchEntityId = patch => patch._id.split(':')[0]

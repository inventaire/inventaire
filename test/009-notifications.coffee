__ = require('config').root
_ = __.require 'builders', 'utils'

should = require 'should'
expect = require('chai').expect
trycatch = require 'trycatch'

Promise = require 'bluebird'

notifs_ = __.require 'lib', 'notifications'


describe 'Notifications', ->
  describe 'add', ->
    it "should return a promise", (done)->
      trycatch( ->
        notifs_.add 'aUserId', 'aType', {some: 'data'}
        .then -> done()
        .catch (err)-> throw new Error(err)
      , done)

    it "should throw on wrong argument", (done)->
      trycatch( ->
        (-> notifs_.add('aUserId', 'aType', {some: 'data'})).should.not.throw()
        (-> notifs_.add()).should.throw()
        (-> notifs_.add('aUserId')).should.throw()
        (-> notifs_.add('aUserId', null)).should.throw()
        (-> notifs_.add('aUserId', null, {some: 'data'})).should.throw()
        (-> notifs_.add('aUserId', 'aType', null)).should.throw()
        (-> notifs_.add(null, 'aType', {some: 'data'})).should.throw()
        (-> notifs_.add('aUserId', {some: 'data'}, 'aType')).should.throw()
        done()
      , done)

    it "should have posted the object", (done)->
      notifs_.add 'aUserId', 'aType',
        some: 'data'
        time: _.now()
      .then (res)->
        res.ok.should.equal true
        done()

  describe 'getUserNotifications', ->
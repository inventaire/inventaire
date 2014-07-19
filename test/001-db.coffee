# CONFIG = require('config')
# # expect = require("chai").expect
# # should = require "should"
# # trycatch = require "trycatch"
# # request = require "supertest"
# # baseUrl = require('config').db.fullHost()
# # __ = require('./test-utils').path

# db = require __.server 'db'
# H = db: require __.helpers 'db'



# usersDB = db.use CONFIG.db.users

# H.db.headUniqueDoc(usersDB, usersDesignDoc)
# .then(
#   (log)->console.log log
#   ,(missingDesignDoc)-> H.db.insertDesignDoc(usersDB, missingDesignDoc)
# .fail (err)->console.log err


# # describe "CouchDB", ->
# #   describe "database", ->
# #     it "should be on config Port", (done)->
# #       trycatch( ->
# #         expect(db).to.be.an 'object'
# #         expect(db._server.port).to.equal require('config').dbPort
# #         done()
# #       , done)
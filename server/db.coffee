CONFIG = require('config')
db = require('nano')(CONFIG.dbFullHost)

# db.get "users", (err, body)->
#   if err
#     console.log "db users not found"
#     db.create "users", (err, body)->
#       if err
#         console.log err
#         console.log "couldn't create the db users"
#       else
#         console.log body
#         console.log "users db created!"

module.exports = db
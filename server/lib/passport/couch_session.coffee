promises_ = __.require 'lib', 'promises'

# WIP not used

sessionUrl = "#{CONFIG.db.fullHost()}/_session"

verifyCouchSession = (name, password)->
  promises_.post sessionUrl,
    name: name
    password: password
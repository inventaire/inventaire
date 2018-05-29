module.exports = responses_ =
  # returns a function triggering a standard confirmation response
  ok: (res, status = 200)-> res.status(status).json { ok: true }
  Ok: (res, status)-> responses_.ok.bind null, res, status

  okWarning: (res, warning, status = 200)->
    res.status(status).json { ok: true, warning }

  OkWarning: (res, warning, status)->
    responses_.okWarning.bind null, res, warning, status

  # FROM: .then (users)-> res.json { users }
  # TO: .then _.Wrap(res, 'users')
  Wrap: (res, key)-> (data)->
    obj = {}
    obj[key] = data
    res.json obj

  Send: (req, res)-> (data)->
    _.type data, 'object'
    setWarnings req, data
    res.json data

setWarnings = (req, data)-> if req.warnings? then data.warnings = req.warnings

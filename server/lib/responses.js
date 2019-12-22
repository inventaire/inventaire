const __ = require('config').universalPath
const assert_ = __.require('utils', 'assert_types')

const responses_ = module.exports = {
  // returns a function triggering a standard confirmation response
  ok: (res, status = 200) => {
    res.status(status)
    responses_.send(res, { ok: true })
  },

  Ok: (res, status) => responses_.ok.bind(null, res, status),

  okWarning: (res, category, warning, status = 200) => {
    responses_.addWarning(res, category, warning)
    res.status(status)
    responses_.send(res, { ok: true })
  },

  // FROM: .then (users)-> res.json { users }
  // TO: .then _.Wrap(res, 'users')
  Wrap: (res, key) => data => {
    const obj = {}
    obj[key] = data
    responses_.send(res, obj)
  },

  send: (res, data) => {
    assert_.object(res)
    assert_.object(data)
    setWarnings(res, data)
    res.json(data)
  },

  Send: res => responses_.send.bind(null, res),

  addWarning: (res, category, message) => {
    res.warnings = res.warnings || {}
    res.warnings[category] = res.warnings[category] || []
    res.warnings[category].push(message)
  }
}

const setWarnings = (res, data) => {
  if (res.warnings) data.warnings = res.warnings
}

// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
const CONFIG = require('config')

// A endpoint dedicated to pass configuration parameters to the client
module.exports =
  { get(req, res){ return res.json(CONFIG.client) } }

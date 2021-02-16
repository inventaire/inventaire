const CONFIG = require('config')
const __ = CONFIG.universalPath
const { userAgent } = __.require('lib', 'requests')

// Return an instance of wikibase-edit with the general config pre-set
module.exports = require('wikibase-edit')({
  instance: 'https://www.wikidata.org',
  userAgent,
  // Set an increased maxlag, as most edits are isolated edits from humans using the GUI
  maxlag: 10,
})

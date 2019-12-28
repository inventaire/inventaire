const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { crawlPeriod, debounceDelay, disabled } = CONFIG.debouncedEmail

const db = __.require('level', 'get_sub_db')('waiting')

const sendDebouncedEmail = require('./send_debounced_email')

module.exports = () => {
  if (!disabled) setInterval(crawl, crawlPeriod)
}

// key structure: sendEmailFunctionName:id:time

const crawl = () => {
  return db.createReadStream()
  .on('data', onData)
}

const onData = data => {
  const { key } = data
  const [ domain, id, time ] = key.split(':')

  // if the last event happened more than debounceDelay ago
  if (_.expired(time, debounceDelay)) {
    return sendDebouncedEmail[domain](id)
    .then(db.del.bind(null, key))
  }
}

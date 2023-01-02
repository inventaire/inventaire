import CONFIG from 'config'
import _ from '#builders/utils'
import { expired } from '#lib/time'
import dbFactory from '#db/level/get_sub_db'
import sendDebouncedEmail from './send_debounced_email.js'

const db = dbFactory('waiting', 'utf8')
const { crawlPeriod, debounceDelay, disabled } = CONFIG.debouncedEmail

export default function () {
  if (!disabled) setInterval(crawl, crawlPeriod)
}

// key structure: sendEmailFunctionName:id:time

const crawl = () => {
  return db.createReadStream()
  .on('data', onData)
  .on('error', _.Error('crawl err'))
}

const onData = data => {
  const { key } = data
  const [ domain, id, time ] = key.split(':')

  // if the last event happened more than debounceDelay ago
  if (expired(time, debounceDelay)) {
    return sendDebouncedEmail[domain](id)
    .then(db.del.bind(db, key))
    .catch(_.Error(`sendDebouncedEmail (${domain}) and cleanup err`))
  }
}

import leveldbFactory from '#db/level/get_sub_db'
import { expired } from '#lib/time'
import { LogError } from '#lib/utils/logs'
import CONFIG from '#server/config'
import { debouncedEmailSenderByName } from './send_debounced_email.js'

const db = leveldbFactory('waiting', 'utf8')
const { crawlPeriod, debounceDelay, disabled } = CONFIG.debouncedEmail

export function initDebouncedEmailsCrawler () {
  if (!disabled) setInterval(crawl, crawlPeriod)
}

// key structure: sendEmailFunctionName:id:time

const crawl = () => {
  return db.createReadStream()
  .on('data', onData)
  .on('error', LogError('crawl err'))
}

const onData = data => {
  const { key } = data
  const [ emailName, id, time ] = key.split(':')

  // if the last event happened more than debounceDelay ago
  if (expired(time, debounceDelay)) {
    return debouncedEmailSenderByName[emailName](id)
    .then(db.del.bind(db, key))
    .catch(LogError(`debouncedEmailSenderByName (${emailName}) and cleanup err`))
  }
}

import { handleAbuseReport } from '#controllers/user/lib/abuse_reports'
import { isNonEmptyString } from '#lib/boolean_validations'
import type { MinimalRemoteUser } from '#lib/federation/remote_user'
import { oneYear } from '#lib/time'
import config from '#server/config'
import type { SpamReport, User } from '#types/user'

const { suspectKeywords } = config.spam
const suspectKeywordsPattern = new RegExp(`(${suspectKeywords.join('|')})`, 'i')
const urlPattern = /(http|www\.|\w+\.\w+\/)/i

function looksLikeSpam (text: string) {
  return suspectKeywordsPattern.test(text) && urlPattern.test(text)
}

export async function checkSpamContent (reqUser: User | MinimalRemoteUser, ...values: unknown[]) {
  // TODO: find a way to report abuse to the remote instance
  if (!('_id' in reqUser)) return
  const timestamp = Date.now()
  const userWasCreatedMoreThanAYearAgo = reqUser.created < (timestamp - oneYear)
  if (userWasCreatedMoreThanAYearAgo) return
  for (const value of values) {
    if (isNonEmptyString(value)) {
      if (looksLikeSpam(value)) {
        const report: SpamReport = { type: 'spam', text: value, timestamp }
        await handleAbuseReport(reqUser, report)
      }
    }
  }
}

import { handleAbuseReport } from '#controllers/user/lib/abuse_reports'
import { isNonEmptyString } from '#lib/boolean_validations'
import config from '#server/config'
import type { SpamReport, User } from '#types/user'

const { suspectKeywords } = config.spam
const suspectKeywordsPattern = new RegExp(`(${suspectKeywords.join('|')})`, 'i')
const urlPattern = /(http|www\.|\w+\.\w+\/)/i

function looksLikeSpam (text: string) {
  return suspectKeywordsPattern.test(text) && urlPattern.test(text)
}

export async function checkSpamContent (reqUser: User, ...values: unknown[]) {
  for (const value of values) {
    if (isNonEmptyString(value)) {
      if (looksLikeSpam(value)) {
        const report: SpamReport = { type: 'spam', text: value, timestamp: Date.now() }
        await handleAbuseReport(reqUser, report)
        // Do not throw an error to not disturbe legitimate uses that might trigger false positive
      }
    }
  }
}

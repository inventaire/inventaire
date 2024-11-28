import leven from 'leven'
import dbFactory from '#db/couchdb/base'
import { newError } from '#lib/error/error'
import type { ContextualizedError } from '#lib/error/format_error'
import { arrayIncludes } from '#lib/utils/base'
import { warn } from '#lib/utils/logs'
import type { AbuseReport, User } from '#types/user'

const db = await dbFactory('users')

const abuseTypes = [ 'spam' ] as const

export function handleAbuseReport (reqUser: User, err: ContextualizedError) {
  if (!reqUser) return warn(err, 'non-authentified client abuse report')
  const { _id: userId } = reqUser
  const { message, context } = err
  const type = context.type?.toString()
  const text = context.text?.toString()
  if (!arrayIncludes(abuseTypes, type)) throw newError('unknown abuse report type', 400, { message, context })
  if (!text) throw newError('missing abuse report text', 400, { type, context })
  const report = {
    type,
    // (1)
    text: text?.slice(0, 500) || '',
  }
  const existingReports = reqUser.reports
  const similarReport = existingReports?.some(existingReport => isSimilarReport(existingReport, report))
  // (1)
  if (existingReports?.length > 10) {
    warn({ report, userId }, 'user has already too many reports')
  } else if (similarReport) {
    warn({ report, userId }, 'client abuse report dropped (a similar report already exists)')
  } else {
    warn({ report, userId }, 'recording client abuse report')
    return db.update(userId, user => addReport(user, report))
  }
}

function isSimilarReport (existingReport: AbuseReport, newReport: AbuseReport) {
  if (existingReport.type !== newReport.type) return false
  const distance = leven(existingReport.text, newReport.text)
  const longestLength = Math.max(existingReport.text.length, newReport.text.length)
  return distance < (0.1 * longestLength)
}

export function addReport (user: User, report: AbuseReport) {
  user.reports ??= []
  user.reports.push(report)
  return user
}

// (1): Avoid filling the database with useless spam text
//      Could be adjusted if it appears to be too restrictive

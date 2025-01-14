import leven from 'leven'
import { dbFactory } from '#db/couchdb/base'
import { LogError, warn } from '#lib/utils/logs'
import type { AbuseReport, User } from '#types/user'

const db = await dbFactory('users')

// TODO: add a way for instance admins to clear user.reports
// when the abuse reports were false positives
export async function handleAbuseReport (reqUser: User, report: AbuseReport) {
  const { _id: userId } = reqUser
  report.text = report.text.slice(0, 500)
  const existingReports = reqUser.reports || []
  const similarReport = existingReports.some(existingReport => isSimilarReport(existingReport, report))
  // Avoid filling the database with useless spam text
  // Could be adjusted if it appears to be too restrictive
  if (existingReports.length > 10) {
    warn({ report, userId }, 'user has already too many reports')
  } else if (similarReport) {
    warn({ report, userId }, 'client abuse report dropped (a similar report already exists)')
  } else {
    warn({ report, userId }, 'recording client abuse report')
    await db.update(userId, user => addReport(user, report))
    .catch(LogError('failed to add abuse report'))
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

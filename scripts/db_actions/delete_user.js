#!/usr/bin/env node
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const deleteUserAndCleanup = __.require('controllers', 'user/lib/delete_user_and_cleanup')
const getUserStats = __.require('controllers', 'user/lib/get_user_stats')
const actionByUserId = require('./lib/action_by_user_id')
const { prompt } = __.require('scripts', 'scripts_utils')
const { red, yellow } = require('chalk')

actionByUserId(async userId => {
  const stats = await getUserStats(userId)
  _.log(stats, `user ${userId} stats`)
  if (stats.total > 0) {
    const confirmed = await promptForConfirmation(stats)
    if (confirmed) {
      _.warn('deletion confirmed')
      return deleteUserAndCleanup(userId)
    } else {
      _.warn('aborted delete')
    }
  } else {
    return deleteUserAndCleanup(userId)
  }
})

const promptForConfirmation = async stats => {
  const { username, days, total } = stats
  const increaseDifficulty = days > 180 || total > 10
  const expectedAnswer = increaseDifficulty ? 'Enter username to confirm:' : 'Y/n'
  const res = await prompt(`Are you sure you want to delete the account of ${yellow(username.toLowerCase())} who has been a user for ${yellow(days)} days, with ${yellow(total)} activity signs?\n${expectedAnswer}\n`)
  if (increaseDifficulty) {
    if (res.trim().toLowerCase() !== username.toLowerCase()) {
      console.log(red('username does not match'))
      return false
    } else {
      return true
    }
  } else {
    if (res.trim().toLowerCase() === 'y') return true
    else return false
  }
}

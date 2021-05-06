// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const CONFIG = require('config')
const _ = require('builders/utils')
// Needs to be run before the first promise is fired
// so that the configuration applies to all

const { red } = require('chalk')

module.exports = () => {
  initUncaughtExceptionCatcher()

  _.logErrorsCount()
  _.log(`pid: ${process.pid}`)
  _.log(`env: ${CONFIG.env}`)
  _.log(`host: ${CONFIG.fullHost()}`)
}

const initUncaughtExceptionCatcher = () => {
  process.on('uncaughtException', err => {
    console.error(red('uncaughtException'), err)
  })
}

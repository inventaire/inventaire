import { assertString, assertObject } from '#lib/utils/assert_types'
import { warn } from '#lib/utils/logs'
import type { Res } from '#types/server'

// returns a function triggering a standard confirmation response
function ok (res: Res, status = 200) {
  res.status(status)
  send(res, { ok: true })
}

const Ok = (res: Res, status = 200) => ok.bind(null, res, status)

function okWarning (res: Res, category, warning, status = 200) {
  addWarning(res, `${category}: ${warning}`)
  res.status(status)
  send(res, { ok: true })
}

export function wrap (res: Res, key, data) {
  const obj = {}
  obj[key] = data
  send(res, obj)
}

// FROM: .then (users)-> res.json { users }
// TO: .then Wrap(res, 'users')
export const Wrap = (res: Res, key) => data => wrap(res, key, data)

export function send (res: Res, data) {
  assertObject(res)
  assertObject(data)
  setWarnings(res, data)
  res.json(data)
}

export const sendText = (res: Res, text) => res.send(text)
export const SendText = (res: Res) => text => res.send(text)

// Stringify static JSON only once
export function sendStaticJson (res: Res, staticJson) {
  res.header('content-type', 'application/json').send(staticJson)
}

export const Send = (res: Res) => send.bind(null, res)

export function addWarning (res: Res, message) {
  assertObject(res)
  assertString(message)
  warn(message)
  res.warnings = res.warnings || []
  res.warnings.push(message)
}

export const responses_ = {
  addWarning,
  ok,
  Ok,
  okWarning,
  send,
  Send,
  sendText,
  wrap,
}

function setWarnings (res: Res, data) {
  if (res.warnings) data.warnings = res.warnings
}

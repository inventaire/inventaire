import { warn } from '#lib/utils/logs'

let assert_
const importCircularDependencies = async () => {
  ({ assert_ } = await import('#lib/utils/assert_types'))
}
setImmediate(importCircularDependencies)

// returns a function triggering a standard confirmation response
const ok = (res, status = 200) => {
  res.status(status)
  send(res, { ok: true })
}

const Ok = (res, status) => ok.bind(null, res, status)

const okWarning = (res, category, warning, status = 200) => {
  addWarning(res, category, warning)
  res.status(status)
  send(res, { ok: true })
}

export const wrap = (res, key, data) => {
  const obj = {}
  obj[key] = data
  send(res, obj)
}

// FROM: .then (users)-> res.json { users }
// TO: .then _.Wrap(res, 'users')
export const Wrap = (res, key) => data => wrap(res, key, data)

export const send = (res, data) => {
  assert_.object(res)
  assert_.object(data)
  setWarnings(res, data)
  res.json(data)
}

export const sendText = (res, text) => res.send(text)
export const SendText = res => text => res.send(text)

// Stringify static JSON only once
export const sendStaticJson = (res, staticJson) => {
  res.header('content-type', 'application/json').send(staticJson)
}

export const Send = res => send.bind(null, res)

export const addWarning = (res, message) => {
  assert_.object(res)
  assert_.string(message)
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

const setWarnings = (res, data) => {
  if (res.warnings) data.warnings = res.warnings
}

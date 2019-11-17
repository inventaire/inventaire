// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
// A server-wide event bus
const { EventEmitter } = require('events')
const radio = new EventEmitter()

module.exports = {
  emit: radio.emit.bind(radio),
  Emit: label => radio.emit.bind(radio, label),
  on: radio.on.bind(radio)
}

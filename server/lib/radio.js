// A server-wide event bus
const { EventEmitter } = require('events')
const radio = new EventEmitter()

module.exports = {
  emit: radio.emit.bind(radio),
  Emit: label => radio.emit.bind(radio, label),
  tapEmit: (...args) => res => {
    radio.emit(...args)
    return res
  },
  on: radio.on.bind(radio)
}

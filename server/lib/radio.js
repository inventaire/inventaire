# A server-wide event bus
{ EventEmitter } = require 'events'
radio = new EventEmitter

module.exports =
  emit: radio.emit.bind radio
  Emit: (label)-> radio.emit.bind radio, label
  on: radio.on.bind radio

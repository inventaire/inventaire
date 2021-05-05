// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

// A server-wide event bus

const _ = require('builders/utils')
const { EventEmitter } = require('events')
const radio = new EventEmitter()

// It's convenient in tests to have the guaranty that event listeners were called,
// but in production, that would mean delaying API responses for secondary actions
// (setting notifications, sending emails, analytics, etc)
const waitForListeners = require('config').env.startsWith('tests')

let emit
if (waitForListeners) {
  emit = async (eventName, ...args) => {
    const listeners = radio.listeners(eventName)
    if (listeners.length === 0) {
      _.warn('no event listner found: ' + JSON.stringify({ eventName, args }))
    } else {
      await Promise.all(listeners.map(triggerAndWait(eventName, args)))
    }
  }
} else {
  emit = radio.emit.bind(radio)
}

module.exports = {
  emit,
  Emit: label => emit.bind(null, label),
  tapEmit: (...args) => res => {
    if (waitForListeners) {
      return emit(...args).then(() => res)
    } else {
      emit(...args)
      return res
    }
  },
  on: radio.on.bind(radio)
}

const triggerAndWait = (eventName, args) => async listener => {
  try {
    await listener(...args)
  } catch (err) {
    _.error(err, `${eventName} event listener error`)
  }
}

// A server-wide event bus

import _ from 'builders/utils'
import CONFIG from 'config'
import { EventEmitter } from 'node:events'
const radio = new EventEmitter()

// It's convenient in tests to have the guaranty that event listeners were called,
// but in production, that would mean delaying API responses for secondary actions
// (setting notifications, sending emails, analytics, etc)
const waitForListeners = CONFIG.env.startsWith('tests')

let emit

// In one case, emit is an async function, and in the other a sync function,
// For developers comfort, it should be fine to always `await` emit calls
// but it does mean that what follows the call to `emit` will be called on the next tick
// See https://stackoverflow.com/a/53113299/3324977
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

export default {
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

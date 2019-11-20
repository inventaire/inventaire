
const CONFIG = require('config')
const __ = CONFIG.universalPath
const Item = __.require('models', 'item')

// Working around circular dependencies
let items_
const lateRequire = () => { items_ = require('./items') }
setTimeout(lateRequire, 0)

const AfterFn = (viewName, modelFnName) => (fromUri, toUri) => items_[viewName](fromUri)
.map(Item[modelFnName].bind(null, fromUri, toUri))
.then(items_.db.bulk)

module.exports = {
  afterMerge: AfterFn('byEntity', 'updateEntity'),
  afterRevert: AfterFn('byPreviousEntity', 'revertEntity')
}

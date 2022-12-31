export default {
  typeOf: obj => {
    // just handling what differes from typeof
    const type = typeof obj
    if (type === 'object') {
      if (obj === null) return 'null'
      if (obj instanceof Array) return 'array'
      if (obj instanceof Promise) return 'promise'
    }
    if (type === 'number') {
      if (Number.isNaN(obj)) return 'NaN'
    }
    return type
  }
}

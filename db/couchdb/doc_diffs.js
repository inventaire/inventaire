const { yellow, cyan, green, red, grey } = require('chalk')
const write = process.stdout.write.bind(process.stdout)

const { diffLines } = require('diff')
const stringify = obj => JSON.stringify(obj, null, 2)

module.exports = (current, update, preview) => {
  if (preview) {
    console.log(cyan('PREVIEW'))
  } else {
    console.log(yellow('CHANGE'))
  }
  diffLines(stringify(current), stringify(update))
  .forEach(part => {
    const { added, removed, value } = part
    if (added != null) {
      return write(green(value))
    } else if (removed != null) {
      return write(red(value))
    } else {
      return write(grey(value))
    }
  })

  return write('\n')
}

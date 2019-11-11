{ yellow, cyan, green, red, grey } = require 'chalk'
write = process.stdout.write.bind(process.stdout)

{ diffLines } = require 'diff'
stringify = (obj)-> JSON.stringify obj, null, 2

module.exports = (current, update, preview)->
  if preview then console.log cyan('PREVIEW')
  else console.log yellow('CHANGE')
  diffLines stringify(current), stringify(update)
  .forEach (part)->
    { added, removed, value } = part
    if added? then write green(value)
    else if removed? then write red(value)
    else write grey(value)

  write '\n'

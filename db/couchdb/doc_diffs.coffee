require 'colors'
write = process.stdout.write.bind(process.stdout)

{ diffLines } = require 'diff'
stringify = (obj)-> JSON.stringify obj, null, 2

module.exports = (current, update, preview)->
  if preview then console.log 'PREVIEW'.cyan
  else console.log 'CHANGE'.yellow
  diffLines stringify(current), stringify(update)
  .forEach (part)->
    { added, removed, value } = part
    if added? then write value.green
    else if removed? then write value.red
    else write value.grey

  write '\n'

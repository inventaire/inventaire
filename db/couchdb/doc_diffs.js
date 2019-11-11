/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const { yellow, cyan, green, red, grey } = require('chalk');
const write = process.stdout.write.bind(process.stdout);

const { diffLines } = require('diff');
const stringify = obj => JSON.stringify(obj, null, 2);

module.exports = function(current, update, preview){
  if (preview) { console.log(cyan('PREVIEW'));
  } else { console.log(yellow('CHANGE')); }
  diffLines(stringify(current), stringify(update))
  .forEach(function(part){
    const { added, removed, value } = part;
    if (added != null) { return write(green(value));
    } else if (removed != null) { return write(red(value));
    } else { return write(grey(value)); }
  });

  return write('\n');
};

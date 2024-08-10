// eslint-disable-next-line @typescript-eslint/no-var-requires
const eslintrc = require('./.eslintrc.cjs')

// Rule disabled for IDEs, as its annoying to get `let` turned into `const` on save,
// before having the time to write the code that would reassign the variable.
eslintrc.rules['prefer-const'] = [ 'error' ]

module.exports = eslintrc


/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
module.exports = str => str.trim().toLowerCase()
// Remove reserved characters
.replace(/[/?!'"@,;=$<>&:#()|[\]]+/g, '')
// Replace spaces and points with -
.replace(/(\s+|\.)/g, '-')
// Replace multiple - with a single -
.replace(/-+/g, '-')
// Drop - at the extremities
.replace(/(^-|-$)/g, '')

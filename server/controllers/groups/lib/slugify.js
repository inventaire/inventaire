module.exports = str => {
  return str
  .trim()
  .toLowerCase()
  // Remove reserved characters
  .replace(/[/?!'"@,;=$<>&:#()|[\]]+/g, '')
  // Replace spaces and points with -
  .replace(/(\s+|\.)/g, '-')
  // Replace multiple - with a single -
  .replace(/-+/g, '-')
  // Drop - at the extremities
  .replace(/(^-|-$)/g, '')
}

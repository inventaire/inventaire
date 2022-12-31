export default str => {
  return str
  .trim()
  .toLowerCase()
  // Replace spaces and points with -
  .replace(/(\s+|\.)/g, '-')
  // Replace multiple - with a single -
  .replace(/-+/g, '-')
  // Remove non-letter characters (keeping only "-" as special character)
  // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Unicode_Property_Escapes
  .replace(/[^\p{Letter}-]/ug, '')
  // Drop - at the extremities
  .replace(/(^-|-$)/g, '')
}

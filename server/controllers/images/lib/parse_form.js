const { IncomingForm } = require('formidable')

module.exports = req => new Promise((resolve, reject) => {
  const form = new IncomingForm()
  return form.parse(req, (err, fields, files) => {
    if (err) reject(err)
    else resolve({ fields, files })
  })
})

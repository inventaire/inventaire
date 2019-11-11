module.exports =
  getReqLang: (req)-> req.headers['accept-language']?.split(/\W/)[0]

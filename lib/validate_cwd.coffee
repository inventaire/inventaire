module.exports = (cwd)->
  name = cwd.split('/').splice(-1)[0]
  unless /^inventaire/.test(name) and not /client$/.test(name)
    throw new Error 'this script should be run from the /inventaire/ folder'
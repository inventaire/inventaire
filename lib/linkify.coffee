# customized for server emails needs
module.exports = (text, url, classes='link')->
  "<a href=\"#{url}\" class='#{classes}' target='_blank' mc:disable-tracking>#{text}</a>"
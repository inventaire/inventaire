db.head email, (err, body, header) ->
  console.log err  if err
  if err and err.status_code is 404

    # email is not in db
    doc = username: ""
    db.insert doc, email, (err, body) ->
      console.log err  if err
      resp.send 200
      return

  else

    # email is already stored in db
    resp.send 200
  return
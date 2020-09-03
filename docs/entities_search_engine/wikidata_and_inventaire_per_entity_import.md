## Wikidata and Inventaire per-entity import

### Customize
Customize the configuration by creation a `./config/local.js` file that will override `./config/default.js` values.

### Start the server
```sh
npm start
```
Or, if your system runs with [systemd](https://en.wikipedia.org/wiki/Systemd), you can run it as systemd process
```sh
npm run add-to-systemd
sudo systemctl restart entities-search-engine
```

### Send entities update requests

`POST` the URIs of the entities you want to import, sorted by `type`:

* with curl
```sh
curl -H "Content-Type: application/json" -XPOST http://localhost:3213 --data '{"humans":["wd:Q421512"], "series":["wd:Q3656893"], "works": ["inv:9cf5fbb9affab552cd4fb77712970141", "wd:Q180736"]}'
```

* with an HTTP lib like [request](https://github.com/request/request)
```js
request.post({
  url: 'http://localhost:3213',
  json: {
    humans: ['wd:Q421512'],
    series: ['wd:Q3656893'],
    works: ['inv:9cf5fbb9affab552cd4fb77712970141', 'wd:Q180736']
  }
})
```

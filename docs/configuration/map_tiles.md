# Leaflet Map Tiles

Inventaire displays maps by using the [Leaflet](https://leafletjs.com/) library and [Mapbox](https://www.mapbox.com/) tiles service.

[Mapbox tiles URL is currently hardcoded in the client](https://github.com/inventaire/inventaire-client/blob/da7e2bf/app/modules/map/lib/config.ts#L24), but we are much open to consider alternatives, in particular open and/or self-hostable (such as [OpenMapTiles](https://openmaptiles.org/)): [let us know in this issue](https://github.com/inventaire/inventaire-client/issues/535) if you have insight or opinions on the matter.

## Setup a mapbox account

See https://account.mapbox.com/auth/signup

## Generate an access token

Generate a public access token at: https://docs.mapbox.com/help/getting-started/access-tokens/

## Add it to the inventaire config

Copy the following code in the server configuration file:

`config/local.cjs`

```js
module.exports = {
	// This 'db' key should already appear in the file, do not copy/paste it
	db: {
	  username: "yourCouchdbUsername",
	  password: "yourCouchdbPassword",
	},
	// Copy/paste this key
	mapTilesAccessToken: "yourToken"
}
```

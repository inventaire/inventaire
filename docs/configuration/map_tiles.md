# Leaflet Map Tiles

Inventaire is using [Mapbox.js](https://www.mapbox.com/) service and [Leaflet](https://leafletjs.com/) API to display maps.

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

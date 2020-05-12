# Database administration

## Data transformation
Suggested workflow to apply transformations to documents in a CouchDB database

### 0 - environement

```sh
db_host="http://${db_username}:${db_password}@localhost:5984"
```

### 1 - get the documents locally
In this first step we get all the documents that will need to be edited in a single newline-delimited JSON dump file, that is with one document per line. This format makes the transformation and reupload easier.

#### Get all the documents in a database
```sh
# All 'users' database documents
curl "$db_host/users/_all_docs?include_docs=true" | jq '.rows[] | .doc' -c > documents.ndjson
```

#### Get only documents emitted by a certain view
```sh
# All documents emitted by the 'byUsername' view from the 'users' design doc, from the 'users' database
curl "$db_host/users/_design/users/_view/byUsername" | jq '.rows[] | .doc' -c > documents.ndjson
```

#### Get only documents emitted by a certain view for a certain key
```sh
# Get only documents matching the keys 'foo' and 'bar' in the 'byUsername' view
curl "$db_host/users/_design/users/_view/byUsername?include_docs=true" -d '{"keys":["foo","bar"]}' | jq '.rows[] | .doc' -c > documents.ndjson
```

For more complex keys, curl alone can get painful, as CouchDB expects a valid JSON object. It could then be easier to use a tool such as [`couchdb-view-by-keys`](https://github.com/maxlath/couchdb-view-by-keys) `>= v4`:
```sh
# The same query as above with couchdb-view-by-keys. Notice that include_docs=true is the default now, and that we directly get NDJSON
couchdb-view-by-keys --docs "$db_host/users/_design/users/_view/byUsername" 'foo' 'bar' > documents.ndjson
# This really shines when your keys get more complex: hereafter, we get all documents with the claims
couchdb-view-by-keys --docs "$db_host/entities/_design/entities/_view/byClaim" '["wdt:P31", "wd:Q5"]' > documents.ndjson
```

### 2 - apply transformation
Here, we use [`ndjson-apply`](https://github.com/maxlath/ndjson-apply) to apply a transformation on all the downloaded documents, using a JS function.

Write your transform function in a file:
```js
// transform_users.js
module.exports = doc => {
  doc.language = doc.language || 'en'
  delete doc.picture
  return doc
}
```
(that function could also be async (see [`ndjson-apply` documentation](https://github.com/maxlath/ndjson-apply)))

You can test the effects of your function by using `ndjson-apply` `--diff` mode:

```sh
# Preview the transformation on all the documents
cat ./documents.ndjson | ndjson-apply ./transform_users.js --diff
# or just the first 100 docs
head -n 100 ./documents.ndjson | ndjson-apply ./transform_users.js --diff
```

When the preview gives the expected results, you're ready to transform all your documents!

```sh
cat ./documents.ndjson | ndjson-apply ./transform_users.js > updated_documents.ndjson
```

### 3 - post back in bulk
Those updated documents can be uploaded back to CouchDB with a tool such as [`couchdb-bulk`](https://github.com/jo/couchdb-bulk)

```sh
cat updated_documents.ndjson | couchdb-bulk "$db_host/users" > update.success 2> update.errors
```

# Check for conflicts
```sh
grep conflict update.errors
```

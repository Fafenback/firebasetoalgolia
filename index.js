const algoliasearch = require('algoliasearch');
const firebase = require('firebase');

firebase.initializeApp({databaseURL: "https://laroutesdesvins.firebaseio.com"})

const database = firebase.database();

const algolia = algoliasearch("1WYSWXMAA0", "5eaad0af223d32c2631920ee7142502a");
const index = algolia.initIndex("routedesvins");
const express = require('express');
const app = express();

app.get('/', function (req, res) {

    // Get all vins from Firebase
    database
        .ref('/vins')
        .on('value', vins => {
            // Build an array of all records to push to Algolia
            const records = [];
            vins.forEach(vin => {
                // get the key and data from the snapshot
                const childKey = vin.key;
                const childData = vin.val();
                // We set the Algolia objectID as the Firebase .key
                childData.objectID = childKey;
                const {comments} = childData
                if (comments !== undefined) {
                    const comment = Object
                        .entries(comments)
                        .map(elt => {
                            elt[1].key = elt[0];
                            return elt[1]
                        })
                    childData.comments = comment
                }
                // Add object for indexing
                records.push(childData);
            });

            // Add or update new objects
            index
                .saveObjects(records)
                .then(() => {
                    console.log('Wines imported into Algolia');
                })
                .catch(error => {
                    console.error('Error when importing wins into Algolia', error);
                    process.exit(1);
                });
        });

    res.send(true)
});

app.listen(process.env.PORT || 5000, "0.0.0.0", function () {
    console.log('Your node js server is running');
});
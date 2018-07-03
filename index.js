const algoliasearch = require('algoliasearch');
const firebase = require('firebase');

firebase.initializeApp({databaseURL: "https://laroutesdesvins.firebaseio.com"})

const database = firebase.database();

const algolia = algoliasearch("1WYSWXMAA0", "5eaad0af223d32c2631920ee7142502a");
const index = algolia.initIndex("routedesvins");
const express = require('express');

// Get all vins from Firebase
database
    .ref('/vins')
    .once('value', vins => {
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
            console.log(childData);
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

const winesRef = database.ref('/vins');
winesRef.on('child_added', addOrUpdateIndexRecord);
winesRef.on('child_changed', addOrUpdateIndexRecord);
winesRef.on('child_removed', deleteIndexRecord);

function addOrUpdateIndexRecord(vin) {
    // Get Firebase object
    const record = vin.val();
    // Specify Algolia's objectID using the Firebase object key
    record.objectID = vin.key;
    // Add or update object
    index
        .saveObject(record)
        .then(() => {
            console.log('Firebase object indexed in Algolia', record.objectID);
        })
        .catch(error => {
            console.error('Error when indexing vins into Algolia', error);
            process.exit(1);
        });
}
function deleteIndexRecord(vin) {
    // Get Algolia's objectID from the Firebase object key
    const objectID = vin.key;
    // Remove the object from Algolia
    index
        .deleteObject(objectID)
        .then(() => {
            console.log('Firebase object deleted from Algolia', objectID);
        })
        .catch(error => {
            console.error('Error when deleting vins from Algolia', error);
            process.exit(1);
        });
}

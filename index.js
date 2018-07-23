const algoliasearch = require("algoliasearch");
const firebase = require("firebase");

firebase.initializeApp({
  databaseURL: "https://laroutesdesvins.firebaseio.com"
});

const database = firebase.database();

const algolia = algoliasearch("IYR4SOP0Q1", "d52f69e2d2f71003715d5c47e249a7aa");
const index = algolia.initIndex("routedesvins");

// Get all vins from Firebase
database.ref("/vins").on("value", vins => {
  // Build an array of all records to push to Algolia
  const records = [];
  vins.forEach(vin => {
    // get the key and data from the snapshot
    const childKey = vin.key;
    const childData = vin.val();
    // We set the Algolia objectID as the Firebase .key
    childData.objectID = childKey;
    const { comments } = childData;
    if (comments !== undefined) {
      const comment = Object.entries(comments).map(elt => {
        elt[1].key = elt[0];
        return elt[1];
      });
      childData.comments = comment;
      childData.key = childKey;
    }
    // Add object for indexing
    records.push(childData);
  });

  // Add or update new objects
  index
    .saveObjects(records)
    .then(() => {
      console.log("Wines imported into Algolia");
    })
    .catch(error => {
      console.error("Error when importing wins into Algolia", error);
    });
  const vinsRef = database.ref("/vins");
  vinsRef.on("child_added", addOrUpdateIndexRecord);
  vinsRef.on("child_changed", addOrUpdateIndexRecord);
  vinsRef.on("child_removed", deleteIndexRecord);

  function addOrUpdateIndexRecord(vin) {
    // Get Firebase object
    const record = vin.val();
    // Specify Algolia's objectID using the Firebase object key
    record.objectID = vin.key;
    // Add or update object
    index
      .saveObject(record)
      .then(() => {
        console.log("Firebase object indexed in Algolia", record.objectID);
      })
      .catch(error => {
        console.error("Error when indexing vin into Algolia", error);
      });
  }

  function deleteIndexRecord(vin) {
    // Get Algolia's objectID from the Firebase object key
    const objectID = vin.key;
    // Remove the object from Algolia
    index
      .deleteObject(objectID)
      .then(() => {
        console.log("Firebase object deleted from Algolia", objectID);
      })
      .catch(error => {
        console.error("Error when deleting vin from Algolia", error);
      });
  }
});

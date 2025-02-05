/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)
const { rmdir } = require("fs");

// https://stackoverflow.com/questions/61934443/read-excel-files-in-cypress
const readXlsx = require("./read-xlsx");

/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars
module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config

  // register utility tasks to read and parse Excel files
  on("task", {
    deleteFolder(folderName) {
      console.log("deleting folder %s", folderName);

      return new Promise((resolve, reject) => {
        rmdir(folderName, { maxRetries: 10, recursive: true }, (err) => {
          if (err) {
            console.error(err);

            return reject(err);
          }

          resolve(null);
        });
      });
    },
    readXlsx: readXlsx.read,
    readSheetList: readXlsx.sheetList,
    log(message) {
      console.log(`##Cypress>> ${message}`);
      return null;
    },
    queryDb: (query) => {
      return queryTestDb(query, config);
    },
    sqliteExec: (query) => {
      _sqliteExec(query);
      return null;
    },
  });
};

// mysql connection
// https://gist.github.com/fityanos/0a345e9e9de498b6c629f78e6b2835f5

const mysql = require("mysql2");
function queryTestDb(query, config) {
  // creates a new mysql connection using credentials from cypress.json env's
  const connection = mysql.createConnection(config.env.db);
  // start connection to db
  connection.connect();
  // exec query + disconnect to db as a Promise
  return new Promise((resolve, reject) => {
    connection.query(query, (error, results) => {
      if (error) reject(error);
      else {
        connection.end();
        // console.log(results)
        return resolve(results);
      }
    });
  });
}

// sqlite connection
const sqlite3 = require("sqlite3").verbose();
function _sqliteExec(query) {
  // open the database
  console.log("Current directory: " + process.cwd());
  let db = new sqlite3.Database(
    "./scripts/cypress/fixtures/sqlite-sakila/sakila.db",
    sqlite3.OPEN_READWRITE,
    (err) => {
      if (err) {
        console.error(err.message);
      } else {
        console.log("Connected to the noco xcdb database.");
      }
    }
  );

  db.serialize(() => {
    db.run(query);
  });

  db.close((err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log("Close the database connection.");
    }
  });
}

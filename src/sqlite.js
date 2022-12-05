/**
 * Module handles database management
 *
 * Server API calls the methods in here to query and update the SQLite database
 */

// Utilities we need
const fs = require("fs");

// Initialize the database
const dbFile = "./.data/other.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const dbWrapper = require("sqlite");
let db;

/* 
We're using the sqlite wrapper so that we can make async / await connections
- https://www.npmjs.com/package/sqlite
*/
dbWrapper
  .open({
    filename: dbFile,
    driver: sqlite3.Database,
  })
  .then(async (dBase) => {
    db = dBase;

    // We use try and catch blocks throughout to handle any database errors
    try {
      // The async / await syntax lets us write the db operations in a way that won't block the app
      if (!exists) {
        // Database doesn't exist yet - create Choices and Log tables
        await db.run(
          "CREATE TABLE Choices (id INTEGER PRIMARY KEY AUTOINCREMENT, language TEXT, picks INTEGER)"
        );

        // Add default choices to table
        await db.run(
          "INSERT INTO Choices (language, picks) VALUES ('HTML', 0), ('JavaScript', 0), ('CSS', 0)"
        );

        // Log can start empty - we'll insert a new record whenever the user chooses a poll option
        await db.run(
          "CREATE TABLE Log (id INTEGER PRIMARY KEY AUTOINCREMENT, choice TEXT, time STRING)"
        );

        await db.run(
          "CREATE TABLE ImageRecord (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT," +
            "source TEXT UNIQUE, " +
            "alt TEXT " +
            ")"
        );
        
        await db.run(
          "CREATE TABLE Activity (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT," +
            "title TEXT UNIQUE, " +
            "description TEXT " +
            ")"
        );

        await db.run(
          "CREATE TABLE Hobby (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT," +
            "title TEXT UNIQUE, " +
            "description TEXT, " +
            "hobbyImage INTEGER, " +
            "FOREIGN KEY(hobbyImage) REFERENCES ImageRecord(id)" +
            ")"
        );

        await db.run(
          "CREATE TABLE SocialItem (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT," +
            "title TEXT UNIQUE, " +
            "linkPage TEXT, " +
            "socialImage INTEGER, " +
            "FOREIGN KEY(socialImage) REFERENCES ImageRecord(id)" +
            ")"
        );

        await db.run(
          "CREATE TABLE AcademicRecord (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT," +
            "timePeriod TEXT, " +
            "institutionImage INTEGER, " +
            "degreeLink TEXT UNIQUE, " +
            "degreeTitle TEXT, " +
            "degreeDescription TEXT, " +
            "FOREIGN KEY(institutionImage) REFERENCES ImageRecord(id)" +
            ")"
        );

        await db.run(
          "CREATE TABLE WorkRecord (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT," +
            "timePeriod TEXT, " +
            "companyImage INTEGER, " +
            "position TEXT, " +
            "description TEXT, " +
            "FOREIGN KEY(companyImage) REFERENCES ImageRecord(id)" +
            ")"
        );
        
        await db.run(
          "CREATE TABLE QAItem (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT," +
            "question TEXT, " +
            "answer TEXT, " +
            "email TEXT, " +
            "FOREIGN KEY(companyImage) REFERENCES ImageRecord(id)" +
            ")"
        );
      } else {
        // We have a database already - write Choices records to log for info
        console.log(await db.all("SELECT * from Choices"));

        //If you need to remove a table from the database use this syntax
        //db.run("DROP TABLE Logs"); //will fail if the table doesn't exist
      }
    } catch (dbError) {
      console.error(dbError);
      console.error("Hello");
    }
  });

// Our server script will call these methods to connect to the db
const self = module.exports = {
  /**
   * Get the options in the database
   *
   * Return everything in the Choices table
   * Throw an error in case of db connection issues
   */
  getOptions: async () => {
    // We use a try catch block in case of db errors
    try {
      return await db.all("SELECT * from Choices");
    } catch (dbError) {
      // Database connection error
      console.error(dbError);
    }
  },
  
  getImage: async(imageId) => {
    return await db.get("SELECT source, alt from ImageRecord WHERE id = ?", [imageId]);
  },
  
  getWorkRecords: async () => {
    // We use a try catch block in case of db errors
    try {
      let records = await db.all("SELECT * from WorkRecord");
      return await Promise.all(records.map(async (record) => {
        let image = await self.getImage(record.companyImage);
        return {
          image: image,
          timePeriod: record.timePeriod,
          position: record.position,
          description: record.description
        }
      }));
    } catch (dbError) {
      // Database connection error
      console.error(dbError);
      return dbError;
    }
  },
  
  getAcademicRecords: async () => {
    // We use a try catch block in case of db errors
    try {
      let records = await db.all("SELECT * from AcademicRecord");
      return await Promise.all(records.map(async (record) => {
        let image = await self.getImage(record.institutionImage);
        return {
          timePeriod: record.timePeriod,
          image: image,
          degree: {
            link : record.degreeLink,
            title: record.degreeTitle,
            description: record.degreeDescription
          }
        }
      }));
    } catch (dbError) {
      // Database connection error
      console.error(dbError);
      return dbError;
    }
  },
  
  getHobbies: async () => {
    // We use a try catch block in case of db errors
    try {
      let records = await db.all("SELECT * from Hobby");
      return await Promise.all(records.map(async (record) => {
        let image = await self.getImage(record.hobbyImage);
        return {
          title: record.title,
          description: record.description,
          image
        }
      }));
    } catch (dbError) {
      // Database connection error
      console.error(dbError);
      return dbError;
    }
  },
  
  getSocialItems: async () => {
    // We use a try catch block in case of db errors
    try {
      let records = await db.all("SELECT * from SocialItem");
      return await Promise.all(records.map(async (record) => {
        let image = await self.getImage(record.socialImage);
        return {
          title: record.title,
          linkPage: record.linkPage,
          image
        }
      }));
    } catch (dbError) {
      // Database connection error
      console.error(dbError);
      return dbError;
    }
  },
  
  getActivities: async () => {
    // We use a try catch block in case of db errors
    try {
      return db.all("SELECT title, description from Activity");
    } catch (dbError) {
      // Database connection error
      console.error(dbError);
      return dbError;
    }
  },

  /**
   * Process a user vote
   *
   * Receive the user vote string from server
   * Add a log entry
   * Find and update the chosen option
   * Return the updated list of votes
   */
  processVote: async (vote) => {
    // Insert new Log table entry indicating the user choice and timestamp
    try {
      // Check the vote is valid
      const option = await db.all(
        "SELECT * from Choices WHERE language = ?",
        vote
      );
      if (option.length > 0) {
        // Build the user data from the front-end and the current time into the sql query
        await db.run("INSERT INTO Log (choice, time) VALUES (?, ?)", [
          vote,
          new Date().toISOString(),
        ]);

        // Update the number of times the choice has been picked by adding one to it
        await db.run(
          "UPDATE Choices SET picks = picks + 1 WHERE language = ?",
          vote
        );
      }

      // Return the choices so far - page will build these into a chart
      return await db.all("SELECT * from Choices");
    } catch (dbError) {
      console.error(dbError);
    }
  },
  
  processImage: async (imageRecord) => {
    const existingImages = await db.all(
        "SELECT * from ImageRecord WHERE source = ?",
        imageRecord.imageSource
      );
      if (existingImages.length > 0) {
        console.error(`Image source already exists: ${imageRecord.imageSource}`);
        return {
          errorMessage: "Image source already exists!",
          errorArgument: imageRecord.imageSource,
        };
      }
      await db.run("INSERT INTO ImageRecord(source, alt) VALUES (?, ?)", [
        imageRecord.imageSource,
        imageRecord.imageAlt]
      );
      
      return await db.get("SELECT id FROM ImageRecord WHERE source= ?", [imageRecord.imageSource]);
  },

  processAcademicRecord: async (academicRecord) => {
    // Insert new Log table entry indicating the user choice and timestamp
    try {
      
      let image = await self.processImage(academicRecord);
      if(image.hasOwnProperty("errorMessage")) {
        return image;
      }
      await db.run(
            "INSERT INTO AcademicRecord (timePeriod, degreeLink, degreeTitle, degreeDescription, institutionImage) VALUES (?, ?, ?, ?, ?)",
            [
              academicRecord.timePeriod,
              academicRecord.degreeLink,
              academicRecord.degreeTitle,
              academicRecord.degreeDescription,
              image.id,
            ]
          );

      // Build the user data from the front-end and the current time into the sql query

      // Return the choices so far - page will build these into a chart
      return await db.all("SELECT * from AcademicRecord");
    } catch (dbError) {
      console.error(dbError);
      return dbError;
    }
  },
  
  processWorkRecord: async (workRecord) => {
    // Insert new Log table entry indicating the user choice and timestamp
    try {
      let image = await self.processImage(workRecord);
      if(image.hasOwnProperty("errorMessage")) {
        return image;
      }
      await db.run(
            "INSERT INTO WorkRecord (timePeriod, position, description, companyImage) VALUES (?, ?, ?, ?)",
            [
              workRecord.timePeriod,
              workRecord.position,
              workRecord.description,
              image.id,
            ]
          );

      // Build the user data from the front-end and the current time into the sql query

      // Return the choices so far - page will build these into a chart
      return await db.all("SELECT * from WorkRecord");
    } catch (dbError) {
      console.error(dbError);
      return dbError;
    }
  },
  
  processHobbyRecord: async (hobby) => {
    // Insert new Log table entry indicating the user choice and timestamp
    try {
      let image = await self.processImage(hobby);
      if(image.hasOwnProperty("errorMessage")) {
        return image;
      }
      await db.run(
            "INSERT INTO Hobby (title, description, hobbyImage) VALUES (?, ?, ?)",
            [
              hobby.title,
              hobby.description,
              image.id,
            ]
          );

      // Build the user data from the front-end and the current time into the sql query

      // Return the choices so far - page will build these into a chart
      return await db.all("SELECT * from Hobby");
    } catch (dbError) {
      console.error(dbError);
      return dbError;
    }
  },
  
  processSocialItem: async (socialItem) => {
    // Insert new Log table entry indicating the user choice and timestamp
    try {
      let image = await self.processImage(socialItem);
      if(image.hasOwnProperty("errorMessage")) {
        return image;
      }
      await db.run(
            "INSERT INTO SocialItem (title, linkPage, socialImage) VALUES (?, ?, ?)",
            [
              socialItem.title,
              socialItem.linkPage,
              image.id,
            ]
          );

      // Build the user data from the front-end and the current time into the sql query

      // Return the choices so far - page will build these into a chart
      return await db.all("SELECT * from SocialItem");
    } catch (dbError) {
      console.error(dbError);
      return dbError;
    }
  },
  
  processActivity: async (thingToDoItem) => {
    // Insert new Log table entry indicating the user choice and timestamp
    try {
      await db.run(
            "INSERT INTO Activity (title, description) VALUES (?, ?)",
            [
              thingToDoItem.title,
              thingToDoItem.description,
            ]
          );

      // Build the user data from the front-end and the current time into the sql query

      // Return the choices so far - page will build these into a chart
      return await db.all("SELECT * from Activity");
    } catch (dbError) {
      console.error(dbError);
      return dbError;
    }
  },

  /**
   * Get logs
   *
   * Return choice and time fields from all records in the Log table
   */
  getLogs: async () => {
    // Return most recent 20
    try {
      // Return the array of log entries to admin page
      return await db.all("SELECT * from Log ORDER BY time DESC LIMIT 20");
    } catch (dbError) {
      console.error(dbError);
    }
  },

  /**
   * Clear logs and reset votes
   *
   * Destroy everything in Log table
   * Reset votes in Choices table to zero
   */
  clearHistory: async () => {
    try {
      // Delete the logs
      await db.run("DELETE from Log");

      // Reset the vote numbers
      await db.run("UPDATE Choices SET picks = 0");

      // Return empty array
      return [];
    } catch (dbError) {
      console.error(dbError);
    }
  },
};

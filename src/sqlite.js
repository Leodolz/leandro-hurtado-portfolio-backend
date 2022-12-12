/**
 * Module handles database management
 *
 * Server API calls the methods in here to query and update the SQLite database
 */

// Utilities we need
const fs = require("fs");

// Initialize the database
const dbFile = "./.data/other4.db";
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
        // Database doesn't exist yet - create necessary tables

        // Create table for Image Records using SQL commands
        await db.run(
          "CREATE TABLE ImageRecords (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT," +
            "source TEXT UNIQUE, " +
            "alt TEXT " +
            ")"
        );
        
        // Create table for Activities using SQL commands
        await db.run(
          "CREATE TABLE Activities (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT," +
            "title TEXT UNIQUE, " +
            "description TEXT " +
            ")"
        );

        // Create table for Hobbies using SQL commands
        await db.run(
          "CREATE TABLE Hobbies (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT," +
            "title TEXT UNIQUE, " +
            "description TEXT, " +
            "hobbyImage INTEGER, " +
            "FOREIGN KEY(hobbyImage) REFERENCES ImageRecords(id)" +
            ")"
        );

        // Create table for Social Items using SQL commands
        await db.run(
          "CREATE TABLE SocialItems (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT," +
            "title TEXT UNIQUE, " +
            "linkPage TEXT, " +
            "socialImage INTEGER, " +
            "FOREIGN KEY(socialImage) REFERENCES ImageRecords(id)" +
            ")"
        );

        // Create table for Academic Records using SQL commands
        await db.run(
          "CREATE TABLE AcademicRecords (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT," +
            "timePeriod TEXT, " +
            "institutionImage INTEGER, " +
            "degreeLink TEXT UNIQUE, " +
            "degreeTitle TEXT, " +
            "degreeDescription TEXT, " +
            "FOREIGN KEY(institutionImage) REFERENCES ImageRecords(id)" +
            ")"
        );

        // Create table for Work Records using SQL commands
        await db.run(
          "CREATE TABLE WorkRecords (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT," +
            "timePeriod TEXT, " +
            "companyImage INTEGER, " +
            "position TEXT, " +
            "description TEXT, " +
            "FOREIGN KEY(companyImage) REFERENCES ImageRecords(id)" +
            ")"
        );
        
        // Create table for Comment Records using SQL commands
        await db.run(
          "CREATE TABLE Comments (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT," +
            "firstName TEXT, " +
            "lastName TEXT," +
            "comment TEXT, " +
            "email TEXT UNIQUE, " +
            "updatedAt INTEGER " +
            ")"
        );
        
        // Create table for Email request Records using SQL commands
        await db.run(
          "CREATE TABLE EmailRequests (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT," +
            "email TEXT, " +
            "createdAt INTEGER " +
            ")"
        );
        
      }
      // If any db error happens, log it here
    } catch (dbError) {
      console.error(dbError);
    }
  });

// Our server script will call these methods to connect to the db
const self = module.exports = {
  
  // Async method for fetching an image from its id
  getImage: async(imageId) => {
    // We use db.get() and create an SQL and the rest of parameters will replace the ""
    return await db.get("SELECT source, alt from ImageRecords WHERE id = ?", [imageId]);
  },
  
  getWorkRecords: async () => {
    // We use a try catch block in case of db errors
    try {
      let records = await db.all("SELECT * from WorkRecords");
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
      let records = await db.all("SELECT * from AcademicRecords");
      return await Promise.all(records.map(async (record) => {
        let image = await self.getImage(record.institutionImage);
        return {
          timePeriod: record.timePeriod,
          institutionImage: image,
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
      let records = await db.all("SELECT * from Hobbies");
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
      let records = await db.all("SELECT * from SocialItems");
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
      return db.all("SELECT title, description from Activities");
    } catch (dbError) {
      // Database connection error
      console.error(dbError);
      return dbError;
    }
  },
  
  getComments: async () => {
    // We use a try catch block in case of db errors
    try {
      return db.all("SELECT firstName, lastName, comment, updatedAt from Comments");
    } catch (dbError) {
      // Database connection error
      console.error(dbError);
      return dbError;
    }
  },
  
  processWrapper: async (body, processAction, getAction, invalidMessage) => {
    const allErrors = [];
    let processCount = 1;
    if(Array.isArray(body)) {
      processCount = body.length;
      for(const singleRecord of body) {
        let error = await processAction(singleRecord);
        if(error !== null) {
          allErrors.push({
            originalBody: singleRecord,
            error
          });
        }
      }
    }
    else if (Object.keys(body).length > 0) {
      let error = await processAction(body);
      if(error !== null) {
        allErrors.push({
          originalBody: body,
          error
        });
      }
    } else {
      return {
        errorMessage: invalidMessage,
        requestBody: body
      };
    }
    if(allErrors.length > 0) {
      return {
        errorMessage: `${allErrors.length} out of ${processCount} record(s) failed upon submission!`,
        errors: allErrors
      };
    }
    return await getAction();
  },
  
  processImage: async (imageRecord) => {
    const existingImages = await db.all(
        "SELECT * from ImageRecords WHERE source = ?",
        imageRecord.imageSource
      );
      if (existingImages.length > 0) {
        return { id: existingImages[0].id }
      }
      await db.run("INSERT INTO ImageRecords(source, alt) VALUES (?, ?)", [
        imageRecord.imageSource,
        imageRecord.imageAlt]
      );
      
      return await db.get("SELECT id FROM ImageRecords WHERE source= ?", [imageRecord.imageSource]);
  },

  processAcademicRecord: async (academicRecord) => {
    // Insert new Log table entry indicating the user choice and timestamp
    try {
      
      let image = await self.processImage(academicRecord);
      if(image.hasOwnProperty("errorMessage")) {
        return image;
      }
      await db.run(
            "INSERT INTO AcademicRecords (timePeriod, degreeLink, degreeTitle, degreeDescription, institutionImage) VALUES (?, ?, ?, ?, ?)",
            [
              academicRecord.timePeriod,
              academicRecord.degreeLink,
              academicRecord.degreeTitle,
              academicRecord.degreeDescription,
              image.id,
            ]
          );
      return null;
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
            "INSERT INTO WorkRecords (timePeriod, position, description, companyImage) VALUES (?, ?, ?, ?)",
            [
              workRecord.timePeriod,
              workRecord.position,
              workRecord.description,
              image.id,
            ]
          );
      return null;
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
            "INSERT INTO Hobbies (title, description, hobbyImage) VALUES (?, ?, ?)",
            [
              hobby.title,
              hobby.description,
              image.id,
            ]
          );
      return null;
      
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
            "INSERT INTO SocialItems (title, linkPage, socialImage) VALUES (?, ?, ?)",
            [
              socialItem.title,
              socialItem.linkPage,
              image.id,
            ]
          );
      return null;
    } catch (dbError) {
      console.error(dbError);
      return dbError;
    }
  },
  
  processActivity: async (thingToDoItem) => {
    // Insert new Log table entry indicating the user choice and timestamp
    try {
      await db.run(
            "INSERT INTO Activities (title, description) VALUES (?, ?)",
            [
              thingToDoItem.title,
              thingToDoItem.description,
            ]
          );
      
      return null;
      
    } catch (dbError) {
      console.error(dbError);
      return dbError;
    }
  },
  
  getComment: async(email) => {
    return await db.get("SELECT id FROM Comments WHERE email= ?", [email]);
  },
  
  verifyEmailFrequency: async() => {
    let existingEmail = await db.all("SELECT id FROM EmailRequests WHERE createdAt > ? ", [Date.now() - (1000 * 300)]);
    return existingEmail.length > 0;
  },
  
  processEmailRequest: async(email) => {
    try {
      await db.run(
            "INSERT INTO EmailRequests (email, createdAt) VALUES (?, ?)",
            [
              email,
              Date.now(),
            ]
          );
      
      return null;
      
    } catch (dbError) {
      console.error(dbError);
      return dbError;
    }
  },
  
  processComment: async (comment) => {
    // Insert new Log table entry indicating the user choice and timestamp
    try {
      let existingComment = await self.getComment(comment.email);
      if(existingComment === undefined) {
        await db.run(
              "INSERT INTO Comments (firstName, lastName, email, comment, updatedAt) VALUES (?, ?, ?, ?, ?)",
              [
                comment.firstName,
                comment.lastName,
                comment.email,
                comment.comment,
                Date.now()
              ]
            );
        return {success: true, frequent: false};
      } else {
        await db.run(
              "UPDATE Comments SET comment = ?, updatedAt = ? WHERE id = ?",
              [
                comment.comment,
                Date.now(),
                existingComment.id
              ]
            );
        return {success: true, frequent: true};
      }
      
      return null;
      
    } catch (dbError) {
      console.error(dbError);
      return {success:false, errorMessage: dbError};
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

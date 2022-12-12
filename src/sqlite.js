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
    // We use db.get() and create an SQL and the rest of parameters will replace the "?" characters on the SQL command
    return await db.get("SELECT source, alt from ImageRecords WHERE id = ?", [imageId]);
  },
  
  // Async method for fetching all work records
  getWorkRecords: async () => {
    // We use a try catch block in case of db errors
    try {
      // Select all work records
      let records = await db.all("SELECT * from WorkRecords");
      // As we map these records with async arrow functions, we need to
      // use Promise.all for awaiting all of these to be mapped for returning
      return await Promise.all(records.map(async (record) => {
        // Get the image for the work record using the companyImage attribute
        // Which is the id of the work record
        let image = await self.getImage(record.companyImage);
        // Return the record as json for each item in this map function
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
  
  // Async method for fetching all academic records
  getAcademicRecords: async () => {
    // We use a try catch block in case of db errors
    try {
      // Select all academic records
      let records = await db.all("SELECT * from AcademicRecords");
      // Map all items for returning in a certain structure while also fetching
      // their respective image, this is done similarly as in the work records
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
      // Database connection error logging and return if it happens
      console.error(dbError);
      return dbError;
    }
  },
  
  // Async method for fetching all hobbies
  getHobbies: async () => {
    // We use a try catch block in case of db errors
    try {
      // Select all hobbies
      let records = await db.all("SELECT * from Hobbies");
      // Map all items for returning in a certain structure while also fetching
      // their respective image, this is done similarly as in the work records
      return await Promise.all(records.map(async (record) => {
        let image = await self.getImage(record.hobbyImage);
        return {
          title: record.title,
          description: record.description,
          image
        }
      }));
    } catch (dbError) {
      // Database connection error logging anr return if it happens
      console.error(dbError);
      return dbError;
    }
  },
  
  // Async method for fetching social items from database
  getSocialItems: async () => {
    // We use a try catch block in case of db errors
    try {
      // Get all social items from table
      let records = await db.all("SELECT * from SocialItems");
      // Map all items for returning in a certain structure while also fetching
      // their respective image, this is done similarly as in the work records
      return await Promise.all(records.map(async (record) => {
        let image = await self.getImage(record.socialImage);
        return {
          title: record.title,
          linkPage: record.linkPage,
          image
        }
      }));
    } catch (dbError) {
      // Database connection error logging and return if it happens
      console.error(dbError);
      return dbError;
    }
  },
  
  // Async method for fetching activities from database
  getActivities: async () => {
    // We use a try catch block in case of db errors
    try {
      // Return the retrieval of activities, we only need title and description
      // fields for each
      return db.all("SELECT title, description from Activities");
    } catch (dbError) {
      // Database connection error logging and return if it happens
      console.error(dbError);
      return dbError;
    }
  },
  
  // Async method for fetching comments from database
  getComments: async () => {
    // We use a try catch block in case of db errors
    try {
      // Return retrieval of comments and select certain fields for each record
      return db.all("SELECT firstName, lastName, comment, updatedAt from Comments");
    } catch (dbError) {
      // Database connection error logging and return if it happens
      console.error(dbError);
      return dbError;
    }
  },
  
  // Wrapper function that will generically process working with its given parameters
  // The "body" parameter is the one that will be processed by the second parameter
  // The "processAction" parameter is a callback function for processing the body in the db
  // The "getAction" parameter is a callback function for returning a set of items as response
  // The "invalidMessage" parameter will be returned as backup if something bad happens on processing
  processWrapper: async (body, processAction, getAction, invalidMessage) => {
    // Initialize errors as empty array
    const allErrors = [];
    // Start the process count variable, it indicates the number of processes
    // that should be done as this method either runs one or multiple processes
    let processCount = 1;
    // If the body is an array, enter this condition
    if(Array.isArray(body)) {
      // Process count will be transformed to the number of items in the array
      processCount = body.length;
      // Iterate on each record from the array in ES6 style
      for(const singleRecord of body) {
        // Process using the record, if something is delivered, it would be an error
        let error = await processAction(singleRecord);
        // Check if we indeed received something different than null as error
        if(error !== null) {
          // If there is an error, append in the allErrors array the error and continue
          // with further iterations
          allErrors.push({
            originalBody: singleRecord,
            error
          });
        }
      }
    }
    // If the body parameter is a single object with parameters, enter this condition
    else if (Object.keys(body).length > 0) {
      // Process in a similar way as in the loop above, the processing should return null
      // if there were no errors
      let error = await processAction(body);
      // If something is delivered, push this error
      if(error !== null) {
        allErrors.push({
          originalBody: body,
          error
        });
      }
    } else {
      // If the body parameter is neither an array or an object, then return the invalidMessage
      return {
        errorMessage: invalidMessage,
        requestBody: body
      };
    }
    // If there are errors, return these listed with a message
    if(allErrors.length > 0) {
      return {
        // We use the process count and errors length to inform how many erorrs in the collection happened
        errorMessage: `${allErrors.length} out of ${processCount} record(s) failed upon submission!`,
        errors: allErrors
      };
    }
    // If nothing wrong happened, return with the get action callback indicating success
    return await getAction();
  },
  
  // Method for storing image given an ImageRecord
  processImage: async (imageRecord) => {
    const existingImages = await db.all(
        "SELECT * from ImageRecords WHERE source = ?",
        imageRecord.imageSource
      );
    // Check if there is an image with the same source
    if (existingImages.length > 0) {
      // If it exists, return this id instead of creating something
      return { id: existingImages[0].id }
    }
    // Await the database insertion using the source and alt given
    await db.run("INSERT INTO ImageRecords(source, alt) VALUES (?, ?)", [
      imageRecord.imageSource,
      imageRecord.imageAlt]
    );

    // Return all the images
    return await db.get("SELECT id FROM ImageRecords WHERE source= ?", [imageRecord.imageSource]);
  },

  // Method to save the academic record in the database
  processAcademicRecord: async (academicRecord) => {
    // try catch to handle exceptions
    try {
      
      // Get the image id either by creation or fetching an existing by source
      let image = await self.processImage(academicRecord);
      // If this image fetched has an error message, return this error json
      if(image.hasOwnProperty("errorMessage")) {
        return image;
      }
      // Run insert query with data given
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
      // Return null, which indicates no errors
      return null;
    } catch (dbError) {
      // If an error happened, log it and return it
      console.error(dbError);
      return dbError;
    }
  },
  
  // Method to save a work record in the database
  processWorkRecord: async (workRecord) => {
    // Try catch to handle exceptions
    try {
      // Get the image id either by insertion or fetching an existing one by source
      let image = await self.processImage(workRecord);
      // If there was an error, return it
      if(image.hasOwnProperty("errorMessage")) {
        return image;
      }
      // Execute insertion query with data given
      await db.run(
            "INSERT INTO WorkRecords (timePeriod, position, description, companyImage) VALUES (?, ?, ?, ?)",
            [
              workRecord.timePeriod,
              workRecord.position,
              workRecord.description,
              image.id,
            ]
          );
      // Return null which means no errors
      return null;
    } catch (dbError) {
      // If there was an exception, log it and return it to fetcher
      console.error(dbError);
      return dbError;
    }
  },
  
  // Method to save a hobby in the database
  processHobbyRecord: async (hobby) => {
    // Try catch for handling exceptions
    try {
      // Get the image id either by insertion or fetching and existing one with the same source
      let image = await self.processImage(hobby);
      // If the image retrieval contained an error, return it
      if(image.hasOwnProperty("errorMessage")) {
        return image;
      }
      // Make insertion of hobby with data given
      await db.run(
            "INSERT INTO Hobbies (title, description, hobbyImage) VALUES (?, ?, ?)",
            [
              hobby.title,
              hobby.description,
              image.id,
            ]
          );
      // Return null as no errors happened
      return null;
      
    } catch (dbError) {
      // If an exception happened, log it and return it
      console.error(dbError);
      return dbError;
    }
  },
  
  // Method for inserting a social item in the database
  processSocialItem: async (socialItem) => {
    // Try catch for handling exceptions
    try {
      // Get the image either by insertion or by fetching an existing image with same source
      let image = await self.processImage(socialItem);
      // If image retrieval had error, return it
      if(image.hasOwnProperty("errorMessage")) {
        return image;
      }
      // Execute insertion SQL query with data given
      await db.run(
            "INSERT INTO SocialItems (title, linkPage, socialImage) VALUES (?, ?, ?)",
            [
              socialItem.title,
              socialItem.linkPage,
              image.id,
            ]
          );
      // Return null as no errors happened
      return null;
    } catch (dbError) {
      // If there is an exception log it and return it
      console.error(dbError);
      return dbError;
    }
  },
  
  // Method to store an activity in the database
  processActivity: async (thingToDoItem) => {
    // Try catch for exception handling
    try {
      // Execute insertion for activity with title and description
      await db.run(
            "INSERT INTO Activities (title, description) VALUES (?, ?)",
            [
              thingToDoItem.title,
              thingToDoItem.description,
            ]
          );
      
      // Return null as no exceptions happened
      return null;
      
    } catch (dbError) {
      // If exception happens, log it and return it
      console.error(dbError);
      return dbError;
    }
  },
  
  // Fetch a single comment by email
  getComment: async(email) => {
    // SQL query execution for fetching a comment from a certain email
    return await db.get("SELECT id FROM Comments WHERE email= ?", [email]);
  },
  
  // Verify that the email request should be 5 minutes away from now
  verifyEmailFrequency: async() => {
    // SQL query for getting any email where the createdAt was less than 5 minutes from now. 1000 means the conversion from milliseconds to seconds
    // And 300 are the seconds which mean 5 minutes
    let existingEmail = await db.all("SELECT id FROM EmailRequests WHERE createdAt > ? ", [Date.now() - (1000 * 300)]);
    // Return a flag that indicates if there are existing emails or not
    return existingEmail.length > 0;
  },
  
  // Process an email request insertion
  processEmailRequest: async(email) => {
    // Try catch for handling exceptions
    try {
      // SQL query for inserting email with current time
      await db.run(
            "INSERT INTO EmailRequests (email, createdAt) VALUES (?, ?)",
            [
              email,
              Date.now(),
            ]
          );
      
      // Return null as no exceptions happened
      return null;
      
    } catch (dbError) {
      // If an exception happened, return it
      console.error(dbError);
      return dbError;
    }
  },
  
  // Method to save or update a comment from the database
  processComment: async (comment) => {
    // Try catch for handling errors
    try {
      // Fetch if there is an existing comment from an email
      let existingComment = await self.getComment(comment.email);
      // If the comment is undefined then no comment with current email were done
      if(existingComment === undefined) {
        // SQL query for inserting comment with the parameter data
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
        // Return success and a flag that indicates if the comment was not updated, but rather inserted
        return {success: true, frequent: false};
      } else {
        // If the comment already exists, execute SQL update query with data
        await db.run(
              "UPDATE Comments SET comment = ?, updatedAt = ? WHERE id = ?",
              [
                comment.comment,
                Date.now(),
                existingComment.id
              ]
            );
        // Return success and a flag that indicates that the comment was updated
        return {success: true, frequent: true};
      }
    } catch (dbError) {
      // If an exception happens, log it and return unsucessful response
      console.error(dbError);
      return {success:false, errorMessage: dbError};
    }
  },
};

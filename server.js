/**
 * This is the main server script that provides the API endpoints
 * The script uses the database helper in /src
 * The endpoints retrieve, update, and return data to the page handlebars files
 *
 * The API returns the front-end UI handlebars pages, or
 * Raw json if the client requests it with a query parameter ?raw=json
 */

// Utilities we need
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const portfolioMail = 'leandro.hurtado.portfolio@gmail.com';

const transport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: portfolioMail,
    pass: 'paifcqvheenmsegu' // Generated password for nodemailer solely
  }
});
 
// Require the fastify framework and instantiate it
const fastify = require("fastify")({
  // Set this to true for detailed logging:
  logger: false,
});


fastify.register(require("@fastify/cors"), { 
  origin: (origin, cb) => {
    if(origin === 'http://localhost:8080' || origin === 'https://leandro-hurtado-portfolio-api.glitch.me') {
      cb(null, true);
    }
  }
});

// We use a module for handling database operations in /src
const data = require("./src/data.json");
const db = require("./src/" + data.database);

// Home route for the app. delivers a simple json with meta information
fastify.get("/", async (request, reply) => {
  return reply.send({
    app : 'Leandro Portfolio backend',
    version: '1.0.0',
  });
});

// GET request for academic records, should deliver a json array as response
fastify.get("/academicRecords", async (request, reply) => {
  let params = {};

  // Get the available academic records from the database
  const records = await db.getAcademicRecords();
  // If there are records, are not null and have length, we send these
  if (records) {
    params = records;
  }
  // Let the user know if there was a db error if no records ere presented
  else  {
    params.error = data.errorMessage;
  }

  // Send the records or object with error message
  return reply.send(params);
});

// Method for GET request for work records
fastify.get("/workRecords", async (request, reply) => {
  let params = {};

  // Get the work records
  const records = await db.getWorkRecords();
  // If there are records fetched, deliver these records
  if (records) {
    params = records;
  }
  // Let the user know if there was a db error
  else {
    params.error = data.errorMessage;
  }

  // Send the fetched records or error message
  return reply.send(params);
});

// Method for GET requests on hobbies
fastify.get("/hobbies", async (request, reply) => {
  // Initialize response
  let params = {};
  // Get the available hobbies from database
  let records = await db.getHobbies();
  // If records were fetched, set these as response
  if (records) {
    params = records;
  }
  // Let the user know if there was a db error in the 
  else params.error = data.errorMessage;

  // Send the page options or raw JSON data if the client requested it
  return reply.send(params);
});

// Method for GET requests on activities
fastify.get(
  "/activities",
  async (request, reply) => {
    // Initialize response
    let params = {};

    // Get the activities saved from database
    const records = await db.getActivities();
    // If there are records fetched, set these as response
    if (records) {
      params = records;
    }
    // Let the user know if there was a db error
    else {
      params.error = data.errorMessage;
    }

    // Send the response either if it was an error or the activities fetched
    return reply.send(params);
  }
);

// Method for GET request on social items
fastify.get("/socialItems", async (request, reply) => {
  // Initialize response
  let params = {};

  // Get the social items from database
  const records = await db.getSocialItems();
  // If there were records fetched, set these as response
  if (records) {
    params = records;
  }
  // Let the user know if there was a db error
  else {
    params.error = data.errorMessage;
  }

  // Send the response
  return reply.send(params);
});

// Method for GET requests for comments
fastify.get("/comments", async (request, reply) => {
  // Initialize response
  let params = {};

  // Get the available comments from the database
  const records = await db.getComments();
  // If there are records from database, set these as response
  if (records) {
    params = records;
  }
  // Let the user know if there was a db error
  else {
    params.error = data.errorMessage;
  }

  // Send the response
  return reply.send(params);
});

// POST request handler for processing accademig records
fastify.post("/academicRecord", async (request, reply) => {
  // We call our process wrapper, our request body is the record or records array
  // The callback function to process it in database is the second argument
  // The callback function to return all the academic records so far is the third argument
  // The error message is the last argument
  return await db.processWrapper(
    request.body,
    db.processAcademicRecord,
    db.getAcademicRecords,
    data.invalidBodyMessage
  );
});

// POST request handler for processing work records
fastify.post("/workRecord", async (request, reply) => {
  // We call our process wrapper, our request body is the work record or records array
  // The arguments given follow the same pattern as the academic record method's comments explain
  return await db.processWrapper(
    request.body,
    db.processWorkRecord,
    db.getWorkRecords,
    data.invalidBodyMessage
  );
});

// POST request handler for processing social items
fastify.post("/socialItem", async (request, reply) => {
  // We have a vote - send to the db helper to process a
  // The arguments given follow the same pattern as the academic record method's comments explain
  return await db.processWrapper(
    request.body,
    db.processSocialItem,
    db.getSocialItems,
    data.invalidBodyMessage
  );
});

fastify.post("/activity", async (request, reply) => {
  // We have a vote - send to the db helper to process and return results
  return await db.processWrapper(
    request.body,
    db.processActivity,
    db.getActivities,
    data.invalidBodyMessage
  );
});

fastify.post("/hobby", async (request, reply) => {
  // We have a vote - send to the db helper to process and return results
  return await db.processWrapper(
    request.body,
    db.processHobbyRecord,
    db.getHobbies,
    data.invalidBodyMessage
  );
});

fastify.post("/comment", async (request, reply) => {
  return await db.processComment(request.body);
});

fastify.post("/email", async (request, reply) => {
  let existingEmails = await db.verifyEmailFrequency();
  if(existingEmails) {
    return {
      success: false,
      errorMessage: "Looks like another person sent an email recently! Please wait " +
      "up to 5 minutes to try again!"
    }
  }
  let contactInfo = "\n\nContact info:\n";
  let extraInfo = false;
  if(request.body.company.length > 0) {
    contactInfo += `Company: ${request.body.company}\n`; 
    extraInfo = true;
  }
  if(request.body.phone.length > 0) {
    contactInfo += `Country: ${request.body.country}\nPhone: ${request.body.phone}`;
    extraInfo = true;
  }
  if(!extraInfo) {
    contactInfo = "";
  }
  // We have a vote - send to the db helper to process and return results
  const mailOptions = {
    from: portfolioMail,
    to: "leodolz14@gmail.com",
    subject: request.body.subject,
    text: `This is a message sent from Portfolio website, this message was sent by: ` +
    `${request.body.firstName} ${request.body.lastName}. Content is shown below:\n` +
    request.body.message + contactInfo,
    cc: request.body.email
  };
  transport.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
      return {success: false, errorMessage: error};
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
  
  return await db.processWrapper(
    request.body,
    db.processEmailRequest,
    () => {return {success: true}},
    data.invalidBodyMessage
  );
});

// Run the server and report out to the logs
fastify.listen(
  { port: process.env.PORT, host: "0.0.0.0" },
  function (err, address) {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
    console.log(`Your app is listening on ${address}`);
    fastify.log.info(`server listening on ${address}`);
  }
);

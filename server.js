/**
 * This is the main server script that provides the API endpoints
 * The script uses the database helper in /src
 * The endpoints retrieve, update, and return data to the page handlebars files
 *
 * The API returns responses as json
 */

// Utilities we need
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const portfolioMail = 'leandro.hurtado.portfolio@gmail.com';

// Create the config for nodemailer
const transport = nodemailer.createTransport({
  // Service that will be used with nodemailer
  service: 'gmail',
  auth: {
    // Authentication credentials for email. These are only for this app
    user: portfolioMail,
    pass: process.env.PORTFOLIO_MAIL_PASS // Generated password for nodemailer solely
  }
});
 
// Require the fastify framework and instantiate it
const fastify = require("fastify")({
  // Set this to true for detailed logging:
  logger: false,
});


// Allow cors for specific frontend
fastify.register(require("@fastify/cors"), { 
  origin: (origin, cb) => {
    if(origin === 'https://leandro-hurtado-portfolio.netlify.app') {
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

// POST request handler for processing accademig records and save them in the database
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

// POST request handler for processing work records and save them in the database
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

// POST request handler for processing social items and save them in the database
fastify.post("/socialItem", async (request, reply) => {
  // We call our process wrapper, our request body is the social item or items array
  // The arguments given follow the same pattern as the academic record method's comments explain
  return await db.processWrapper(
    request.body,
    db.processSocialItem,
    db.getSocialItems,
    data.invalidBodyMessage
  );
});

// POST request handler for processing activities and saving them in the database
fastify.post("/activity", async (request, reply) => {
  // We call our process wrapper, our request body is the activity or activities array
  // The arguments given follow the same pattern as the academic record method's comments explain
  return await db.processWrapper(
    request.body,
    db.processActivity,
    db.getActivities,
    data.invalidBodyMessage
  );
});

// POST request handler for processing hobbies and saving them in the database
fastify.post("/hobby", async (request, reply) => {
  // We call our process wrapper, our request body is the hobby or hobbies array
  // The arguments given follow the same pattern as the academic record method's comments explain
  return await db.processWrapper(
    request.body,
    db.processHobbyRecord,
    db.getHobbies,
    data.invalidBodyMessage
  );
});

// POST request handler for processing comments and saving them in the database
fastify.post("/comment", async (request, reply) => {
  // We call our processComment from DB where the body is a comment
  return await db.processComment(request.body);
});

// POST request for processing email contacting message built from the contact me section
fastify.post("/email", async (request, reply) => {
  // Verify if there are mails that were used in a certain amount of time
  let existingEmails = await db.verifyEmailFrequency();
  // If there were mails sent recently, don't go further and tell the user to wait
  if(existingEmails) {
    return {
      success: false,
      errorMessage: "Looks like another person sent an email recently! Please wait " +
      "up to 5 minutes to try again!"
    }
  }
  // Initialize contact info
  let contactInfo = "\n\nContact info:\n";
  // Initialize a flag that indicates extra information given
  let extraInfo = false;
  // Check if company name is given on the request
  if(request.body.company.length > 0) {
    // If there is a company name, we append it to the contact info
    contactInfo += `Company: ${request.body.company}\n`; 
    // We set the extra info flag to true
    extraInfo = true;
  }
  // Check if a phone number is given
  if(request.body.phone.length > 0) {
    // If there is phone number, we append the country and phone info inside our contact info
    contactInfo += `Country: ${request.body.country}\nPhone: ${request.body.phone}`;
    // We set the extra info flag to true
    extraInfo = true;
  }
  // If there was no extra info given, then empty contact information
  if(!extraInfo) {
    contactInfo = "";
  }
  // Create the email options for usage with nodemailer
  const mailOptions = {
    // The sender is the email created solely for portfolio contact me processing
    from: portfolioMail,
    // The receiver is my email
    to: "leodolz14@gmail.com",
    // The subject is specified in the request's body
    subject: request.body.subject,
    // The message is prepended by a hard-coded header
    text: `This is a message sent from Portfolio website, this message was sent by: ` +
    `${request.body.firstName} ${request.body.lastName}. Content is shown below:\n` +
    // The message from the request is given alongside with contact info if given extra info
    request.body.message + contactInfo,
    // The requestor is cc'd so that when I receive the email, I can reply to the interested in contact
    cc: request.body.email
  };
  // Nodemailer method for sending the email, we use the email options built above
  // and we use a callback function in the case any error happened
  transport.sendMail(mailOptions, function(error, info){
    if (error) {
      // If there was any error, print it
      console.log(error);
      return {success: false, errorMessage: error};
    } else {
      // If the email sent was a success log in here
      console.log('Email sent: ' + info.response);
    }
  });
  
  // After sending the email, save the succesful email request in a similar way we
  // processed POST requests for the DB
  return await db.processWrapper(
    request.body,
    db.processEmailRequest,
    // Notice this arrow function instead of using a db get function, this is because
    // we don't need to send anything to the requester rather than a success flag
    () => {return {success: true}},
    data.invalidBodyMessage
  );
});

// Run the server
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

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
const 

const transport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'leandro.hurtado.portfolio@gmail.com',
    pass: 'cs601test'
  }
});

// Require the fastify framework and instantiate it
const fastify = require("fastify")({
  // Set this to true for detailed logging:
  logger: false,
});


// We use a module for handling database operations in /src
const data = require("./src/data.json");
const db = require("./src/" + data.database);

/**
 * Home route for the app
 *
 * Return the poll options from the database helper script
 * The home route may be called on remix in which case the db needs setup
 *
 * Client can request raw data using a query parameter
 */
fastify.get("/", async (request, reply) => {
  /* 
  Params is the data we pass to the client
  - SEO values for front-end UI but not for raw data
  */
  let params = {};

  // Get the available choices from the database
  const options = await db.getOptions();
  if (options) {
    params.optionNames = options.map((choice) => choice.language);
    params.optionCounts = options.map((choice) => choice.picks);
  }
  // Let the user know if there was a db error
  else params.error = data.errorMessage;

  // Check in case the data is empty or not setup yet
  if (options && params.optionNames.length < 1)
    params.setup = data.setupMessage;

  // ADD PARAMS FROM TODO HERE

  // Send the page options or raw JSON data if the client requested it
  return reply.send(params);
});

fastify.get("/academicRecords", async (request, reply) => {
  /* 
  Params is the data we pass to the client
  - SEO values for front-end UI but not for raw data
  */
  let params = {};

  // Get the available choices from the database
  const records = await db.getAcademicRecords();
  if (records) {
    params = records;
  }
  // Let the user know if there was a db error
  else params.error = data.errorMessage;

  // Send the page options or raw JSON data if the client requested it
  return reply.send(params);
});

fastify.get("/workRecords", async (request, reply) => {
  /* 
  Params is the data we pass to the client
  - SEO values for front-end UI but not for raw data
  */
  let params = {};

  // Get the available choices from the database
  const records = await db.getWorkRecords();
  if (records) {
    params = records;
  }
  // Let the user know if there was a db error
  else params.error = data.errorMessage;

  // Send the page options or raw JSON data if the client requested it
  return reply.send(params);
});

fastify.get("/hobbies", async (request, reply) => {
  /* 
  Params is the data we pass to the client
  - SEO values for front-end UI but not for raw data
  */
  let params = {};

  // Get the available choices from the database
  const records = await db.getHobbies();
  if (records) {
    params = records;
  }
  // Let the user know if there was a db error
  else params.error = data.errorMessage;

  // Send the page options or raw JSON data if the client requested it
  return reply.send(params);
});

fastify.get(
  "/activities",
  async (request, reply) => {
    /* 
  Params is the data we pass to the client
  - SEO values for front-end UI but not for raw data
  */
    let params = {};

    // Get the available choices from the database
    const records = await db.getActivities();
    if (records) {
      params = records;
    }
    // Let the user know if there was a db error
    else params.error = data.errorMessage;

    // Send the page options or raw JSON data if the client requested it
    return reply.send(params);
  }
);

fastify.get("/socialItems", async (request, reply) => {
  /* 
  Params is the data we pass to the client
  - SEO values for front-end UI but not for raw data
  */
  let params = {};

  // Get the available choices from the database
  const records = await db.getSocialItems();
  if (records) {
    params = records;
  }
  // Let the user know if there was a db error
  else params.error = data.errorMessage;

  // Send the page options or raw JSON data if the client requested it
  return reply.send(params);
});

fastify.get("/comments", async (request, reply) => {
  /* 
  Params is the data we pass to the client
  - SEO values for front-end UI but not for raw data
  */
  let params = {};

  // Get the available choices from the database
  const records = await db.getComments();
  if (records) {
    params = records;
  }
  // Let the user know if there was a db error
  else params.error = data.errorMessage;

  // Send the page options or raw JSON data if the client requested it
  return reply.send(params);
});

/**
 * Post route to process user vote
 *
 * Retrieve vote from body data
 * Send vote to database helper
 * Return updated list of votes
 */
fastify.post("/academicRecord", async (request, reply) => {
  // We have a vote - send to the db helper to process and return results
  return await db.processWrapper(
    request.body,
    db.processAcademicRecord,
    db.getAcademicRecords,
    data.invalidBodyMessage
  );
});

fastify.post("/workRecord", async (request, reply) => {
  // We have a vote - send to the db helper to process and return results
  return await db.processWrapper(
    request.body,
    db.processWorkRecord,
    db.getWorkRecords,
    data.invalidBodyMessage
  );
});

fastify.post("/socialItem", async (request, reply) => {
  // We have a vote - send to the db helper to process and return re
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
  // We have a vote - send to the db helper to process and return results
  return await db.processWrapper(
    request.body,
    db.processComment,
    db.getComments,
    data.invalidBodyMessage
  );
});

fastify.post("/email", async (request, reply) => {
  // We have a vote - send to the db helper to process and return results
  
  return await db.processWrapper(
    request.body,
    db.processEmailRequest,
    () => {return {success: true}},
    data.invalidBodyMessage
  );
});

/**
 * Admin endpoint returns log of votes
 *
 * Send raw json or the admin handlebars page
 */
fastify.get("/logs", async (request, reply) => {
  let params = {};

  // Get the log history from the db
  params.optionHistory = await db.getLogs();

  // Let the user know if there's an error
  params.error = params.optionHistory ? null : data.errorMessage;

  // Send the log list
  return request.query.raw
    ? reply.send(params)
    : reply.view("/src/pages/admin.hbs", params);
});

/**
 * Admin endpoint to empty all logs
 *
 * Requires authorization (see setup instructions in README)
 * If auth fails, return a 401 and the log list
 * If auth is successful, empty the history
 */
fastify.post("/reset", async (request, reply) => {
  let params = {};

  /* 
  Authenticate the user request by checking against the env key variable
  - make sure we have a key in the env and body, and that they match
  */
  if (
    !request.body.key ||
    request.body.key.length < 1 ||
    !process.env.ADMIN_KEY ||
    request.body.key !== process.env.ADMIN_KEY
  ) {
    console.error("Auth fail");

    // Auth failed, return the log data plus a failed flag
    params.failed = "You entered invalid credentials!";

    // Get the log list
    params.optionHistory = await db.getLogs();
  } else {
    // We have a valid key and can clear the log
    params.optionHistory = await db.clearHistory();

    // Check for errors - method would return false value
    params.error = params.optionHistory ? null : data.errorMessage;
  }

  // Send a 401 if auth failed, 200 otherwise
  const status = params.failed ? 401 : 200;
  // Send an unauthorized status code if the user credentials failed
  return request.query.raw
    ? reply.status(status).send(params)
    : reply.status(status).view("/src/pages/admin.hbs", params);
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

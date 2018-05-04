/* eslint-disable no-console */
const AWS = require('aws-sdk'); // eslint-disable-line

const dynamodb = new AWS.DynamoDB.DocumentClient();

// Get JUST the Slack event.
const getSlackEvent = event => ({ slack: JSON.parse(event.body) });

// Keep Slack happy by reponding to the event.
const respond = callback => (event) => {
  const response = { statusCode: 200 };
  if (event.slack.type === 'url_verification') {
    response.body = event.slack.challenge;
  }
  callback(null, response);
  return event;
};

// Verify the token matches ours.
const verifyToken = (event) => {
  if (event.slack.token !== process.env.VERIFICATION_TOKEN) {
    throw new Error('InvalidToken');
  }
  return event;
};

// Get the team details form DDB.
const getTeam = (event) => {
  const params = {
    TableName: process.env.TEAMS_TABLE,
    Key: {
      team_id: event.slack.team_id,
    },
  };
  console.log('dynamodb.get', params);
  return dynamodb.get(params).promise()
    .then(data => Object.assign(event, { team: data.Item }));
};

module.exports.handler = (event, context, callback) =>
  Promise.resolve(event) // Start the promise chain
    .then(getSlackEvent) // Get just the Slack event payload
    .then(respond(callback)) // Respond OK to Slack
    .then(verifyToken) // Verify the token
    .then(getTeam) // Get the team data from DDB
    // .then(checkForMention) // Check message contains a mention of our bot
    // .then(invokeAction) // Invoke action function
    .catch(callback);

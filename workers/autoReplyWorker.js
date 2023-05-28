const { CONSTANTS } = require("../config/constants");
const { listLabels, createLabel, listMessages, addLabelToMessage, sendMessage } = require("../helpers/gmailHelper")
const { authorize } = require("../helpers/googleAuthenticationHelper")
const {google} = require('googleapis');
const schedule = require('node-schedule');

async function processEmailsForAutoReply() {
  try {
    let currentDate = new Date().getTime()
    currentDate -= 120000 // 120 seconds before current time (max time that we'll get from random function)
    const client = await authorize()
    if (!client) {
      throw new Error(`Error in authenticating`)
    }
    const gmail = google.gmail({version: 'v1', auth: client});
    let labelId = await validateLabelPresence(gmail)
    let replyMessageData = await listMessages(gmail, labelId, currentDate)
    let errorMessageList = []
    for (let message of replyMessageData) {
      try {
        if (message) {
          await sendGmailReply(gmail, message, labelId)
        }
      } catch (error) {
        errorMessageList.push(message.id)
        console.log(`Error: while sending reply for ${message.id}`)
      }
    }
    console.log(`Error: in following message ids ${errorMessageList}`)
  } catch (error) {
    console.log(`Error: In AutoReplyWorker ${error.message} ${error.stack}`)
    throw error
  } finally {
    scheduleNextWorker() // schedules worker once done
  }
}

async function validateLabelPresence(gmail) {
  let labelList = await listLabels(gmail)
  let existingLabelList = labelList.filter((label) => label.name == CONSTANTS.LABEL_NAME)
  if (existingLabelList[0]) {
      return existingLabelList[0].id
  }
  let labelData = await createLabel(gmail, CONSTANTS.LABEL_NAME)
  return labelData.id
}

async function sendGmailReply(gmail, messageData, labelId) {
  await addLabelToMessage(gmail, messageData.id, labelId)
  await sendMessage(gmail, messageData)
}

function scheduleNextWorker() {
  let currentDate = new Date()
  let randomNumber = Math.floor(Math.random() * (121 - 45) ) + 45;
  currentDate.setSeconds(currentDate.getSeconds() + randomNumber);
  const job = schedule.scheduleJob(currentDate, function(){
    console.log('Starting Auto Reply Worker');
    processEmailsForAutoReply()
    console.log('Ending Auto Reply Worker')
  });
}


module.exports = { processEmailsForAutoReply, scheduleNextWorker }
const { CONSTANTS }  = require("../config/constants")

async function listLabels(gmail) {
  try {
    const res = await gmail.users.labels.list({
      userId: CONSTANTS.FROM_EMAIL,
    });
    const labels = res.data.labels;
    return labels ? labels : []
  } catch (error) {
    console.log(`Error: In list Labels ${error.message} ${error.stack}`)
    throw error
  }
}

async function createLabel(gmail, labelName) {
  try {
    const res = await gmail.users.labels.create({
      resource: {
        name: labelName,
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show',
      },
      userId: CONSTANTS.FROM_EMAIL
    })
    return res.data
  } catch (error) {
    console.log(`Error: In create Labels ${error.message} ${error.stack}`)
    throw error
  }  
}

async function listMessages(gmail, labelId, startTime) {
  try {
    const res = await gmail.users.messages.list({
      maxResults: 500,
      pageToken: 1,
      q: `after:${parseInt(startTime/1000)}`,
      userId: CONSTANTS.FROM_EMAIL,
    });
    let messages = res.data.messages;
    let processableMessages = await Promise.all(messages.map(async (message) => {
      let messageDetail = await getMessageDetails(gmail, message.threadId)
      if (messageDetail.labelIds.includes(labelId)) {
        return
      }
      let messageHeader = messageDetail.payload.headers
      let subject = messageHeader.filter((data) => data.name == "Subject")
      let from = messageHeader.filter((data) => data.name == "From")
      message.subject = subject[0].value
      message.from = from[0].value
      return message
    }))
    return processableMessages
  } catch (error) {
    console.log(`Error: In list messages ${error.message} ${error.stack}`)
    throw error
  }
}

async function getMessageDetails(gmail, id) {
  try {
    const res = await gmail.users.messages.get({
      id: id,
      userId: CONSTANTS.FROM_EMAIL,
    });
    return res.data
  } catch (error) {
    console.log(`Error: In getMessageDetails ${error.message} ${error.stack}`)
    throw error
  }
}

async function sendMessage(gmail, messageData) {
  try{
    const message = `From: ${CONSTANTS.FROM_EMAIL}\r\n` + 
                    `To: ${messageData.from}\r\n` +
                    `Subject: ${messageData.subject}\r\n\r\n` +
                    `This is an autogenerated message. Please Ignore and contact later`;
    const encodedMessage = btoa(message)
    const reallyEncodedMessage = encodedMessage.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const res = await gmail.users.messages.send({
      userId: CONSTANTS.FROM_EMAIL,
      requestBody: {
        "raw": reallyEncodedMessage,
        "threadId": messageData.threadId
      },
    });
  } catch(error) {
    console.log(`Error: In sendMessage ${error.message} ${error.stack}`)
    throw error
  }
}

async function addLabelToMessage(gmail, id, labelId) {
  try{
    const res = await gmail.users.messages.modify({
      id: id,
      userId: CONSTANTS.FROM_EMAIL,
      resource: {
        addLabelIds: [labelId],
        removeLabelIds: [CONSTANTS.INBOX_LABEL]
      }
    });
  } catch(error) {
    console.log(`Error: In add Label to Message ${error.message} ${error.stack}`)
    throw error
  }
}

module.exports = { listLabels, createLabel, listMessages, sendMessage, addLabelToMessage }
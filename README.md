# gmail-auto-reply-bot

### Steps to start a server
- clone the repo
- run `npm install`
- add google credential json in config/credential.json
- run the server using `node server.js`

### Features Provided
- The email to be used for this bot should be provided in config/constants.js => FROM_EMAIL
- The worker is enqued after 45-120 sec after each worker completion
- A label named **listedFansLabel** is created if not already present in gmail
- Each time the worker runs, it
  - creates the label if not present
  - fetches all the mails received in last 120 sec
  - filters the mail based on label (removes the mails which have already been replied to)
  - marks these filtered mails with new label and removes `INBOX` label => moving it from inbox
  - sends a mail in thread with a custom message


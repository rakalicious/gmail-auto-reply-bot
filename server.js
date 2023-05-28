const express = require('express');

const app = express();
const {scheduleNextWorker} = require("./workers/autoReplyWorker")
scheduleNextWorker()
app.listen(8000, () => {
  console.log(`Example app listening at http://localhost:8000}`);
});
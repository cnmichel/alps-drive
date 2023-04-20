const express = require('express');
const bb = require('express-busboy')
const cors = require('cors');

const app = express();
const port = 3000;

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())
bb.extend(app, {upload: true})

app.use('/', express.static('frontend'))

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

module.exports = app;
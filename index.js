const express = require('express')
const app = express()
const logger = require('morgan')
app.use(logger('dev'))
require('dotenv').config();
const PORT = process.env.PORT || 5500
app.use(express.json())


// import routes
app.use('/drones', require('./routes/drones'))

app.listen(PORT, ()=> console.log(`Drone services running on PORT ${PORT}`))
const express = require('express')
const app = express()
const logger = require('morgan')
app.use(logger('dev'))
require('dotenv').config();
const PORT = process.env.PORT || 4000
app.use(express.json())



app.get('/', (req,res)=>{
    res.status(200).send("Drones services API works fine")
})
// import routes
app.use('/drones', require('./routes/drones'))

app.listen(PORT, ()=> console.log(`Drone services running on PORT ${PORT}`))
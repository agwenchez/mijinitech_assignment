const { Router } = require("express");
const express = require("express");
const router = express.Router();
const db = require('../db')



router.get('/all',async (req, res) => {

    try {
      const drones = await db.query('SELECT * FROM drones')
      res.status(200).send(drones.rows)
  
    } catch (error) {
      console.log((error))
      res.status(500).send(`An error occured: ${error}`)
    }
  
})

  
router.post('/register', async(req,res)=>{

    const {serial_number, model,weight_limit, battery_capacity, state } = req.body
    try {
        const drone = await db.query('INSERT INTO drones(serial_number, model, weight_limit, battery_capacity, state) VALUES($1,$2,$3,$4,$5) RETURNING *', [serial_number, model,weight_limit, battery_capacity, state])

        console.log("Registered drone", drone);
        res.status(200).send(drone.rows)
    
      } catch (error) {
        console.log((error))
        res.status(500).send(`An error occured: ${error}`)
      }
    
})


module.exports = router
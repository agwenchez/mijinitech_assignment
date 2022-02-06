const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const crypto = require("crypto");
const photoMiddleware = require("../middlewares/photoMiddleware");
const cron = require("node-cron");
const  axios = require("axios");

router.get("/battery_periodic", async (req, res) => {
  try {
    const drones = await db.query("SELECT * FROM drones");
    return res.status(200).send(drones.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({"error occured":`${error}`});
  }
});

// task schedular(every min)
cron.schedule("*/10 * * * * *", () => {
  (async()=>{

    const bat_level = await axios.get('http://localhost:5500/drones/battery_periodic')
    console.log("Battery level after every min", bat_level.data.map(item => item.battery_capacity));
  })()

});

const storage = multer.diskStorage({
  destination: "../public/assets",
  filename: function (req, file, cb) {
    if (
      file.mimetype !== "image/png" &&
      file.mimetype !== "image/jpg" &&
      file.mimetype !== "image/jpeg"
    ) {
      var err = new Error();
      err.code = "filetype";
      return cb(err);
    } else {
      var fileName = crypto.randomBytes(10).toString("hex");
      file.filename = fileName;
      cb(null, fileName + ".jpg");
    }
  },
});

const upload = multer({
  storage: storage,
  limits: { fieldSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb("Only .png, .jpg and .jpeg format allowed!");
    }
  },
}).single("image");


// register drones
router.post("/register", async (req, res) => {
  const { serial_number, model, weight_limit, battery_capacity, state } =
    req.body;

  try {
    const drone = await db.query(
      "INSERT INTO drones(serial_number, model, weight_limit, battery_capacity, state) VALUES($1,$2,$3,$4,$5) RETURNING *",
      [serial_number, model, weight_limit, battery_capacity, state]
    );

    // console.log("Registered drone", drone.rows[0]);
    drone.rows.length > 0 &&
      res
        .status(200)
        .json({
          response: `Drone with seriral number:${serial_number} registered successfully`,
        });
  } catch (error) {
    console.log(error);
    res.status(500).json({"error occured":`${error}`});
  }
});

// load drone with medication items
router.post(
  "/load/:serial_number",
  [upload, photoMiddleware],
  async (req, res) => {
    const { name, weight, code } = req.body;

    try {
      // drone info
      const drone = await db.query('SELECT * from drones WHERE serial_number = $1', [req.params.serial_number])
      
      // validation check on medication schema
      const regex = /[A-Za-z0-9\-\_]+/ ;

      if(regex.test(name) === true){
        
        // check weight limit if exceeded
        if(weight < drone.rows[0].weight_limit === true ){
          const medication = await db.query(
            "INSERT INTO medications(name, weight, code, image, drone) VALUES($1,$2,$3,$4,$5) RETURNING *",
            [name, weight, code, req.image, req.params.serial_number]
          );
    
          // console.log("Loaded medication", medication.rows[0]);
          medication.rows.length > 0 &&
            res.status(200).json({ "response": `Medication with name: ${name} and code: ${code} loaded to drone: ${req.params.serial_number} successfully` });
        }else{
          return res.status(500).send({"error message":`Maximum weight limit of ${drone.rows[0].weight_limit} gr has been exceeded`})
        }

       
      }else{
          return res.status(500).send({"error message":"Name is not correctly typed"})
      }
     
    } catch (error) {
      console.log(error);
      res.status(500).json({"error occured":`${error}`});
    }
  }
);

// check loaded medication items for a given drone
router.get("/check_loaded/:serial_number", async (req, res) => {
  try {
    const loaded = await db.query(
      "SELECT * FROM medications where drone = $1",
      [req.params.serial_number]
    );
    console.log("Loaded", loaded);
    res.status(200).json({ response: loaded.rows });
  } catch (error) {
    console.log(error);
    res.status(500).json({"error occured":`${error}`});
  }
});

// check available drones for loading
router.get("/check_available", async (req, res) => {
  try {
    // join drone and medication table
    const available = await db.query(
      "SELECT * FROM drones WHERE state = 'RETURNING' OR state = 'IDLE'"
    );
    // console.log("Available", available.rows[0]);
    res.status(200).json({ response: available.rows[0] });
  } catch (error) {
    console.log(error);
    res.status(500).json({"error occured":`${error}`});
  }
});

// check battery level for a given drone
router.get("/check_battery/:serial_number", async (req, res) => {
  try {
    const battery_level = await db.query(
      "SELECT * FROM drones WHERE serial_number = $1",
      [req.params.serial_number]
    );
    // console.log("Battery level", battery_level);
    res.status(200).json({ response: battery_level.rows[0].battery_capacity });
  } catch (error) {
    console.log(error);
    res.status(500).json({"error occured":`${error}`});
  }
});

// prevent drone from being in LOADING state if battery is below 25%
router.put('/update/:serial_number', async(req,res)=>{
    const { model, weight_limit, battery_capacity, state } =
    req.body;


  try {

    // check f state is loading and prevent being updated
    if(state === "LOADING"){

      if(battery_capacity > '25%'){
        const update_drone = await db.query("UPDATE drones SET serial_number = $1, model = $2, weight_limit = $3, battery_capacity = $4, state = $5", [req.params.serial_number, model, weight_limit, battery_capacity, state ])
     
        return res.status(200).json({"response":`Drone with serial number:${req.params.serial_number} updated successfully`})
      }else{
        return res.status(500).json({"error message":`Battery level is below 25%, state can't be updated to loading`})
      }
    }else{

      const update_drone = await db.query("UPDATE drones SET serial_number = $1, model = $2, weight_limit = $3, battery_capacity = $4, state = $5", [ req.params.serial_number, model, weight_limit, battery_capacity, state ])
      return res.status(200).json({"response":`Drone with serial number:${req.params.serial_number} updated successfully`})
    }

  } catch (error) {
    console.log(error);
    res.status(500).json({"error occured":`${error}`});
  }
})

module.exports = router;

const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const crypto = require("crypto");
const photoMiddleware = require("../middlewares/photoMiddleware");
const cron = require("node-cron");
const { default: axios } = require("axios");

router.get("/battery_periodic", async (req, res) => {
  try {
    const drones = await db.query("SELECT * FROM drones");
    return res.status(200).send(drones.rows);
  } catch (error) {
    console.log(error);
    res.status(500).send(`An error occured: ${error}`);
  }
});

// task schedular(every min)
cron.schedule("* * * * *", () => {
  // battery_level()
  (async()=>{
    const bat_level = await axios.get('http://localhost:6000/drones/battery_periodic')
    console.log("running a task every 10 seconds", bat_level.data.map(item => item.battery_capacity));
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
    res.status(500).send(`An error occured: ${error}`);
  }
});

// load drone with medication items
router.post(
  "/load/:serial_number",
  [upload, photoMiddleware],
  async (req, res) => {
    const { name, weight, code } = req.body;

  

    try {
      const battery_level = await db.query("SELCT * FROM drones WHERE serial_number = $1", [req.params.serial_number])
      
      const medication = await db.query(
        "INSERT INTO medications(name, weight, code, image, drone) VALUES($1,$2,$3,$4,$5) RETURNING *",
        [name, weight, code, req.image, req.params.serial_number]
      );

      // console.log("Loaded medication", medication.rows[0]);
      medication.rows.length > 0 &&
        res.status(200).send({ response: "Medication loaded successfully" });
    } catch (error) {
      console.log(error);
      res.status(500).send(`An error occured: ${error}`);
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
    res.status(500).send(`An error occured: ${error}`);
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
    res.status(500).send(`An error occured: ${error}`);
  }
});

// check battery level for a given drone
router.get("/check_battery/:serial_number", async (req, res) => {
  try {
    // join drone and medication table
    const battery_level = await db.query(
      "SELECT * FROM drones WHERE serial_number = $1",
      [req.params.serial_number]
    );
    // console.log("Battery level", battery_level);
    res.status(200).json({ response: battery_level.rows[0].battery_capacity });
  } catch (error) {
    console.log(error);
    res.status(500).send(`An error occured: ${error}`);
  }
});

module.exports = router;

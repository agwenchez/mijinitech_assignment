const { Router } = require("express");
const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require('multer')
const crypto = require('crypto')

const storage = multer.diskStorage({
  destination: '../public/assets',
  filename: function (req, file, cb) {
      if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpg' && file.mimetype !== 'image/jpeg') {
          var err = new Error();
          err.code = 'filetype';
          return cb(err);
      } else {
          var fileName = crypto.randomBytes(10).toString('hex');;
          file.filename = fileName;
          cb(null, fileName + '.jpg');
      }
  }
});

// test route
router.get("/all", async (req, res) => {
  try {
    const drones = await db.query("SELECT * FROM drones");
    res.status(200).send(drones.rows);
  } catch (error) {
    console.log(error);
    res.status(500).send(`An error occured: ${error}`);
  }
});

// register drones
router.post("/register", async (req, res) => {
  const { serial_number, model, weight_limit, battery_capacity, state } =
    req.body;
  try {
    const drone = await db.query(
      "INSERT INTO drones(serial_number, model, weight_limit, battery_capacity, state) VALUES($1,$2,$3,$4,$5) RETURNING *",
      [serial_number, model, weight_limit, battery_capacity, state]
    );

    // console.log("Registered drone", drone);
    drone.rows.length > 0 && res.status(200).json({response:`Drone with seriral number:${serial_number} registered successfully`});
  } catch (error) {
    console.log(error);
    res.status(500).send(`An error occured: ${error}`);
  }
});

// load drone with medication items
router.post("/load/:serial_number", async (req, res) => {
  const { name, weight, code, image } = req.body;

  try {
    const medication = await db.query(
      "INSERT INTO medication(name, weight, code, image, drone) VALUES($1,$2,$3,$4,$5) RETURNING *",
      [name, weight, code, image, req.params.serial_number]
    );

    console.log("Loaded medication", medication.rows[0]);
    res.status(200).send(medication.rows[0]);
    
  } catch (error) {
    console.log(error);
    res.status(500).send(`An error occured: ${error}`);
  }
});

// check loaded medication items for a given drone
router.get("/check_loaded/:serial_number", async (req, res) => {
  try {
    // join drone and medication table
    const loaded = await db.query("SELECT * FROM drones");
    console.log("Loaded", loaded);
    res.status(200).send(loaded.rows);
  } catch (error) {
    console.log(error);
    res.status(500).send(`An error occured: ${error}`);
  }
});

// check available drones for loading
router.get("/check_available", async (req, res) => {
  try {
    // join drone and medication table
    const loaded = await db.query("SELECT * FROM drones WHERE state != LOADED");
    console.log("Loaded", loaded);
    res.status(200).send(loaded.rows);
  } catch (error) {
    console.log(error);
    res.status(500).send(`An error occured: ${error}`);
  }
});


module.exports = router;

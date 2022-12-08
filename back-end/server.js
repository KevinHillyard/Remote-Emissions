const express = require('express');
const bodyParser = require("body-parser");
const app = express();
const mongoose = require('mongoose');
var fs = require('fs');

mongoose.connect('mongodb://localhost:27017/remote-emissions', {
  useUnifiedTopology: true,
  useNewUrlParser: true
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

var options = {
  key: fs.readFileSync('client-key.pem'),
  cert: fs.readFileSync('client-cert.pem')
};

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, GET, DELETE");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const Active = mongoose.model("Active", {
  username: String
})

const Car = mongoose.model("Car", {
  vin: String,
  plate: String,
  username: String
});

const User = mongoose.model("User", {
  username: String,
  password: String,
  email: String
});

const Appt = mongoose.model("Appt", {
    day: Number,
    month: String,
    year: Number,
    plate: String,
    username: String
});

app.get('/api/getcars/:username', async (req, res) => {
  console.log("Entered getcars api");
  try {
      req.params.username
    let cars = await Car.find({ username: { $eq: req.params.username } });
    console.log(cars);
    res.send({
      cars: cars
    });
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

app.get('/api/getappts/:username', async (req, res) => {
  console.log("Entered getappts api");
  try {
    let appts = await Appt.find({ username: { $eq: req.params.username } });
    console.log(appts);
    res.send({
      appts: appts
    });
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

app.post('/api/addcar/:vin/:plate/:username', async (req, res) => {
  console.log("Entered addcar api");
  let cars = await Car.find({ username: { $eq: req.params.username } });
  let oldcar = cars.find(element => element.plate === req.params.plate);
  if (oldcar != undefined) {
    console.log("Duplicate Car");
    res.sendStatus(422);
  }
  else {
      const carObj = new Car({
        vin: req.params.vin,
        plate: req.params.plate,
        username: req.params.username
      });
      console.log(carObj);
      try {
        await carObj.save();
        res.send({
          car: carObj
        });
      } catch (error) {
        console.log(error);
        res.sendStatus(500);
      }
  }
});

app.post('/api/setappt/:day/:month/:year/:plate/:username', async (req, res) => {
  console.log("Entered setappt api");
  console.log(req.params.username);
  let appts = await Appt.find({ username: { $eq: req.params.username } });
  console.log(appts);
  let oldAppt = appts.find(element => element.plate === req.params.plate);
  console.log(oldAppt);
  if (oldAppt != undefined) {
    console.log("Entered delete");
    await Appt.deleteMany({
      plate: req.params.plate
    });
  }
  const apptObj = new Appt({
      day: req.params.day,
      month: req.params.month,
      year: req.params.year,
      plate: req.params.plate,
      username: req.params.username
  });
  console.log(apptObj);
  try {
    await apptObj.save();
    res.send({
      appt: apptObj
    });
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
  
});

app.post('/api/login/:password/:username', async (req, res) => {
    console.log("Entered login api");
    let password = req.params.password;
    let username = req.params.username;
    let user = await User.findOne({
        username: username,
        password: password
    });
    const activeObj = new Active({
        username: username
    });
    if (user != undefined) {
        await activeObj.save();
        res.sendStatus(200);
    }
    else {
        res.sendStatus(400);
    }
});

app.post('/api/signup/:password/:email/:username', async (req, res) => {
    console.log("Entered signup api");
    let password = req.params.password;
    let username = req.params.username;
    let email = req.params.email;
    let user = await User.findOne({
        username: username
    });
    if (user != undefined) {
        res.sendStatus(403);
    }
    else {
        const userObj = new User({
            username: username,
            password: password,
            email: email
        });
        const activeObj = new Active({
            username: username
        });
        try {
            await userObj.save();
            await activeObj.save();
            res.send({
            user: userObj
            });
        } catch (error) {
            console.log(error);
            res.sendStatus(500);
        }
    }
});

app.get('/api/loggedin/:username', async (req, res) => {
  console.log("Entered loggedin api");
  if (req.params.username === "") {
    res.sendStatus(203);
    return;
  }
  try {
    let active = await Active.findOne({
      username: req.params.username
    });
    if (active != undefined) {
      res.sendStatus(200);
    }
    else {
      res.sendStatus(203);
    }
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

app.delete('/api/logout/:username', async (req, res) => {
  console.log("Entered logout api");
  try {
    await Active.deleteMany({
      username: req.params.username
    })
    res.sendStatus(200);
  } catch (error) {
    console.log(error);
    res.sendStatus(500);
  }
});

app.listen(3000, () => console.log('Server listening on port 3000!'));
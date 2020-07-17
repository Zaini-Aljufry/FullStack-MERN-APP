const express = require("express");
const bodyParser = require("body-parser");
const placesRouter = require("./routes/places");
const usersRouter = require("./routes/users");
const HttpError = require("./models/http-error");
const mongoose = require("mongoose");
const cors = require('cors')
const fs = require('fs')
const path = require('path')
require('dotenv').config()


const app = express();

const port = process.env.PORT || 5000;


app.use(bodyParser.json());
app.use(cors())

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use('/uploads/images/',express.static(path.join('uploads','images')))

app.use(express.static(path.join(__dirname,'public')))

app.use("/api/places", placesRouter);
app.use("/api/users", usersRouter);

app.use((req,res,next)=>{
  res.sendFile(path.resolve(__dirname,'public','index.html'))
})

app.use((err, req, res, next) => {
  if(req.file){
    fs.unlink(req.file.path, (error) => {
      console.log(error,"here is the error")
    });
  }
  if (res.headerSent) {
    return next(err);
  }
  res
    .status(err.code || 500)
    .json({ message: err.message || "An unkown error has occure" });
});

const connectUrl =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.c8gdx.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const connectConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
};

mongoose
  .connect(connectUrl, connectConfig)
  .then(() => {
    app.listen(port, () => {
      console.log(`Listening to Port ${port}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });

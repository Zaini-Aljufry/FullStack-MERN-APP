const express = require("express");
const HttpError = require("../models/http-error");
const { validationResult } = require("express-validator");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//#region  Get Controllers
const getUsers = async (req, res, next) => {
  try {
    let users = await User.find({}, "-password");

    if (!users) {
      const error = new HttpError("No users found", 404);
      return next(error);
    }

    return res
      .status(200)
      .json({ users: users.map((user) => user.toObject({ getters: true })) });
  } catch (err) {
    const error = new HttpError(
      "Unable to fetch Users, PLease try again later",
      500
    );
    return next(error);
  }
};
//#endregion

//#region Post Controllers
const signup = async (req, res, next) => {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    console.log(err);
    return next(
      new HttpError(`Invalid input passed,Please check your data`, 422)
    );
  }

  const { name, email, password } = req.body;

  try {
    let existingUser = await User.findOne({ email });

    if (existingUser) {
      const error = new HttpError(
        "User credential already exist, Please Log in instead",
        422
      );
      return next(error);
    }

    const hashed = await bcrypt.hash(password, 8);

    const newUser = new User({
      name,
      email,
      password: hashed,
      image: req.file.path,
      places: [],
    });

    await newUser.save();
    const token = await jwt.sign(
      { userId: newUser.id, email: newUser.email, name: newUser.name },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
    return res.status(201).json({userId: newUser.id, email: newUser.email, token });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Sign Up failed, PLease try again later", 500);
    return next(error);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    let existingUser = await User.findOne({ email });

    if (!existingUser) {
      const error = new HttpError("Invalid credential, Please try again", 401);
      return next(error);
    }

    const isValidPass = await bcrypt.compare(password, existingUser.password);

    if (!isValidPass) {
      const error = new HttpError("Invalid credential, Please try again", 401);
      return next(error);
    }

    const token = await jwt.sign(
      { userId: existingUser.id, email: existingUser.email, name: existingUser.name },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: `${existingUser.name} is logged in`,
      userId: existingUser.id, 
      email: existingUser.email, 
      token: token
    });
  } catch (err) {
    const error = new HttpError("Log in failed, PLease try again later", 500);
    return next(error);
  }
};
//#endregion

module.exports = {
  getUsers: getUsers,
  signup: signup,
  login: login,
};

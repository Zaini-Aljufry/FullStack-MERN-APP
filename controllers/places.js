const express = require("express");
const HttpError = require("../models/http-error");
const { v4: uuid } = require("uuid");
const { validationResult } = require("express-validator");
const getCoordsForAddress = require("../utils/location");
const Place = require("../models/place");
const User = require("../models/user");
const mongoose = require("mongoose");
const fs = require('fs')

//#region  Get Controllers
const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId);
    if (!place) {
      const error = new HttpError(
        "Could not find a place for the provided id",
        404
      );
      return next(error);
    }

    return res.json({ place: place.toObject({ getters: true }) });
  } catch (err) {
    const error = new HttpError("Failed to find place,please try again", 500);
    return next(error);
  }
};

const getPlacesByUid = async (req, res, next) => {
  const usersId = req.params.uid;

  let UserWithplaces;
  try {
    UserWithplaces = await User.findById(usersId).populate("places");

    if (!UserWithplaces || UserWithplaces.places.length === 0) {
      return next(
        new HttpError("Could not find a place for the provided  user id", 404)
      );
    }

    return res.json({
      places: UserWithplaces.places.map((place) =>
        place.toObject({ getters: true })
      ),
    });
  } catch (err) {
    const error = new HttpError("Failed to find place,please try again", 500);
    return next(error);
  }
};
//#endregion

//#region Post Controllers
const createPlace = async (req, res, next) => {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    return next(
      new HttpError(`Invalid input passed,Please check your data`, 422)
    );
  }

  const { title, description, address } = req.body;
  let coordinates;
  let user;

  try {
    coordinates = await getCoordsForAddress(address);
    const createdPlace = new Place({
      title,
      description,
      address,
      location: coordinates,
      image: req.file.path,
      creator: req.userData.userId,
    });
    user = await User.findById(req.userData.userId);
    if (!user) {
      const error = new HttpError(
        "Unable to find user of particular ID,please try again",
        500
      );
      return next(error);
    }
    const session = await mongoose.startSession();
    session.startTransaction();
    await createdPlace.save({ session });
    user.places.push(createdPlace);
    await user.save({ session });
    await session.commitTransaction();

    return res.status(201).json({ place: createdPlace });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Failed to create place,please try again", 500);
    return next(error);
  }
};
//#endregion

//#region Patch Controllers
const editPlace = async (req, res, next) => {
  const err = validationResult(req);
  if (!err.isEmpty()) {
    console.log(err);
    return next(
      new HttpError(`Invalid input passed,Please check your data`, 422)
    );
  }

  const placeId = req.params.pid;
  const { title, description, address } = req.body;

  let coordinates;
  let place;
  try {
    coordinates = await getCoordsForAddress(address);
    place = await Place.findById(placeId);

    if (!place) {
      const error = new HttpError(
        "Could not find a place for the provided id",
        404
      );
      return next(error);
    }
    if(place.creator.toString() !== req.userData.userId){
      return next( new HttpError(
        'You are not allowed to edit thuis place',401
      ))
    }
    if (address.length === 0) {
      place.title = title;
      place.description = description;
    } else {
      place.title = title;
      place.description = description;
      place.address = address;
      place.location = coordinates;
    }

    await place.save();

    return res.json({ place: place.toObject({ getters: true }) }).status(200);
  } catch (err) {
    const error = new HttpError("Failed to update place,please try again", 500);
    return next(error);
  }
};
//#endregion

//#region Delete Controllers
const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;
  try {
    const place = await Place.findById(placeId).populate("creator");
    

    if (!place) {
      const error = new HttpError(
        "Failed to find place for provided id,please try again",
        404
      );
      return next(error);
    }

    if(place.creator.id !== req.userData.userId){
      return next(new HttpError(
        'You are not allowed to delete this place',401
      ))
    }

    const imagePath = place.image

    const session = await mongoose.startSession();
    session.startTransaction();
    await place.remove({ session });
    place.creator.places.pull(place);
    await place.creator.save({ session });
    await session.commitTransaction();

    fs.unlink(imagePath,err=>{
      console.log(err)
    })
    return res.status(200).json({ message: "Place has been Deleted" });
  } catch (err) {
    console.log(err);
    const error = new HttpError("Failed to delete place,please try again", 500);
    return next(error);
  }
};
//#endregion

module.exports = {
  getPlaceById: getPlaceById,
  getPlacesByUid: getPlacesByUid,
  createPlace: createPlace,
  editPlace: editPlace,
  deletePlace: deletePlace,
};

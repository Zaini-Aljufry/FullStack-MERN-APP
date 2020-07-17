const jwt = require("jsonwebtoken");
const HttpError = require("../models/http-error");

module.exports = (req, res, next) => {
  try {
    if (req.method === "OPTIONS") {
        return next();
      }
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
      throw new Error("Authentication Failed");
    }
    const decode = jwt.verify(token, process.env.JWT_KEY);
    req.userData = { userId: decode.userId };
    next();
  } catch (err) {
    return next(new HttpError("Authentication Failed", 401));
  }
};

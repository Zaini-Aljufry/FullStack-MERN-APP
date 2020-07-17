const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const { getUsers, signup, login } = require("../controllers/users");
const fileUpload = require("../middleware/file-upload");

//#region Get routes
router.get("/", getUsers);
//#endregion

//#region Post routes
router.post(
  "/signup",
  fileUpload.single("image"),
  [
    check("name").not().isEmpty(),
    check("email").normalizeEmail().isEmail(),
    check("password").isLength({ min: 6 }),
  ],
  signup
);

router.post("/login", login);
//#endregion

module.exports = router;

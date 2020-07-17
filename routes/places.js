const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const fileUpload = require('../middleware/file-upload')
const checkAuth = require('../middleware/auth')
const {
  getPlaceById,
  getPlacesByUid,
  createPlace,
  editPlace,
  deletePlace,
} = require("../controllers/places");

//#region Get routes
router.get("/", (req, res) => {
  res.json({ message: "it works" });
});

router.get("/:pid", getPlaceById);

router.get("/user/:uid", getPlacesByUid);
//#endregion

router.use(checkAuth)

//#region Post routes
router.post(
  "/",
  fileUpload.single('image'),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  createPlace
);
//#endregion

//#region Patch routes
router.patch(
  "/:pid",
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  editPlace
);
//#endregion

//#region Delete routes
router.delete("/:pid", deletePlace);
//#endregion

module.exports = router;

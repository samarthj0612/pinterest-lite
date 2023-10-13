var express = require("express");
var router = express.Router();
var userModel = require("../models/users");
var designModel = require("../models/designs");
var passport = require("passport");
var multer = require("multer");

const localStrategy = require("passport-local");
passport.use(
  new localStrategy(
    {
      usernameField: "email",
    },
    userModel.authenticate()
  )
);

function fileFilter(req, file, cb) {
  if (
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/webp" ||
    file.mimetype === "image/png"
  ) {
    cb(null, true);
  } else {
    cb(new Error("file extension is invalid"));
  }
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/designs");
  },
  filename: function (req, file, cb) {
    const fn = Date.now() + Math.floor(Math.random() * 10000) + file.originalname;
    cb(null, fn);
  },
});

const upload = multer({ storage: storage, fileFilter: fileFilter });

router.get("/", function (req, res, next) {
  res.render("index");
});

router.post("/register", function (req, res) {
  if (req.body.password === req.body.confirmpassword) {
    var userData = new userModel({
      username: req.body.username,
      email: req.body.email,
    });

    userModel
      .register(userData, req.body.password)
      .then(function (registeredUser) {
        passport.authenticate("local")(req, res, function () {
          res.redirect("/home");
        });
      })
      .catch(function (err) {
        res.redirect("/login");
      });
  } else {
    res.redirect("/");
  }
});

router.get("/login", function (req, res) {
  res.render("login");
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/",
  }),
  function (req, res, next) {}
);

router.get("/home", isLoggedIn, function (req, res) {
  userModel.findOne({ email: req.session.passport.user }).then(function (user) {
    designModel.find().then(function (designs) {
      res.render("home", { user: user, designs: designs });
    });
  });
});

router.post( "/upload", isLoggedIn, upload.single("design"), async function (req, res) {
  var loggedInUser = await userModel.findOne({
    email: req.session.passport.user,
  });

  var designData = await designModel.create({
    title: req.body.title,
    description: req.body.description,
    design: req.file.filename,
    owner: loggedInUser._id,
  });

  loggedInUser.designs.push(designData._id);
  loggedInUser.save();
  res.redirect("/home");
});

router.get("/addtofavourites/:designid", isLoggedIn, function (req, res) {
  userModel.findOne({ email: req.session.passport.user }).then(function (user) {
    designModel.findOne({ _id: req.params.designid }).then(function (design) {
      user.favourites.push(design._id);
      user.save();
      res.redirect(req.headers.referer);
    });
  });
});

router.get("/removefromfavourites/:designid", isLoggedIn, function (req, res) {
  userModel.findOne({ email: req.session.passport.user }).then(function (user) {
    designModel.findOne({ _id: req.params.designid }).then(function (design) {
      user.favourites.remove(design._id);
      user.save();
      res.redirect(req.headers.referer);
    });
  });
});

router.get("/favourites", isLoggedIn, function (req, res) {
  userModel
    .findOne({ email: req.session.passport.user })
    .populate("favourites")
    .then(function (user) {
      res.render("favourite", { user: user });
    });
});

router.get("/owndesigns", isLoggedIn, function (req, res) {
  userModel
    .findOne({ email: req.session.passport.user })
    .populate("designs")
    .then(function (user) {
      res.render("design", { user: user });
    });
});

router.get("/delete/:designid", isLoggedIn, function (req, res) {
  userModel.findOne({ email: req.session.passport.user }).then(function (user) {
    designModel
      .findOneAndDelete({ _id: req.params.designid })
      .then(function (design) {
        user.designs.remove(design._id);
        user.save();
        res.redirect(req.headers.referer);
      });
  });
});

router.get("/logout", isLoggedIn, function (req, res, next) {
  req.logOut(function (err) {
    if (err) throw err;
    res.redirect("/login");
  });
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated) {
    return next();
  } else {
    res.redirect("/login");
  }
}

module.exports = router;

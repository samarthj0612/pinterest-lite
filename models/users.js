var mongoose = require("mongoose");
var plm = require("passport-local-mongoose");
mongoose.connect("mongodb://localhost/pinterest");

var userSchema = mongoose.Schema({
  username: String,
  email: String,
  password: String,
  designs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "design",
    },
  ],
  favourites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "design",
    },
  ],
});

userSchema.plugin(plm, { usernameField: "email" });

module.exports = mongoose.model("user", userSchema);

var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/pinterest");

var designSchema = mongoose.Schema({
  title: String,
  description: String,
  design: {
    type: String,
    default: "def.jpg",
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
});

module.exports = mongoose.model("design", designSchema);

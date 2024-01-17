const mongoose = require("mongoose");
const uuid = require("uuid");

const FormDataSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  randomId: {
    type: String,
    default: () => uuid.v4(), // Generate a random ID using uuid
  },
});

const FormDataModel = mongoose.model("log_reg_form", FormDataSchema);

module.exports = FormDataModel;

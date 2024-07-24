const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position: { type: String, required: true },
  email: { type: String, required: true, unique: true }
});

const Staff = mongoose.model('Staff', staffSchema);

module.exports = Staff;

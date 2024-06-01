const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  userId: String,
  targetPrice: Number,
  direction: String,
  notified: { type: Boolean, default: false },
});

module.exports = mongoose.model("alerts", alertSchema);

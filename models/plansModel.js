const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    maxMessages: { type: Number, default: 100 }, // Message count limit
    maxMessageSize: { type: Number, default: 1000 }, // Total size limit in KB
    duration: { type: Number, required: true }, // Duration in days
    questions: { type: Number, required: true },
    includesRemedies: { type: Boolean, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plan", planSchema);

// src/models/log.model.js
const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userEmail: { type: String },
  action: { type: String, required: true }, // e.g. "SCAN_ASSET", "LOGIN", "EXPORT_REPORT"
  target: { type: String },                 // e.g. asset ID or audit ID
  detail: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now },
});

logSchema.index({ userId: 1 });
logSchema.index({ action: 1 });
logSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Log", logSchema);

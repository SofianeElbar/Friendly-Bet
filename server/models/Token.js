const mongoose = require("mongoose");

const tokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  betId: { type: mongoose.Schema.Types.ObjectId, ref: "Bet", required: true },
  expiresAt: { type: Date, required: true },
});

module.exports = mongoose.model("Token", tokenSchema);

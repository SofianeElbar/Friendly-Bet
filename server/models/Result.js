const mongoose = require("mongoose");

const resultSchema = new mongoose.Schema({
  matchId: { type: String, required: true }, // Identifiant unique du match
  score: { type: String }, // Score réel (par exemple, "3-2")
  // Autres champs liés aux résultats (par exemple, buts, cartons, etc.)
});

module.exports = mongoose.model("Result", resultSchema);

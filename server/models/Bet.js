const mongoose = require("mongoose");

const betSchema = new mongoose.Schema({
  initiator: { type: String, required: true }, // Utilisateur ayant initié le pari
  betType: {
    type: String,
    enum: ["match", "matchDay"],
    required: true,
  },
  match: {
    teams: { type: String }, // Nom des deux équipes qui s'affrontent
    finalScore: { type: String }, // Score prédit (par exemple, "2-1")
    winTeam: { type: String }, // Équipe gagnante prédite (par exemple, "Domicile" ou "Extérieur")
    nberGoals: { type: Number }, // Nombre de buts inscrits lors de la rencontre
    nberYcards: { type: Number }, // Nombre de cartons jaunes lors de la rencontre
    matchDate: { type: Date }, // Date et heure du match
    // Autres détails pertinents sur le match (par exemple, lieu, arbitre, etc.)
  },
  matchDay: {
    goals: { type: Number }, // Nombre total de buts prédits (pour les paris quotidiens)
    yellowCards: { type: Number }, // Nombre total de cartons jaunes prédits (pour les paris quotidiens)
    redCards: { type: Number }, // Nombre total de cartons rouges prédits (pour les paris quotidiens)
    cleanSheets: { type: Number }, // Nombre total de clean sheets prédits (pour les paris quotidiens)
  },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Participants au pari
  stakes: { type: Number, required: true }, // Montant de la mise
});

module.exports = mongoose.model("Bet", betSchema);

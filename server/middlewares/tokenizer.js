const crypto = require("crypto");
const Token = require("../models/Token");

function generateToken() {
  return crypto.randomBytes(16).toString("hex");
}

async function saveToken(token, betId, expirationTime) {
  const tokenEntry = new Token({
    token: token,
    betId: betId,
    expiresAt: expirationTime,
  });

  await tokenEntry.save();
}

async function verifyToken(token) {
  const tokenEntry = await Token.findOne({ token });

  if (tokenEntry && tokenEntry.expiresAt > new Date()) {
    return {
      betId: tokenEntry.betId,
      isValid: true,
    };
  } else {
    return {
      betId: null,
      isValid: false,
    };
  }
}

module.exports = { generateToken, saveToken, verifyToken };

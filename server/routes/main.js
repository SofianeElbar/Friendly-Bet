const express = require("express");
const router = express.Router();
const axios = require("axios");
const Bet = require("../models/Bet");
const User = require("../models/User");
const Token = require("../models/Token");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  generateToken,
  saveToken,
  verifyToken,
} = require("../middlewares/tokenizer");
const apiKey = process.env.API_TOKEN;

/**
 * GET /
 * App routes
 */

router.get("/betchoice", (req, res) => {
  try {
    // Destroy the current session to clear all data
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return;
      }
      res.render("betchoice");
    });
  } catch (error) {
    console.error("Error handling bet choice:", error);
  }
});

router.get("/betgame", async (req, res) => {
  try {
    // Fetch matches from the API
    const response = await axios.get(
      `https://api.football-data.org/v4/competitions/PL/matches`,
      {
        headers: {
          "X-Auth-Token": apiKey,
        },
      }
    );

    // Store matches data
    const data = response.data.matches;

    // Get the current date and time
    const currentDate = new Date();

    // Group matches by matchday
    const matchesByMatchday = data.reduce((groupedMatches, match) => {
      const matchday = match.matchday;
      const matchDate = new Date(match.utcDate);

      // If the match is in the future
      if (matchDate > currentDate) {
        // Add match to the corresponding matchday
        if (!groupedMatches[matchday]) {
          groupedMatches[matchday] = [];
        }
        groupedMatches[matchday].push(match);
      }

      return groupedMatches;
    }, {});

    // Find the matchday with the earliest next matches to be played
    let earliestMatchday = null;
    let earliestMatchDate = Infinity;

    for (const [matchday, matches] of Object.entries(matchesByMatchday)) {
      // Find the earliest match date within the current matchday
      const earliestDateInMatchday = Math.min(
        ...matches.map((match) => new Date(match.utcDate))
      );

      // Check if this is the earliest date across all matchdays
      if (earliestDateInMatchday < earliestMatchDate) {
        earliestMatchday = matchday;
        earliestMatchDate = earliestDateInMatchday;
      }
    }

    // If there is an earliest matchday
    if (earliestMatchday !== null) {
      // Get the matches for the matchday with the earliest next matches to be played
      const matchesForEarliestMatchday = matchesByMatchday[earliestMatchday];

      // Render the page with the matches for the matchday with the earliest next matches to be played
      res.render("betgame", {
        matches: matchesForEarliestMatchday,
        matchday: earliestMatchday,
      });
    } else {
      // Render a message if there are no upcoming matches
      res.render("betgame", { message: "There are no upcoming matches." });
    }
  } catch (error) {
    console.error("Error fetching Premier League matches:", error);
    res.render("betgame", { message: "Error fetching matches." });
  }
});

router.get("/betype", (req, res) => {
  try {
    const betData = req.session.betData;

    if (!betData || !betData.match || !betData.match.gameChoice) {
      return res.status(404).send("Bet data not found");
    }

    res.render("betype", { betData });
  } catch (error) {
    console.error("Error rendering betype page:", error);
  }
});

router.get("/betfs", (req, res) => {
  try {
    const betData = req.session.betData;

    if (!betData || !betData.match || !betData.match.gameChoice) {
      return res.status(404).send("Bet data not found");
    }

    res.render("betfs", { betData });
  } catch (error) {
    console.error("Error rendering betype page:", error);
  }
});

router.get("/betwt", (req, res) => {
  try {
    const betData = req.session.betData;

    if (!betData || !betData.match || !betData.match.gameChoice) {
      return res.status(404).send("Bet data not found");
    }

    res.render("betwt", { betData });
  } catch (error) {
    console.error("Error rendering betype page:", error);
  }
});

router.get("/betgoals", (req, res) => {
  try {
    const betData = req.session.betData;

    if (!betData || !betData.match || !betData.match.gameChoice) {
      return res.status(404).send("Bet data not found");
    }

    res.render("betgoals", { betData });
  } catch (error) {
    console.error("Error rendering betype page:", error);
  }
});

router.get("/betycards", (req, res) => {
  try {
    const betData = req.session.betData;

    if (!betData || !betData.match || !betData.match.gameChoice) {
      return res.status(404).send("Bet data not found");
    }

    res.render("betycards", { betData });
  } catch (error) {
    console.error("Error rendering betype page:", error);
  }
});

router.get("/betmatchd", (req, res) => {
  res.render("betmatchd");
});

router.get("/betmatchdg", (req, res) => {
  res.render("betmatchdg");
});

router.get("/betmatchdy", (req, res) => {
  res.render("betmatchdy");
});

router.get("/betmatchdr", (req, res) => {
  res.render("betmatchdr");
});

router.get("/betclean", (req, res) => {
  res.render("betclean");
});

router.get("/yourbet", (req, res) => {
  res.render("yourbet");
});

router.get("/invite", authMiddleware, async (req, res) => {
  try {
    const { action, betId } = req.query;

    // Check if the user is requesting to generate a token
    if (action === "generateToken" && betId) {
      const bet = await Bet.findById(betId);
      if (!bet) {
        return res.status(404).send("Bet not found.");
      }

      // Generate a token and save it
      const token = generateToken();
      const expirationTime = new Date();
      expirationTime.setHours(expirationTime.getHours() + 2);

      await saveToken(token, betId, expirationTime);

      // Redirect to the invite page with the token in the URL
      return res.redirect(`/invite?token=${token}`);
    }

    // If the token is already present in the URL, render the invite page
    const { token } = req.query;
    if (token) {
      res.render("invite", {
        title: "Invite Friends",
        token,
      });
    } else {
      res.status(400).send("Invalid request.");
    }
  } catch (error) {
    console.error("Error handling invite GET request:", error);
    res.status(500).send("An error occurred while loading the invite page.");
  }
});

// router.get("/join", async (req, res) => {
//   try {
//     const { token } = req.query;

//     const tokenEntry = verifyToken(token);

//     const userId = req.userId;
//     if (!userId) {
//       return res.redirect(`/joinlogin?token=${token}`);
//     }

//     const data = await Bet.findById(tokenEntry.betId).populate("participants");
//     if (!data) {
//       return res.status(404).send("Bet not found.");
//     }

//     res.render("admin/join", { data, userId });
//   } catch (error) {
//     console.error("Error handling /join GET request:", error);
//     res.status(500).send("An error occurred while loading the join page.");
//   }
// });

module.exports = router;

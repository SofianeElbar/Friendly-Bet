const express = require("express");
const router = express.Router();
const axios = require("axios");
const Bet = require("../models/Bet");
const User = require("../models/User");
const apiKey = process.env.API_TOKEN;
const moment = require("moment-timezone");

/**
 * GET /
 * App routes
 */

router.get("/betchoice", (req, res) => {
  res.render("betchoice");
});

router.get("/betgame", async (req, res) => {
  try {
    // Fetch matches
    const response = await axios.get(
      `https://api.football-data.org/v4/competitions/PL/matches`,
      {
        headers: {
          "X-Auth-Token": apiKey,
        },
      }
    );

    const data = response.data;

    // Extract the current matchday from one of the matches
    const currentMatchday =
      data.matches.length > 0 ? data.matches[0].season.currentMatchday : 1;

    // Filter out matches of the current matchday that have not started yet
    const currentDate = new Date();
    const upcomingMatches = data.matches.filter(
      (match) =>
        match.matchday === currentMatchday &&
        new Date(match.utcDate) > currentDate
    );

    // If there are no upcoming matches for the current matchday, switch to the next matchday
    if (upcomingMatches.length === 0) {
      const nextMatchday = currentMatchday + 1;

      // Make a new API request with the next matchday
      const nextMatchdayResponse = await axios.get(
        `https://api.football-data.org/v4/competitions/PL/matches?matchday=${nextMatchday}`,
        {
          headers: {
            "X-Auth-Token": apiKey,
          },
        }
      );

      console.log("Next matchday response data:", nextMatchdayResponse.data);

      // Filter out matches of the next matchday that have not started yet
      const nextMatchdayMatches = nextMatchdayResponse.data.matches.filter(
        (match) => new Date(match.utcDate) > currentDate
      );

      // If there are no upcoming matches for the next matchday/end of the season
      if (nextMatchdayMatches.length === 0) {
        res.render("betgame", { message: "There are no upcoming matches." });
      } else {
        // Render the page with the matches of the next matchday
        res.render("betgame", { matches: nextMatchdayMatches });
      }
    } else {
      // Render the page with the upcoming matches of the current matchday
      res.render("betgame", { matches: upcomingMatches });
    }
  } catch (error) {
    console.error("Error fetching Premier League matches:", error);
  }
});

// router.get("/betgame", async (req, res) => {
//   try {
//     const response = await axios.get(
//       "https://api.football-data.org/v4/competitions/PL/matches?matchday=35",
//       {
//         headers: {
//           "X-Auth-Token": apiKey,
//         },
//       }
//     );

//     const data = response.data;
//     const matches = data.matches.map((match) => {
//       const matchDate = new Date(match.utcDate);
//       const formattedTime = matchDate.toLocaleTimeString("en-GB", {
//         hour: "numeric",
//         minute: "numeric",
//       });
//       const currentDate = matchDate.toDateString();
//       return {
//         ...match,
//         formattedTime,
//         currentDate,
//       };
//     });

//     res.render("betgame", { matches });
//   } catch (error) {
//     console.error("Error fetching Premier League matches:", error);
//   }
// });

router.get("/betype", (req, res) => {
  res.render("betype");
});

router.get("/betfs", (req, res) => {
  res.render("betfs");
});

router.get("/betwt", (req, res) => {
  res.render("betwt");
});

router.get("/betgoals", (req, res) => {
  res.render("betgoals");
});

router.get("/betycards", (req, res) => {
  res.render("betycards");
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

// function insertUserData() {
//   User.insertMany([
//     {
//       username: "Sofiane",
//     },
//     {
//       username: "Ryan",
//     },
//     {
//       username: "Arslan",
//     },
//   ]);
// }
// insertUserData();

// async function insertBetData() {
//   try {
//     // Récupérez les ID des participants (par exemple, Sofiane, Ryan, Arslan)
//     const sofiane = await User.findOne({ username: "Sofiane" });
//     const ryan = await User.findOne({ username: "Ryan" });
//     const arslan = await User.findOne({ username: "Arslan" });

//     const bet = new Bet({
//       initiator: sofiane._id,
//       betType: "match",
//       match: {
//         teams: "Manchester UTD - Chelsea",
//         finalScore: "2-1",
//       },
//       participants: [sofiane._id, ryan._id, arslan._id],
//       stakes: 10,
//     });

//     await bet.save();
//     console.log("Pari inséré avec succès !");
//   } catch (error) {
//     console.error("Erreur lors de l'insertion du pari :", error);
//   }
// }
// insertBetData();

/**
 * GET /
 * Bet :id
 */

// router.get("/bet/:id", async (req, res) => {
//   try {
//     let slug = req.params.id;

//     const data = await Bet.findById({ _id: slug }).populate("participants");

//     const locals = {
//       betType: data.betType,
//       participants: data.participants,
//       stakes: data.stakes,
//     };

//     res.render("bet", {
//       locals,
//       data,
//       currentRoute: `/bet/${slug}`,
//     });
//   } catch (error) {
//     console.log(error);
//   }
// });

/**
 * GET /
 * User :id
 */

// router.get("/user/:id", async (req, res) => {
//   try {
//     let slug = req.params.id;

//     const data = await User.findById({ _id: slug });

//     res.render("user", {
//       locals,
//       data,
//       currentRoute: `/user/${slug}`,
//     });
//   } catch (error) {
//     console.log(error);
//   }
// });

module.exports = router;

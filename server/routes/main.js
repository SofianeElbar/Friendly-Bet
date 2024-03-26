const express = require("express");
const router = express.Router();
const Bet = require("../models/Bet");
const User = require("../models/User");

// router.get("/modal", async (req, res) => {
//   try {
//   } catch (error) {}

//   res.render("modal");
// });

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

router.get("/bet/:id", async (req, res) => {
  try {
    let slug = req.params.id;

    const data = await Bet.findById({ _id: slug }).populate("participants");

    const locals = {
      betType: data.betType,
      participants: data.participants,
      stakes: data.stakes,
    };

    res.render("bet", {
      locals,
      data,
      currentRoute: `/bet/${slug}`,
    });
  } catch (error) {
    console.log(error);
  }
});

/**
 * GET /
 * User :id
 */

router.get("/user/:id", async (req, res) => {
  try {
    let slug = req.params.id;

    const data = await User.findById({ _id: slug });

    res.render("user", {
      locals,
      data,
      currentRoute: `/user/${slug}`,
    });
  } catch (error) {
    console.log(error);
  }
});

router.get("/betchoice", (req, res) => {
  res.render("betchoice");
});

router.get("/betgame", (req, res) => {
  res.render("betgame");
});

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

module.exports = router;

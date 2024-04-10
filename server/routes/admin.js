const express = require("express");
const router = express.Router();
const Bet = require("../models/Bet");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const adminLayout = "../views/layouts/admin";
const jwtSecret = process.env.JWT_SECRET;

/**
 * GET/
 * Home - Login Page
 */

router.get(
  "/",
  (req, res, next) => {
    // Check if the user is authenticated
    if (req.cookies.token) {
      // If the user is authenticated, redirect to the dashboard
      return res.redirect("/dashboard");
    } else {
      // If the user is not authenticated, proceed to render the index page
      return next();
    }
  },
  async (req, res) => {
    try {
      // Set cache-control headers
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      const locals = {
        title: "Friendly Bet",
        description: "Welcome",
      };

      res.render("admin/index", { locals, layout: adminLayout });
    } catch (error) {
      console.log(error);
    }
  }
);

/**
 * GET/
 * Home - Signup Page
 */

router.get("/signup", async (req, res) => {
  try {
    const locals = {
      title: "Friendly Bet - Signup",
      description: "Welcome",
    };

    res.render("admin/signup", { locals, layout: adminLayout });
  } catch (error) {
    console.log(error);
  }
});

/**
 *
 * Admin - Check token for Login
 */

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
};

/**
 * Get/
 * Admin - Dashboard
 */

router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const data = await Bet.find({ participants: userId }).populate(
      "participants"
    );

    const locals = {
      title: "Dashboard",
      description: "All your Bets",
    };

    res.render("admin/dashboard", {
      userId,
      layout: adminLayout,
      locals,
      data,
    });
  } catch (error) {}
});

/**
 * GET/
 * Admin - Logout
 */

router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});

/**
 * POST/
 * Admin - Register
 */

router.post("/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = await User.create({
        email,
        username,
        password: hashedPassword,
      });
      res.status(201).json({ message: "User Created", user });
    } catch (error) {
      if (error.code === 11000) {
        res.status(409).json({ message: "User already in use" });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  } catch (error) {
    console.log(error);
  }
});

/**
 * POST/
 * Admin - Check Credentials Signin
 */

router.post("/admin", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, jwtSecret);
    res.cookie("token", token, { httpOnly: true });
    res.redirect(`/dashboard`);
  } catch (error) {
    console.log(error);
  }
});

/**
 * POST /
 * App routes - Bet choice
 */

router.post("/betchoice", authMiddleware, async (req, res) => {
  try {
    const { specific, entire } = req.body;
    const betDate = new Date().toLocaleString();

    // Retrieve the existing bet data from the session or cookie
    let betData = req.session.betData || {};

    // Update the bet data with the new information
    betData = {
      ...betData,
      initiator: req.userId,
      betType: specific ? "match" : "matchDay",
      participants: [req.userId],
      betDate,
    };

    // Save the updated bet data to the session or cookie
    req.session.betData = betData;
    console.log(betData);

    let redirectUrl = "/betgame";

    if (entire) {
      redirectUrl = "/betmatchd";
    }
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Error handling form submission:", error);
  }
});

/**
 * POST /
 * App routes - Match choice
 */

router.post("/betgame", (req, res) => {
  try {
    const { game } = req.body;

    const match = {
      gameChoice: game,
    };

    let betData = req.session.betData || {};

    betData = {
      ...betData,
      match,
    };

    req.session.betData = betData;
    console.log(betData);

    res.redirect("/betype");
  } catch (error) {
    console.error("Error handling form submission:", error);
  }
});

/**
 * POST /
 * App routes - Match bet choice
 */

router.post("/betype", (req, res) => {
  try {
    const { betype } = req.body;

    let betData = req.session.betData || {};

    switch (betype) {
      case "finalScore":
        betData.match.betChoice = { finalScore: "" };
        break;
      case "winTeam":
        betData.match.betChoice = { winTeam: "" };
        break;
      case "nberGoals":
        betData.match.betChoice = { nberGoals: 0 };
        break;
      case "nberYcards":
        betData.match.betChoice = { nberYcards: 0 };
        break;
      default:
        betData.match.betChoice = {};
    }

    req.session.betData = betData;
    console.log(betData);

    if (betData.match.betChoice.finalScore !== undefined) {
      res.redirect("/betfs");
    } else if (betData.match.betChoice.winTeam !== undefined) {
      res.redirect("/betwt");
    } else if (betData.match.betChoice.nberGoals !== undefined) {
      res.redirect("/betgoals");
    } else {
      res.redirect("/betycards");
    }
  } catch (error) {
    console.error("Error handling form submission:", error);
  }
});

/**
 * POST /
 * App routes - Final score bet
 */

router.post("/betfs", (req, res) => {
  try {
    let { betfs } = req.body;

    betfs = betfs.trim();

    let betData = req.session.betData || {};

    betData.match.betChoice = {
      finalScore: betfs,
    };

    req.session.betData = betData;
    console.log(betData);

    res.redirect("/yourbet");
  } catch (error) {
    console.error("Error handling form submission:", error);
  }
});

/**
 * POST /
 * App routes - Winning team bet
 */

router.post("/betwt", (req, res) => {
  try {
    let { teamSelect } = req.body;

    let betData = req.session.betData || {};

    betData.match.betChoice = {
      winTeam: teamSelect,
    };

    req.session.betData = betData;
    console.log(betData);

    res.redirect("/yourbet");
  } catch (error) {
    console.error("Error handling form submission:", error);
  }
});

/**
 * POST /
 * App routes - Match number of goals bet
 */

router.post("/betgoals", (req, res) => {
  try {
    let { betfg } = req.body;

    betfg = betfg.trim();

    let betData = req.session.betData || {};

    betData.match.betChoice = {
      nberGoals: betfg,
    };

    req.session.betData = betData;
    console.log(betData);

    res.redirect("/yourbet");
  } catch (error) {
    console.error("Error handling form submission:", error);
  }
});

module.exports = router;

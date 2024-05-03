const express = require("express");
const router = express.Router();
const Bet = require("../models/Bet");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const authMiddleware = require("../middlewares/authMiddleware");
const sendBetInvitation = require("../services/mailer");
const jwt = require("jsonwebtoken");
const Token = require("../models/Token");
const {
  generateToken,
  saveToken,
  verifyToken,
} = require("../middlewares/tokenizer");
const jwtSecret = process.env.JWT_SECRET;

const adminLayout = "../views/layouts/admin";

/**
 * GET/
 * Home - Login Page
 */

router.get("/", (req, res) => {
  try {
    // Set cache-control headers
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // Check if the user is authenticated (has a valid session or token)
    if (
      (req.session && req.session.userId) ||
      (req.cookies && req.cookies.token)
    ) {
      const betToken = req.session.betToken; // Retrieve bet token from session if present

      if (betToken) {
        // If there's a valid bet token, redirect to join page
        return res.redirect(`/join?token=${betToken}`);
      } else {
        // If no bet token, redirect to dashboard
        return res.redirect("/dashboard");
      }
    }

    // If the user is not authenticated, render the index page
    const locals = {
      title: "Friendly Bet",
      description: "Welcome",
    };

    res.render("admin/index", { locals, layout: adminLayout });
  } catch (error) {
    console.error("Error handling / GET request:", error);
    res.status(500).send("An error occurred while loading the home page.");
  }
});

/**
 * GET/
 * Home - Login Page for invited friends
 */

router.get("/joinlogin", (req, res) => {
  const token = req.query.token; // Use the `token` parameter from the query
  console.log(`betToken from query in /joinlogin GET: ${token}`);

  // Existing code
  const locals = {
    title: "Friendly Bet",
    description: "Welcome",
  };

  res.render("admin/joinlogin", {
    locals,
    layout: adminLayout,
    betToken: token,
  });
});

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
 * Get/
 * Admin - Dashboard
 */

router.get("/dashboard", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const data = await Bet.find({ participants: userId }).populate(
      "participants"
    );

    res.render("admin/dashboard", {
      userId,
      layout: adminLayout,
      data,
    });
  } catch (error) {
    console.error("Error loading dashboard:", error);
    res.status(500).send("An error occurred while loading the dashboard.");
  }
});

/**
 * GET/
 * Admin - Logout
 */

router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send("An error occurred during logout.");
    }
    res.clearCookie("token"); // Clear the JWT token cookie
    res.redirect("/"); // Redirect to the home page or another appropriate page
  });
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
    const { username, password, betToken } = req.body;
    console.log(`betToken from POST: ${betToken}`);
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Set userId in session
    req.session.userId = user._id;

    // Set the JWT token in the cookie
    const token = jwt.sign({ userId: user._id }, jwtSecret);
    res.cookie("token", token, { httpOnly: true });

    if (betToken) {
      const tokenEntry = await verifyToken(betToken);
      console.log(`tokenEntry from POST: ${JSON.stringify(tokenEntry)}`);

      if (tokenEntry && tokenEntry.isValid) {
        // If the bet token is valid, store it in the session
        req.session.betToken = betToken;
        return res.redirect(`/join?token=${betToken}`);
      }
    }

    // Redirect to the dashboard
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error handling /admin POST request:", error);
    res.status(500).send("An error occurred during authentication.");
  }
});

/**
 * GET/
 * Home - Join Bet Page if alredy authenticated
 */

router.get("/join", async (req, res) => {
  try {
    // Retrieve token from query params
    const token = req.query.token;
    console.log(`Token from query in /join GET: ${token}`); // Debugging statement

    // Validate the token
    const tokenEntry = await verifyToken(token);
    console.log(`tokenEntry from /join GET: ${JSON.stringify(tokenEntry)}`); // Debugging statement

    if (!tokenEntry || !tokenEntry.isValid) {
      return res.status(404).send("Invalid or expired token.");
    }

    // Retrieve the bet
    const bet = await Bet.findById(tokenEntry.betId).populate("participants");
    if (!bet) {
      return res.status(404).send("Bet not found.");
    }

    // Check if the user is authenticated
    const userId = req.session.userId;
    console.log(`User ID from session in /join GET: ${userId}`); // Debugging statement
    if (!userId) {
      return res.redirect(`/joinlogin?token=${token}`);
    }

    // If the user is authenticated, render the join page with bet data
    res.render("admin/join", { bet, userId });
  } catch (error) {
    console.error("Error handling /join GET request:", error);
    res.status(500).send("An error occurred while loading the join page.");
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

/**
 * POST /
 * App routes - Match number of yellow cards
 */

router.post("/betycards", (req, res) => {
  try {
    let { betyc } = req.body;

    betyc = betyc.trim();

    let betData = req.session.betData || {};

    betData.match.betChoice = {
      nberYcards: betyc,
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
 * App routes - Money bet
 */

// Function to convert date from "DD/MM/YYYY HH:mm:ss" to "YYYY-MM-DDTHH:mm:ss" format
const formatBetDate = (dateString) => {
  const [datePart, timePart] = dateString.split(" ");
  const [day, month, year] = datePart.split("/");
  const formattedDatePart = `${year}-${month}-${day}`;
  const formattedDate = `${formattedDatePart}T${timePart}`;

  return new Date(formattedDate);
};

router.post("/yourbet", async (req, res) => {
  try {
    let { moneyBet } = req.body;

    moneyBet = moneyBet.trim();

    const stake = moneyBet;

    let betData = req.session.betData || {};

    betData = {
      ...betData,
      stake,
    };

    console.log(betData);

    betData.betDate = formatBetDate(betData.betDate);
    const newBet = new Bet(betData);
    await newBet.save();
    req.session.betData = null;

    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error handling form submission:", error);
  }
});

/**
 * POST /
 * App routes - Invite friends page
 */

router.post("/invite", authMiddleware, async (req, res) => {
  try {
    const token = req.query.token;

    if (!token) {
      return res.status(400).send("Token is required.");
    }

    const tokenEntry = await Token.findOne({ token });

    if (!tokenEntry || tokenEntry.expiresAt < new Date()) {
      return res.status(404).send("Invalid or expired token.");
    }

    // const betId = tokenEntry.betId;
    // if (!betId) {
    //   return res.status(404).send("Bet not found.");
    // }

    // const bet = await Bet.findById(betId);

    // if (!bet) {
    //   return res.status(404).send("Bet not found.");
    // }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).send("User not found.");
    }

    const { emails } = req.body;
    const emailList = emails.split(",").map((email) => email.trim());
    const inviteLink = `http://localhost:5000/join?token=${token}`;

    for (const friendEmail of emailList) {
      await sendBetInvitation(friendEmail, inviteLink, user.username);
    }

    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error handling invitation form submission:", error);
    res.status(500).send("An error occurred while sending invitations.");
  }
});

module.exports = router;

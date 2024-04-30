require("dotenv").config();
const nodemailer = require("nodemailer");

// Mailing config
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.ADMIN_USER,
    pass: process.env.ADMIN_PASS,
  },
});

async function sendBetInvitation(FriendEmail, inviteLink, userName) {
  try {
    const mailOptions = {
      from: {
        name: "Friendly Bet",
        address: process.env.ADMIN_USER,
      },
      to: [FriendEmail],
      subject: "You are invited to join a bet!",
      text: `Hello,

You are invited by ${userName} to join a bet.

Click the following link to join it: ${inviteLink}

Best,
Friendly Bet`,
    };

    const emailSend = await transporter.sendMail(mailOptions);
    console.log("Invitation email sent:", emailSend.response);
  } catch (error) {
    console.error("Error sending invitation email:", error);
  }
}

module.exports = sendBetInvitation;

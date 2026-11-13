import "dotenv/config";
import express from "express";
import multer from "multer";
import nodemailer from "nodemailer";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = Number(process.env.PORT) || 3000;
const recipient = "ayushtiwari8420@gmail.com";
const gmailUser = process.env.GMAIL_USER;
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
const publicDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

function getImageType(buffer) {
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "image/jpeg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (["GIF87a", "GIF89a"].includes(buffer.toString("ascii", 0, 6))) return "image/gif";
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    if (!allowedImageTypes.has(file.mimetype)) {
      callback(new Error("Please attach a JPEG, PNG, GIF, or WebP image."));
      return;
    }
    callback(null, true);
  }
});

app.use(express.static(publicDirectory));

app.post("/api/contact", (req, res) => {
  upload.single("photo")(req, res, async (error) => {
    if (error) {
      const message = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
        ? "The image must be 5 MB or smaller."
        : error.message;
      res.status(400).json({ error: message });
      return;
    }

    const { name, email, subject, message } = req.body;
    if (![name, email, subject, message].every((value) => typeof value === "string" && value.trim())) {
      res.status(400).json({ error: "Please complete all fields." });
      return;
    }
    if (name.length > 100 || email.length > 254 || subject.length > 150 || message.length > 5000) {
      res.status(400).json({ error: "One or more fields exceed the allowed length." });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "Please enter a valid email address." });
      return;
    }
    if (req.file && getImageType(req.file.buffer) !== req.file.mimetype) {
      res.status(400).json({ error: "The attachment must be a valid JPEG, PNG, GIF, or WebP image." });
      return;
    }
    if (!gmailUser || gmailUser.toLowerCase() !== recipient || !gmailAppPassword) {
      console.error("Email delivery is not configured. Set GMAIL_USER to the recipient address and provide GMAIL_APP_PASSWORD.");
      res.status(503).json({ error: "The contact form is temporarily unavailable. Please try again later." });
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: gmailUser, pass: gmailAppPassword }
      });

      await transporter.sendMail({
        from: `"Website Contact Form" <${gmailUser}>`,
        to: recipient,
        replyTo: email,
        subject: `Contact form: ${subject.trim()}`,
        text: [
          `Name: ${name.trim()}`,
          `Email: ${email.trim()}`,
          `Subject: ${subject.trim()}`,
          "",
          "Message:",
          message.trim()
        ].join("\n"),
        attachments: req.file
          ? [{
              filename: path.basename(req.file.originalname),
              content: req.file.buffer,
              contentType: req.file.mimetype
            }]
          : []
      });

      res.json({ message: "Thanks! Your message has been sent." });
    } catch (sendError) {
      console.error("Unable to send contact form email:", sendError);
      res.status(502).json({ error: "We couldn't send your message. Please try again later." });
    }
  });
});

app.listen(port, () => {
  console.log(`Contact form server listening on http://localhost:${port}`);
});

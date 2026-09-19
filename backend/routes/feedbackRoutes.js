import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const { name, message } = req.body || {};

    if (
      !name ||
      !message ||
      typeof name !== 'string' ||
      typeof message !== 'string' ||
      !name.trim() ||
      !message.trim()
    ) {
      return res
        .status(400)
        .json({ success: false, error: 'Name and message are required.' });
    }

    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      process.stderr.write(
        '[feedback] Warning: EMAIL_USER or EMAIL_PASS environment variables are not configured.\n',
      );
      return res.status(500).json({
        success: false,
        error: 'Email service credentials are not configured on server.',
      });
    }

    // Automatically strip any spaces from App Password (e.g. "punr qhul zyfe nmzx" -> "punrqhulzyfenmzx")
    const cleanPass = emailPass.replace(/\s+/g, '');
    const cleanUser = emailUser.trim();

    // Force IPv4 (family: 4) to prevent Render ENETUNREACH IPv6 connection errors
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      family: 4,
      auth: {
        user: cleanUser,
        pass: cleanPass,
      },
    });

    await transporter.sendMail({
      from: cleanUser,
      to: 'purushottamx.in@gmail.com',
      subject: `Feedback from ${name.trim()}`,
      text: message.trim(),
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    process.stderr.write(`[feedback error] ${error.message}\n`);
    return res.status(500).json({
      success: false,
      error: 'Failed to send feedback email. Please try again later.',
    });
  }
});

export default router;

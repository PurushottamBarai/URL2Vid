import express from 'express';

const router = express.Router();

router.post('/', async (req, res) => {
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

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.Email || process.env.EMAIL_FROM || 'support@codedeck.me';
    const toEmail = process.env.FEEDBACK_TO || 'purushottamx.in@gmail.com';

    if (!apiKey) {
      process.stderr.write('[feedback] Warning: RESEND_API_KEY environment variable is not configured.\n');
      return res.status(500).json({
        success: false,
        error: 'Email service is not configured on server.',
      });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `URL2Vid Feedback <${fromEmail.trim()}>`,
        to: [toEmail.trim()],
        subject: `Feedback from ${name.trim()}`,
        text: message.trim(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      process.stderr.write(`[feedback error] Resend API error: ${JSON.stringify(data)}\n`);
      return res.status(500).json({
        success: false,
        error: data.message || 'Failed to send feedback email. Please try again later.',
      });
    }

    return res.status(200).json({ success: true, id: data.id });
  } catch (error) {
    process.stderr.write(`[feedback error] ${error.message}\n`);
    return res.status(500).json({
      success: false,
      error: 'Failed to send feedback email. Please try again later.',
    });
  }
});

export default router;

const express = require('express');
const { runGeminiChat } = require('../services/geminiChat');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { message, history } = req.body || {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Body must include a non-empty "message" string.' });
    }

    const { reply, model } = await runGeminiChat(message.trim(), history);
    res.json({ reply, model });
  } catch (err) {
    console.error('Gemini chat error:', err);
    const status = err.message && err.message.includes('GEMINI_API_KEY') ? 503 : 500;
    res.status(status).json({
      error: err.message || 'Chat failed',
    });
  }
});

module.exports = router;

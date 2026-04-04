// routes/chat.js
const express = require('express');
const { runGeminiChat } = require('../services/geminiChat'); // local-safe version
const router = express.Router();

/**
 * POST /chat
 * Body: { message: string, history: Array<{role: 'user'|'assistant', text: string}> }
 * Returns: { reply: string, model: string }
 */
router.post('/', async (req, res) => {
  try {
    const { message, history } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        error: 'Body must include a non-empty "message" string.',
      });
    }

    // Call the local Gemini simulation (database-backed)
    const { reply, model } = await runGeminiChat(message.trim(), history);

    res.json({ reply, model });
  } catch (err) {
    console.error('Local Gemini chat error:', err);

    res.status(500).json({
      error: err.message || 'Local chat failed',
    });
  }
});

module.exports = router;
const express = require('express');
const { runGeminiChat } = require('../services/geminiChat');

const router = express.Router();

router.post('/', async (req, res) => {

  try {

    const { message, history } = req.body || {};

    if (
      !message ||
      typeof message !== 'string' ||
      !message.trim()
    ) {

      return res.status(400).json({
        error: 'Body must include a non-empty "message" string.'
      });

    }

    // Run local AI
    const result = await runGeminiChat(
      message.trim(),
      history
    );

    // ✅ RETURN ACTION ALSO
    res.json({
      reply: result.reply,
      history: result.history,
      action: result.action   // ⭐ THIS FIXES NAVIGATION
    });

  }

  catch (err) {

    console.error('Chat error:', err);

    res.status(500).json({
      reply: 'Chat failed',
      action: null
    });

  }

});

module.exports = router;
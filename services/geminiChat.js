// services/geminiChat.js

require("dotenv").config();
const axios = require("axios");
const { executeToolCall } = require("./geminiDbTools");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ✅ Use working model
const GEMINI_MODEL =
  process.env.GEMINI_MODEL ||
  "gemini-1.5-flash-latest";


// ================= CALL GEMINI =================

async function callGeminiAI(
  userMessage,
  history = []
) {

  if (!GEMINI_API_KEY) {
    console.log("No Gemini API key found");
    return null;
  }

  try {

    const contents = [

      ...history.map(h => ({
        role:
          h.role === "user"
            ? "user"
            : "model",

        parts: [{ text: h.text }]
      })),

      {
        role: "user",
        parts: [{ text: userMessage }]
      }

    ];

    // ✅ FIXED API URL (v1beta)
    const response = await axios.post(

      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,

      {
        contents,

        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300
        }

      }

    );

    const reply =
      response.data
        ?.candidates?.[0]
        ?.content?.parts?.[0]
        ?.text;

    return reply || null;

  }

  catch (err) {

    console.error(
      "Gemini AI call failed:",
      err.response?.data || err.message
    );

    return null;

  }

}


// ================= RUN CHAT =================

async function runGeminiChat(
  userMessage,
  history = []
) {

  history.push({
    role: "user",
    text: userMessage
  });

  let reply = "";
  let action = null;
  let productId = null;

  const lower =
    userMessage.toLowerCase();

  try {

    // ================= GREETING =================

    if (
      ["hi", "hello", "hlo", "hey"]
        .includes(lower)
    ) {

      reply = `Hi! I'm your Fashion Assistant.

I can help you with:

- Show all products
- Search product by name
- Find cheapest or most expensive product
- Show in-stock or out-of-stock products
- Count products
- Open cart
- Show orders

Try typing:
products
cheapest product
in stock products
go to cart`;

    }


    // ================= NAVIGATION =================

    else if (
      lower.includes("go to cart")
    ) {

      reply = "Opening cart...";
      action = "navigate_cart";

    }

    else if (
      lower.includes("go to products")
    ) {

      reply = "Opening products...";
      action = "navigate_products";

    }

    else if (
      lower.includes("go to orders")
    ) {

      reply = "Opening orders...";
      action = "navigate_orders";

    }


    // ================= COUNT PRODUCTS =================

    else if (

      lower.includes(
        "how many products"
      ) ||

      lower.includes(
        "total products"
      )

    ) {

      const res =
        await executeToolCall(
          "count_documents",
          { collection: "products" }
        );

      reply =
        `There are ${res.count} products in the store.`;

    }


    // ================= SHOW PRODUCTS =================

    else if (

      lower === "products" ||

      lower.includes(
        "show products"
      )

    ) {

      const res =
        await executeToolCall(
          "search_products",
          {
            searchText: "",
            limit: 3
          }
        );

      if (res.products?.length) {

        reply =
          res.products
            .map(p =>
              `${p.name} - $${p.price} - Stock: ${p.stock ?? 0}`
            )
            .join("\n");

      }

      else {

        reply = "No products found.";

      }

    }


    // ================= CHEAPEST =================

    else if (

      lower.includes("cheap") ||

      lower.includes("lowest")

    ) {

      const res =
        await executeToolCall(
          "search_products",
          {
            searchText: "",
            limit: 50
          }
        );

      if (res.products?.length) {

        const cheapest =
          res.products.reduce(
            (min, p) =>
              p.price < min.price
                ? p
                : min
          );

        reply =
          `Cheapest product: ${cheapest.name} - $${cheapest.price}`;

      }

    }


    // ================= MOST EXPENSIVE =================

    else if (

      lower.includes(
        "expensive"
      ) ||

      lower.includes(
        "highest"
      )

    ) {

      const res =
        await executeToolCall(
          "search_products",
          {
            searchText: "",
            limit: 50
          }
        );

      if (res.products?.length) {

        const expensive =
          res.products.reduce(
            (max, p) =>
              p.price > max.price
                ? p
                : max
          );

        reply =
          `Most expensive product: ${expensive.name} - $${expensive.price}`;

      }

    }


    // ================= DEFAULT (GEMINI) =================

    else {

      const geminiReply =
        await callGeminiAI(
          userMessage,
          history
        );

      if (geminiReply) {

        reply = geminiReply;

      }

      else {

        const res =
          await executeToolCall(
            "search_products",
            {
              searchText: userMessage,
              limit: 3
            }
          );

        if (res.products?.length) {

          reply =
            res.products
              .map(p =>
                `${p.name} - $${p.price} - Stock: ${p.stock ?? 0}`
              )
              .join("\n\n");

        }

        else {

          reply =
            `I didn't understand.
Try typing:
products
cheapest product
most expensive product
go to cart`;

        }

      }

    }

  }

  catch (err) {

    console.error(err);
    reply = "Something went wrong.";

  }

  history.push({
    role: "assistant",
    text: reply
  });

  return {
    reply,
    history,
    action,
    productId
  };

}


// ✅ IMPORTANT EXPORT

module.exports = {
  runGeminiChat
};
import "dotenv/config";
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 4000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Load products
const products = JSON.parse(
  fs.readFileSync("./public/products.json", "utf-8")
);

// In-memory data
let cart = []; // { id, name, price, quantity }
let waitingForProductToAdd = false;

/* ---------- Gemini fallback ---------- */
async function askGemini(text) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text }] }]
      })
    }
  );

  const data = await response.json();
  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Sorry, I couldn't understand that."
  );
}

/* ---------------- CHAT ---------------- */

app.post("/chat", async (req, res) => {
  const message = req.body.message.toLowerCase().trim();

  /* GREETING */
  if (["hi", "hello", "hey"].includes(message)) {
    return res.json({
      reply:
        "Hello 👋 You can type 'show product', product name for details, 'add to cart', or 'checkout'."
    });
  }

  /* ✅ BUDGET QUERY (under / below / ₹ supported) */
  const budgetMatch = message.match(/(under|below)\s*₹?\s*(\d+)/);
  if (budgetMatch) {
    const budget = parseInt(budgetMatch[2]);

    const filtered = products.filter(p => p.price <= budget);

    if (filtered.length === 0) {
      return res.json({
        reply: `No products available under ₹${budget}.`
      });
    }

    return res.json({
      reply: filtered.map(p => p.name).join(", ")
    });
  }

  /* SHOW PRODUCTS (comma separated, no price) */
  if (message.includes("show")) {
    return res.json({
      reply: products.map(p => p.name).join(", ")
    });
  }

  /* ADD TO CART – STEP 1 */
  if (message.includes("add to cart")) {
    waitingForProductToAdd = true;
    return res.json({
      reply: "Which product would you like to add to the cart?"
    });
  }

  /* ADD TO CART – STEP 2 (MULTI ITEM SAFE) */
  if (waitingForProductToAdd) {
    const product = products.find(p =>
      p.name.toLowerCase().includes(message)
    );

    if (!product) {
      return res.json({
        reply: "Product not found. Please type part of the product name."
      });
    }

    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      });
    }

    waitingForProductToAdd = false;

    return res.json({
      reply: `${product.name} added to cart.`
    });
  }

  /* ✅ PRICE QUESTION */
  if (message.includes("price")) {
    const product = products.find(p =>
      message.includes(p.name.toLowerCase())
    );

    if (product) {
      return res.json({
        reply: `The price of ${product.name} is ₹${product.price}.`
      });
    }
  }

  /* ✅ PRODUCT DETAILS + IMAGE */
  const product = products.find(
    p =>
      message === p.name.toLowerCase() ||
      message.includes(`about ${p.name.toLowerCase()}`) ||
      p.name.toLowerCase().includes(message)
  );

  if (product) {
    const imageName = product.name
      .toLowerCase()
      .replace(/\s+/g, "-");

    const imagePath = `images/${imageName}.jpg`;

    return res.json({
      reply: `
ID: ${product.id}
Name: ${product.name}
Price: ₹${product.price}
Description: ${product.description}
Stock: ${product.stock}
Image: ${imagePath}
      `.trim()
    });
  }

  /* CHECKOUT */
  if (message.includes("checkout") || message.includes("ceckout")) {
    if (cart.length === 0) {
      return res.json({ reply: "Your cart is empty." });
    }

    let total = 0;
    let summary = "Order Summary:\n";

    cart.forEach(item => {
      summary += `${item.name} x${item.quantity} - ₹${item.price * item.quantity}\n`;
      total += item.price * item.quantity;
    });

    cart = []; // clear after checkout

    summary += `\nTotal Price: ₹${total}\nOrder confirmed ✅`;

    return res.json({ reply: summary });
  }

  /* FALLBACK */
  const aiReply = await askGemini(message);
  return res.json({ reply: aiReply });
});

/* ---------------- START SERVER ---------------- */

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

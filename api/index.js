import "dotenv/config";
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

/* ---------------- MIDDLEWARE ---------------- */
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* ---------------- PATH FIX (IMPORTANT FOR VERCEL) ---------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ---------------- LOAD PRODUCTS ---------------- */
const productsPath = path.join(__dirname, "../public/products.json");
const products = JSON.parse(fs.readFileSync(productsPath, "utf-8"));

/* ---------------- ENV ---------------- */
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/* ---------------- IN-MEMORY STATE ---------------- */
let cart = []; // { id, name, price, quantity }
let waitingForProductToAdd = false;

/* ---------------- GEMINI FALLBACK ---------------- */
async function askGemini(text) {
  if (!GEMINI_API_KEY) {
    return "Gemini API key is not configured.";
  }

  try {
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
  } catch (err) {
    return "AI service is currently unavailable.";
  }
}

/* ---------------- CHAT API ---------------- */
app.post("/chat", async (req, res) => {
  const message = req.body.message?.toLowerCase().trim();

  if (!message) {
    return res.json({ reply: "Please type a message." });
  }

  /* GREETING */
  if (["hi", "hello", "hey"].includes(message)) {
    return res.json({
      reply:
        "Hello 👋 You can type 'show product', ask for a product price, add items to cart, or checkout."
    });
  }

  /* BUDGET QUERY (under / below ₹) */
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

  /* SHOW PRODUCTS */
  if (message.includes("show")) {
    return res.json({
      reply: products.map(p => p.name).join(", ")
    });
  }

  /* ADD TO CART (STEP 1) */
  if (message.includes("add to cart")) {
    waitingForProductToAdd = true;
    return res.json({
      reply: "Which product would you like to add to the cart?"
    });
  }

  /* ADD TO CART (STEP 2) */
  if (waitingForProductToAdd) {
    const product = products.find(p =>
      p.name.toLowerCase().includes(message)
    );

    if (!product) {
      return res.json({
        reply: "Product not found. Please type the product name."
      });
    }

    const existing = cart.find(item => item.id === product.id);

    if (existing) {
      existing.quantity += 1;
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

  /* PRICE QUESTION */
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

  /* PRODUCT DETAILS + IMAGE */
  const product = products.find(p =>
    message.includes(p.name.toLowerCase())
  );

  if (product) {
    const imageName = product.name
      .toLowerCase()
      .replace(/\s+/g, "-");

    return res.json({
      reply: `
ID: ${product.id}
Name: ${product.name}
Price: ₹${product.price}
Description: ${product.description}
Stock: ${product.stock}
Image: images/${imageName}.jpg
      `.trim()
    });
  }

  /* CHECKOUT */
  if (message.includes("checkout")) {
    if (cart.length === 0) {
      return res.json({ reply: "Your cart is empty." });
    }

    let total = 0;
    let summary = "Order Summary:\n";

    cart.forEach(item => {
      summary += `${item.name} x${item.quantity} - ₹${item.price * item.quantity}\n`;
      total += item.price * item.quantity;
    });

    cart = [];

    summary += `\nTotal Price: ₹${total}\nOrder confirmed ✅`;

    return res.json({ reply: summary });
  }

  /* FALLBACK TO GEMINI */
  const aiReply = await askGemini(message);
  return res.json({ reply: aiReply });
});

/* ---------------- EXPORT FOR VERCEL ---------------- */
export default app;

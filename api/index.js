import fetch from "node-fetch";
import fs from "fs";
import path from "path";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const productsPath = path.join(process.cwd(), "public", "products.json");
const products = JSON.parse(fs.readFileSync(productsPath, "utf-8"));

let cart = [];
let waitingForProductToAdd = false;

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const message = req.body.message?.toLowerCase().trim();
  if (!message) {
    return res.json({ reply: "Please type something." });
  }

  if (["hi", "hello", "hey"].includes(message)) {
    return res.json({
      reply:
        "Hello 👋 You can type 'show products', product name, 'add to cart', or 'checkout'."
    });
  }

  const budgetMatch = message.match(/(under|below)\s*₹?\s*(\d+)/);
  if (budgetMatch) {
    const budget = parseInt(budgetMatch[2]);
    const filtered = products.filter(p => p.price <= budget);
    return res.json({
      reply:
        filtered.length === 0
          ? `No products under ₹${budget}.`
          : filtered.map(p => p.name).join(", ")
    });
  }

  if (message.includes("show")) {
    return res.json({
      reply: products.map(p => p.name).join(", ")
    });
  }

  if (message.includes("add to cart")) {
    waitingForProductToAdd = true;
    return res.json({
      reply: "Which product do you want to add?"
    });
  }

  if (waitingForProductToAdd) {
    const product = products.find(p =>
      p.name.toLowerCase().includes(message)
    );

    if (!product) {
      return res.json({ reply: "Product not found." });
    }

    const existing = cart.find(i => i.id === product.id);
    if (existing) existing.quantity += 1;
    else cart.push({ ...product, quantity: 1 });

    waitingForProductToAdd = false;
    return res.json({ reply: `${product.name} added to cart.` });
  }

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

  const product = products.find(p =>
    message.includes(p.name.toLowerCase())
  );

  if (product) {
    const imageName = product.name.toLowerCase().replace(/\s+/g, "-");
    return res.json({
      reply: `ID: ${product.id}
Name: ${product.name}
Price: ₹${product.price}
Description: ${product.description}
Stock: ${product.stock}
Image: images/${imageName}.jpg`
    });
  }

  if (message.includes("checkout")) {
    if (cart.length === 0) {
      return res.json({ reply: "Your cart is empty." });
    }

    let total = 0;
    let summary = "Order Summary:\n";
    cart.forEach(i => {
      summary += `${i.name} x${i.quantity} - ₹${i.price * i.quantity}\n`;
      total += i.price * i.quantity;
    });

    cart = [];
    summary += `\nTotal: ₹${total}\nOrder confirmed ✅`;
    return res.json({ reply: summary });
  }

  const aiReply = await askGemini(message);
  return res.json({ reply: aiReply });
}

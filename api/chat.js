import fetch from "node-fetch";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ reply: "Message missing" });
    }

    // Load products.json safely
    const productsPath = path.join(process.cwd(), "public", "products.json");
    const products = JSON.parse(fs.readFileSync(productsPath, "utf-8"));

    const userMessage = message.toLowerCase().trim();

    // Greeting
    if (["hi", "hello", "hey"].includes(userMessage)) {
      return res.json({
        reply:
          "Hello 👋 You can ask for products, prices, budget items, or checkout."
      });
    }

    // Budget query
    const budgetMatch = userMessage.match(/(under|below)\s*₹?\s*(\d+)/);
    if (budgetMatch) {
      const budget = parseInt(budgetMatch[2]);
      const filtered = products.filter(p => p.price <= budget);

      if (!filtered.length) {
        return res.json({ reply: `No products under ₹${budget}` });
      }

      return res.json({
        reply: filtered.map(p => p.name).join(", ")
      });
    }

    // Show products
    if (userMessage.includes("show")) {
      return res.json({
        reply: products.map(p => p.name).join(", ")
      });
    }

    // Price query
    if (userMessage.includes("price")) {
      const product = products.find(p =>
        userMessage.includes(p.name.toLowerCase())
      );

      if (product) {
        return res.json({
          reply: `The price of ${product.name} is ₹${product.price}`
        });
      }
    }

    // Product details + image
    const product = products.find(p =>
      userMessage.includes(p.name.toLowerCase())
    );

    if (product) {
      const imageName = product.name.toLowerCase().replace(/\s+/g, "-");

      return res.json({
        reply: `
ID: ${product.id}
Name: ${product.name}
Price: ₹${product.price}
Description: ${product.description}
Image: images/${imageName}.jpg
        `.trim()
      });
    }

    // Gemini fallback
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: message }] }]
        })
      }
    );

    const data = await response.json();
    const aiReply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't understand that.";

    return res.json({ reply: aiReply });

  } catch (err) {
    console.error("API ERROR:", err);
    return res.status(500).json({ reply: "Server error" });
  }
}

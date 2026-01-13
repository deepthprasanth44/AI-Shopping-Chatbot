import fetch from "node-fetch";
import fs from "fs";
import path from "path";

/**
 * Simple in-memory cart (per deployment)
 * For demo / academic projects – OK
 */
let cart = [];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ reply: "Message missing" });
    }

    const userMessage = message.toLowerCase().trim();

    // Load products.json (Vercel safe)
    const productsPath = path.join(process.cwd(), "public", "products.json");
    const products = JSON.parse(fs.readFileSync(productsPath, "utf-8"));

    /* ================= GREETING ================= */
    if (["hi", "hello", "hey"].includes(userMessage)) {
      return res.json({
        reply:
`Hello 👋  
You can try:  
• products  
• prices  
• products under 3000  
• add to cart <product name>  
• cart  
• checkout`
      });
    }

    /* ================= SHOW ALL PRODUCTS ================= */
    if (
      userMessage === "products" ||
      userMessage === "show products" ||
      userMessage.includes("list products")
    ) {
      let reply = "🛍️ Available Products:\n\n";

      products.forEach(p => {
        const imageName = p.name.toLowerCase().replace(/\s+/g, "-");

        reply += `
${p.name}
Price: ₹${p.price}
Description: ${p.description}
Image: images/${imageName}.jpg

`;
      });

      reply += "👉 To add an item: add to cart <product name>";

      return res.json({ reply: reply.trim() });
    }

    /* ================= PRICE LIST ================= */
    if (userMessage === "prices" || userMessage === "price list") {
      let reply = "💰 Product Prices:\n\n";

      products.forEach(p => {
        reply += `${p.name} – ₹${p.price}\n`;
      });

      return res.json({ reply: reply.trim() });
    }

    /* ================= BUDGET QUERY ================= */
    const budgetMatch = userMessage.match(/(under|below)\s*₹?\s*(\d+)/);
    if (budgetMatch) {
      const budget = parseInt(budgetMatch[2], 10);
      const filtered = products.filter(p => p.price <= budget);

      if (!filtered.length) {
        return res.json({ reply: `No products under ₹${budget}.` });
      }

      let reply = `Products under ₹${budget}:\n\n`;

      filtered.forEach(p => {
        const imageName = p.name.toLowerCase().replace(/\s+/g, "-");
        reply += `
${p.name}
Price: ₹${p.price}
Image: images/${imageName}.jpg

`;
      });

      return res.json({ reply: reply.trim() });
    }

    /* ================= ADD TO CART ================= */
    if (userMessage.startsWith("add to cart")) {
      const productName = userMessage.replace("add to cart", "").trim();

      const product = products.find(p =>
        productName.includes(p.name.toLowerCase())
      );

      if (!product) {
        return res.json({ reply: "❌ Product not found." });
      }

      cart.push(product);

      return res.json({
        reply: `✅ ${product.name} added to cart.`
      });
    }

    /* ================= VIEW CART ================= */
    if (userMessage === "cart" || userMessage === "view cart") {
      if (!cart.length) {
        return res.json({ reply: "🛒 Your cart is empty." });
      }

      let total = 0;
      let reply = "🛒 Your Cart:\n\n";

      cart.forEach(p => {
        reply += `${p.name} – ₹${p.price}\n`;
        total += p.price;
      });

      reply += `\nTotal: ₹${total}\n\nType 'checkout' to place order`;

      return res.json({ reply });
    }

    /* ================= CHECKOUT ================= */
    if (userMessage === "checkout") {
      if (!cart.length) {
        return res.json({ reply: "🛒 Your cart is empty." });
      }

      let total = 0;
      let reply = "✅ Order Confirmed!\n\nItems:\n";

      cart.forEach(p => {
        reply += `• ${p.name} – ₹${p.price}\n`;
        total += p.price;
      });

      reply += `\nTotal Paid: ₹${total}\n\n🎉 Thank you for shopping!`;

      cart = []; // clear cart

      return res.json({ reply });
    }

    /* ================= PRODUCT NAME DIRECT ================= */
    const product = products.find(p =>
      userMessage.includes(p.name.toLowerCase())
    );

    if (product) {
      const imageName = product.name.toLowerCase().replace(/\s+/g, "-");

      return res.json({
        reply: `
${product.name}
Price: ₹${product.price}
Description: ${product.description}
Image: images/${imageName}.jpg
        `.trim()
      });
    }

    /* ================= GEMINI FALLBACK ================= */
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

  } catch (error) {
    console.error("API ERROR:", error);
    return res.status(500).json({
      reply: "Internal server error. Please try again."
    });
  }
}

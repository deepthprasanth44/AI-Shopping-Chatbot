AI Shopping Chatbot


Overview
AI Shopping Chatbot is a web-based application that allows users to interact with a virtual shopping assistant through a conversational interface.Users can browse products, check prices, filter items by budget, view detailed product information, add items to a cart, and complete checkout.The chatbot uses rule-based logic for core shopping operations and integrates the Gemini API as a conversational fallback for unmatched queries.

Live Demo
Vercel Deployment:
https://ai-shopping-chatbot-shr4.vercel.app

Features
Display available products from a JSON data source
Show product name, price, and image in a list format
View detailed product information (ID, description, price, image)
Budget-based filtering (e.g., products under ₹3000)
Add products to cart using chat commands
View cart and complete checkout with order summary
Conversational fallback responses using Gemini API
Deployed using Vercel Serverless Functions

Tech Stack
Frontend: HTML, CSS, JavaScript
Backend: Node.js (Vercel Serverless Functions)
API Integration: Gemini API
Hosting & Deployment: Vercel
Version Control: Git & GitHub


How to Run the Project Locally
Clone the repository:
git clone https://github.com/deepthprasanth44/AI-Shopping-Chatbot.git

Navigate to the project folder:
cd AI-Shopping-Chatbot

Install dependencies:
npm install

Create a .env file and add your Gemini API key:
GEMINI_API_KEY=your_api_key_here

Start the server (for local testing):
node server.js

Open public/index.html in your browser.

Example Chat Flow

User: hi
Bot: Greeting message with usage instructions

User: products
Bot: Lists available products with price

User: backpack
Bot: Shows detailed product information with image

User: add to cart
Bot: Asks for product name

User: checkout
Bot: Displays order summary and confirms purchase

Notes
Core shopping logic (product listing, cart handling, checkout) is implemented manually for reliability.
Gemini API is used only for conversational fallback when predefined logic does not match user input.
The backend is implemented as a Vercel serverless API (/api/chat) for production deployment.


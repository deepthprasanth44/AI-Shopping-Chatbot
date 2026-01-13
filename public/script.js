// ================================
// Send message to backend
// ================================
async function sendMessage() {
    const inputElement = document.getElementById("userInput");
    const message = inputElement.value.trim();

    if (!message) return;

    // Show user message
    addChatMessage(message, "user");
    inputElement.value = "";

    try {
        // Vercel serverless API
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        if (!data || !data.reply) {
            throw new Error("Invalid response from server");
        }

        // Show bot reply
        addChatMessage(data.reply, "bot");

    } catch (error) {
        console.error("Chat error:", error);
        addChatMessage("❌ Error communicating with the server.", "bot");
    }
}

// ================================
// Render chat message (TEXT + IMAGE)
// ================================
function addChatMessage(message, sender) {
    const chatbox = document.getElementById("chatbox");
    const messageDiv = document.createElement("div");

    messageDiv.classList.add("message", sender);

    // Handle messages that contain ONE image
    if (typeof message === "string" && message.includes("Image:")) {
        const parts = message.split("Image:");
        const textPart = parts[0].trim().replace(/\n/g, "<br>");
        const imagePath = parts[1].trim();

        messageDiv.innerHTML = `
            <div class="text-part">${textPart}</div>
            <img 
                src="${imagePath}" 
                class="product-image"
                alt="Product Image"
                onerror="this.style.display='none'"
            >
        `;
    } else {
        // Normal text message
        messageDiv.innerHTML = String(message).replace(/\n/g, "<br>");
    }

    chatbox.appendChild(messageDiv);
    chatbox.scrollTop = chatbox.scrollHeight;
}

// ================================
// Send message on Enter key
// ================================
document.getElementById("userInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
    }
});

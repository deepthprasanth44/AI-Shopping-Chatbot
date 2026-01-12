// Handle sending messages to backend
async function sendMessage() {
    const inputElement = document.getElementById("userInput");
    const message = inputElement.value.trim();

    if (!message) return;

    // Show user message
    addChatMessage(message, "user");
    inputElement.value = "";

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message })
        });

        const data = await response.json();

        // Show bot reply
        addChatMessage(data.reply, "bot");

    } catch (error) {
        addChatMessage("❌ Error communicating with the server.", "bot");
    }
}

// Append message as chat bubble (TEXT + IMAGE SUPPORT)
function addChatMessage(message, sender) {
    const chatbox = document.getElementById("chatbox");
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", sender);

    // If image is included in backend response
    if (message.includes("Image:")) {
        const parts = message.split("Image:");
        const textPart = parts[0].replace(/\n/g, "<br>");
        const imagePath = parts[1].trim();

        messageDiv.innerHTML = `
            ${textPart}<br>
            <img src="${imagePath}" class="product-image">
        `;
    } else {
        messageDiv.innerHTML = message.replace(/\n/g, "<br>");
    }

    chatbox.appendChild(messageDiv);
    chatbox.scrollTop = chatbox.scrollHeight;
}

// Send message on Enter key
document.getElementById("userInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
    }
});

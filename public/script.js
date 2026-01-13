// ================================
// Send message to backend
// ================================
async function sendMessage() {
    const inputElement = document.getElementById("userInput");
    const message = inputElement.value.trim();

    if (!message) return;

    addChatMessage(message, "user");
    inputElement.value = "";

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        addChatMessage(data.reply, "bot");

    } catch (error) {
        console.error("Chat error:", error);
        addChatMessage("❌ Error communicating with the server.", "bot");
    }
}

// ================================
// Render chat message
// ================================
function addChatMessage(message, sender) {
    const chatbox = document.getElementById("chatbox");
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", sender);

    /* ================= PRODUCT LIST ================= */
    if (typeof message === "string" && message.startsWith("🛍️")) {

        // Split safely using Image:
        const parts = message.split("Image:").slice(1);

        let html = `<b>🛍️ Available Products</b><br><br>`;

        parts.forEach(part => {
            const lines = part.trim().split("\n");
            const image = lines[0]?.trim();

            const nameLine = lines.find(l => !l.includes("Price") && l.trim());
            const priceLine = lines.find(l => l.includes("Price")) || "";

            html += `
              <div style="
                display:flex;
                align-items:center;
                gap:12px;
                margin-bottom:12px;
              ">
                <img src="${image}"
                     style="
                       width:45px;
                       height:45px;
                       object-fit:cover;
                       border-radius:6px;
                     "
                     onerror="this.style.display='none'">
                <div>
                  <b>${nameLine}</b><br>
                  <span>${priceLine}</span>
                </div>
              </div>
            `;
        });

        html += `<br>👉 <i>To know more about a product, type the product name</i>`;
        messageDiv.innerHTML = html;
    }

    /* ================= PRODUCT DETAILS ================= */
    else if (
        typeof message === "string" &&
        message.includes("🆔") &&
        message.includes("Image:")
    ) {
        const imagePath = message.match(/Image:\s*(.*)/)?.[1];
        const text = message
            .replace(/Image:.*/, "")
            .replace(/\n/g, "<br>");

        messageDiv.innerHTML = `
          <div>
            ${text}
            <br><br>
            <img src="${imagePath}"
                 style="
                   width:260px;
                   max-width:100%;
                   border-radius:12px;
                   box-shadow:0 4px 12px rgba(0,0,0,0.2);
                 "
                 onerror="this.style.display='none'">
            <br><br>
            👉 <b>To order, type: add to cart</b>
          </div>
        `;
    }

    /* ================= NORMAL MESSAGE ================= */
    else {
        messageDiv.innerHTML = String(message).replace(/\n/g, "<br>");
    }

    chatbox.appendChild(messageDiv);
    chatbox.scrollTop = chatbox.scrollHeight;
}

// ================================
// Send on Enter key
// ================================
document.getElementById("userInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        e.preventDefault();
        sendMessage();
    }
});

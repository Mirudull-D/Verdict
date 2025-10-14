const sendMessage = async (userMessage) => {
  try {
    const response = await fetch("http://localhost:5000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: userMessage }),
    });

    const data = await response.json();

    if (data.success) {
      console.log("AI Response:", data.response);
      return data.response;
    } else {
      console.error("Error:", data.error);
    }
  } catch (error) {
    console.error("Network error:", error);
  }
};

// Test it
sendMessage("Explain React hooks in simple terms");

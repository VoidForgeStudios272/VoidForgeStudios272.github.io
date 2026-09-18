const form = document.getElementById("downloadForm");
const urlInput = document.getElementById("url");
const button = document.getElementById("downloadButton");
const statusText = document.getElementById("status");

const BACKEND_URL = "https://YOUR-BACKEND-URL.example.com";

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const url = urlInput.value.trim();

    if (!url) {
        statusText.textContent = "Please paste a YouTube URL.";
        return;
    }

    button.disabled = true;
    statusText.textContent = "Converting... this can take a little while.";

    const formData = new FormData();
    formData.append("url", url);

    try {
        const response = await fetch(`${BACKEND_URL}/download`, {
            method: "POST",
            body: formData
        });

        const contentType = response.headers.get("content-type") || "";

        if (!response.ok) {
            let message = "Download failed.";

            if (contentType.includes("application/json")) {
                const data = await response.json();
                message = data.detail || data.error || message;
            }

            throw new Error(message);
        }

        if (!contentType.includes("audio/mpeg")) {
            throw new Error("The server did not return an MP3 file.");
        }

        const blob = await response.blob();
        const downloadUrl = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = "audio.mp3";
        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(downloadUrl);

        statusText.textContent = "MP3 ready — your download should start automatically.";
    } catch (error) {
        statusText.textContent = error.message || "Something went wrong.";
    } finally {
        button.disabled = false;
    }
});

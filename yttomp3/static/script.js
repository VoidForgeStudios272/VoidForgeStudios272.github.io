const form = document.getElementById("downloadForm");
const urlInput = document.getElementById("url");
const statusText = document.getElementById("status");

form.addEventListener("submit", async (event) => {

    event.preventDefault();

    const url = urlInput.value.trim();

    if (!url) {
        statusText.textContent = "Please enter a URL.";
        return;
    }

    statusText.textContent = "Converting...";

    const formData = new FormData();

    formData.append("url", url);

    try {

        const response = await fetch("/download", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error("Download failed.");
        }

        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {

            const data = await response.json();

            statusText.textContent =
                data.error || "Something went wrong.";

            return;
        }

        const blob = await response.blob();

        const downloadUrl = window.URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = downloadUrl;
        link.download = "audio.mp3";

        document.body.appendChild(link);

        link.click();

        link.remove();

        window.URL.revokeObjectURL(downloadUrl);

        statusText.textContent = "Download complete!";

    } catch (error) {

        statusText.textContent =
            "Something went wrong: " + error.message;

    }

});

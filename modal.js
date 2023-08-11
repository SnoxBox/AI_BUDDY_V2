document.addEventListener("DOMContentLoaded", function () {
  const rescueTextArea = document.getElementById("rescue-textarea");
  const responseText = document.getElementById("response-text");
  const rescueSubmitBtn = document.getElementById("rescue-submit");
  const closeModalBtn = document.getElementById("close-modal");

  rescueSubmitBtn.addEventListener("click", () => {
    const textToSend = rescueTextArea.value;
    console.log("Sending text from modal =>", textToSend);
    responseText.textContent = "Typing...";

    const sendMessage = new Promise((resolve, reject) => {
      browser.runtime.sendMessage({ text: textToSend }, (response) => {
        if (response) {
          resolve(response);
        } else {
          reject(new Error("Error: Invalid API Key"));
        }
      });
    });

    sendMessage
      .then((response) => {
        console.log("Response came from background.js in modal.js =>", response);

        if (response.message === "success") {
          const responseData = response.data.trim();
          responseText.textContent = responseData;
        } else {
          const errorMessage = response.data.message || "Error: Invalid API Key";
          responseText.textContent = errorMessage;
        }
      })
      .catch((error) => {
        responseText.textContent = error.message;
      });

    const submitRescueEvent = { type: "submitRescue", detail: textToSend };
    window.parent.postMessage(submitRescueEvent, "*");
  });

  closeModalBtn.addEventListener("click", () => {
    const closeRescueEvent = { type: "closeRescue" };
    window.parent.postMessage(closeRescueEvent, "*");
  });
});

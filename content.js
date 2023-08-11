console.log("injected");
const inputElement = document.activeElement;

const sidekickCommand = "buddy";
const sidekickRegExp = new RegExp("\\$" + sidekickCommand + "\\b\\s*(.*)", "i");

let timeoutId;

document.addEventListener("input", function (event) {
  try {
    const activeElement = document.activeElement;
    if(activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA" || activeElement.isContentEditable || activeElement.getAttribute("contenteditable") === "true") || activeElement.getAttribute("role") === "textbox") {
      let inputValue = activeElement.value || activeElement.innerText || activeElement.innerHTML;
      const sidekickMatch = sidekickRegExp.exec(inputValue);
      if (sidekickMatch) {
        const altKeyDownHandler = function (e) {
          if (e.key === "Alt") {
            e.preventDefault();
            console.log("Button worked!");
            if(activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA" || activeElement.isContentEditable || activeElement.getAttribute("contenteditable") === "true") || activeElement.getAttribute("role") === "textbox") {
              let inputValue = activeElement.value || activeElement.innerText || activeElement.innerHTML;
              console.log("Before prompt", inputValue);
              const sidekickMatch = sidekickRegExp.exec(inputValue);
              if (sidekickMatch) {
                console.log("Sidekick Match detected!")
                processInput(activeElement, sidekickMatch, sidekickRegExp);
              }
            }
            document.removeEventListener("keydown", altKeyDownHandler);
          }
        };
        document.addEventListener("keydown", altKeyDownHandler);
      }
    }
  } catch (error) {
    console.error("Error in the main event listener:", error);
  }
});
  
function processInput(activeElement, match, regExp) {
  console.log("processInput called");
  console.log("sending promptText=>", match);
  let promptText = match[1];
  if (promptText) {
    const typingText = "Typing...";
    if (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA") {
      activeElement.value = typingText;
    } else {
      activeElement.innerText = typingText;
    }
    browser.runtime.sendMessage({ text: promptText })
      .then(response => {
        console.log("Response received from server:", response);
        clearTimeout(timeoutId);
        if (response.message === "success") {
          console.log("Response data:", response.data);
          let responseData = response.data.trim();
          if (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA") {
            activeElement.value = responseData;
          } else {
            activeElement.innerHTML = "";
            const responseTextNode = document.createTextNode(responseData);
            activeElement.appendChild(responseTextNode);
          }
          activeElement.dispatchEvent(new Event("input", { bubbles: true }));
          activeElement.dispatchEvent(new Event("change", { bubbles: true }));
          activeElement.focus();
          const range = document.createRange();
          range.selectNodeContents(activeElement);
          range.collapse(false);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
          activeElement.style.color = "";
        } else {
          console.error("error in promptText IF, content.js=>", response);
          const errorMessage = response.data.message || "Error: Invalid API Key";
          console.log("error=>", errorMessage);
          if (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA") {
            activeElement.value = errorMessage;
          } else {
            activeElement.innerText = errorMessage;
          }
        }
      })
      .catch(error => {
        console.error(error);
      });
  }

  timeoutId = setTimeout(() => {
    if (inputElement.tagName === "INPUT" || inputElement.tagName === "TEXTAREA") {
      inputElement.value = "Error: Request timed out";
    } else {
      inputElement.innerText = "Error: Request timed out";
    }
  }, 7e3);
}

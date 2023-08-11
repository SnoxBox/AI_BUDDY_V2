console.log("Background script running!");

const REQUEST_LIMIT = 10000;
const INTERVAL = 36e5;

function fetchWithTimeout(url, options, timeout = 1e4) {
  return Promise.race([
    fetch(url, options),
    new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error("Request timed out"));
      }, timeout);
    })
  ]);
}

browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  browser.storage.local.get(["requestCount", "lastRequest"]).then(function(result) {
    const requestCount = result.requestCount || 0;
    const lastRequest = result.lastRequest || 0;
    const currentTime = new Date().getTime();

    if (requestCount >= REQUEST_LIMIT && currentTime - lastRequest < INTERVAL) {
      sendResponse({
        status: "error",
        data: {
          message: `You have exceeded the request limit of ${REQUEST_LIMIT} requests in ${INTERVAL / 36e5} hours.`
        }
      });
      return Promise.resolve();
    }

    return browser.storage.local.set({
      requestCount: requestCount + 1,
      lastRequest: currentTime
    }).then(() => {
      console.log("Received message from content.js:", request);

      const text = request.text;
      if (!text) {
        return Promise.resolve();
      }

      return browser.storage.local.get("apiKey").then(function(result) {
        const apiKey = result.apiKey;
        console.log(apiKey);

        if (!apiKey) {
          sendResponse({
            status: "error",
            data: {
              message: "Buddy AI needs OpenAI API Key to work!"
            }
          });
          return Promise.resolve();
        }

        const url = "https://api.openai.com/v1/chat/completions";
        const options = {
          method: "POST",
          headers: {
            Authorization: "Bearer " + apiKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: text }],
            max_tokens: 100, 
            temperature: 0.7,
            n: 1,
            stream: false
          })
        };

        return fetchWithTimeout(url, options).then(function(response) {
          console.log("Sent request");
          console.log(response); // debugging
          if (response.ok) {
            return response.text().then(function(body) {
              const data = JSON.parse(body);
              const message = data.choices[0].message.content;
              sendResponse({
                message: "success",
                data: message
              });
              return Promise.resolve();
            });
          } else if (response.status === 429) {
            console.log(response);
            throw new Error("Too many requests, Error " + response.status);
          } else {
            console.log(response);
            throw new Error("Failed to fetch GPT-3.5-turbo response");
          }
        }).catch(function(error) {
          console.error(error);
          sendResponse({
            message: "error",
            data: error.message
          });
          return Promise.resolve();
        });
      });
    });
  }).catch(function(error) {
    console.error(error);
    sendResponse({
      message: "error",
      data: error.message
    });
    return Promise.resolve();
  });

  return true;
});

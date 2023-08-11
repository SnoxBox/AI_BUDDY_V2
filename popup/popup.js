let apiKey = '';

document.addEventListener('DOMContentLoaded', function() {
  const apiKeyInput = document.getElementById('apiKeyInput');
  const saveButton = document.getElementById('saveButton');
  const displayButton = document.getElementById('displayButton');

  // Get the stored apiKey, if it exists
  browser.storage.local.get('apiKey').then(result => {
    apiKey = result.apiKey || '';
    apiKeyInput.value = apiKey;
  });

  // Save the apiKey when the "Save" button is clicked
  saveButton.addEventListener('click', function() {
    apiKey = apiKeyInput.value;
    browser.storage.local.set({apiKey: apiKey}).then(() => {
      // Display a "Saved" message for 2 seconds
      console.log("Saved " + apiKey);
    });
  });
});

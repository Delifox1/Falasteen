document.addEventListener('DOMContentLoaded', () => {
  const messageForm = document.getElementById('messageForm');
  const messageInput = document.getElementById('messageInput');
  const messagesContainer = document.getElementById('messagesContainer');
  const messageCount = document.getElementById('messageCount');

  messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const messageText = messageInput.value.trim();
    if (messageText !== '') {
      await postMessage(messageText);
      messageInput.value = '';
    }
  });

  async function postMessage(messageText) {
    // Insert new message into MySQL database
    const response = await fetch('/.netlify/functions/server/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: messageText }),
    });

    if (response.ok) {
      const result = await response.json();
      await displayMessagesFromServer(); // Fetch and display messages from the server
      return result;
    } else {
      console.error('Error posting message:', response.status, response.statusText);
      return { error: 'Internal Server Error' };
    }
  }

  async function displayMessagesFromServer() {
    const response = await fetch('/.netlify/functions/server/messages');

    if (response.ok) {
      const messages = await response.json();
      displayMessages(messages);
    } else {
      console.error('Error fetching messages:', response.status, response.statusText);
    }
  }

  function saveAsImage(messageElement) {
    const messageText = messageElement.querySelector('.message').textContent;

    const canvasWidth = 1080;
    const canvasHeight = 1080;
    const fontSize = 30;
    const horizontalPadding = 50; // Adjust this value for the desired space on both sides

    const newCanvas = document.createElement('canvas');
    const newContext = newCanvas.getContext('2d');

    newCanvas.width = canvasWidth;
    newCanvas.height = canvasHeight;

    // Load your template image here
    const backgroundImage = new Image();
    backgroundImage.crossOrigin = 'anonymous'; // Enable CORS for the image
    backgroundImage.src = './image0.png';

    // Draw the background template when the image is loaded
    backgroundImage.onload = function () {
      newContext.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight);

      newContext.fillStyle = 'black';
      newContext.font = `bold ${fontSize}px "Hatton Bold", sans-serif`;
      newContext.textAlign = 'center';
      newContext.textBaseline = 'middle';

      const words = messageText.split(' ');
      let line = '';
      const lines = [];

      for (const word of words) {
        const testLine = line + (line === '' ? '' : ' ') + word;
        const metrics = newContext.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > canvasWidth - 2 * horizontalPadding && line !== '') {
          lines.push(line);
          line = word;
        } else {
          line = testLine;
        }
      }

      lines.push(line);

      const totalLinesHeight = lines.length * fontSize;
      const verticalPosition = (canvasHeight - totalLinesHeight) / 2;

      lines.forEach((line, index) => {
        const y = verticalPosition + index * fontSize;
        newContext.fillText(line, canvasWidth / 2, y);
      });

      newContext.fillText('#PalestineSolidarityWall', canvasWidth - 190, canvasHeight - 20);

      const imageDataURL = newCanvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.href = imageDataURL;
      downloadLink.download = 'Free_Palestine.png';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
  }

  function displayMessages(messages) {
    messagesContainer.innerHTML = '';
    messages.reverse();

    messages.forEach((message) => {
      const messageElement = document.createElement('div');
      messageElement.classList.add('messageBox');

      const messageTextElement = document.createElement('div');
      messageTextElement.classList.add('message');
      messageTextElement.textContent = message.text;

      const reportButton = document.createElement('button');
      reportButton.textContent = 'Report';
      reportButton.classList.add('reportButton');
      reportButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Stop event propagation here
        reportMessage(message.id);
      });

      messageElement.appendChild(messageTextElement);
      messageElement.appendChild(reportButton);

      messageElement.addEventListener('click', () => saveAsImage(messageElement));

      messagesContainer.appendChild(messageElement);
    });

    messageCount.textContent = messages.length;
  }

  function reportMessage(messageId) {
    // Report the message to the server
    fetch('/.netlify/functions/server/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messageId: messageId }),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          console.error('Error reporting message:', response.status, response.statusText);
          return { error: 'Internal Server Error' };
        }
      })
      .then((result) => {
        console.log(result);
        // Refresh messages after reporting
        displayMessagesFromServer();
      });
  }

  // Fetch and display messages from the server when the page loads
  displayMessagesFromServer();
});

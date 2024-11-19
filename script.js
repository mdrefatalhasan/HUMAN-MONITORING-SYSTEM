const webcamElement = document.getElementById("webcam");
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
const infoElement = document.getElementById("info");

async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  webcamElement.srcObject = stream;

  return new Promise((resolve) => {
    webcamElement.onloadedmetadata = () => resolve();
  });
}

async function detectObjects() {
  const model = await cocoSsd.load();
  console.log("Model Loaded");

  const detect = async () => {
    const predictions = await model.detect(webcamElement);

    const videoWidth = webcamElement.videoWidth;
    const videoHeight = webcamElement.videoHeight;
    const aspectRatio = videoWidth / videoHeight;

    const width = window.innerWidth * 0.5;
    const height = width / aspectRatio;

    canvas.width = width;
    canvas.height = height;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(webcamElement, 0, 0, canvas.width, canvas.height);

    let humanCount = 0;

    predictions.forEach((prediction) => {
      const [x, y, w, h] = prediction.bbox;

      const scaleX = canvas.width / videoWidth;
      const scaleY = canvas.height / videoHeight;

      const scaledX = x * scaleX;
      const scaledY = y * scaleY;
      const scaledWidth = w * scaleX;
      const scaledHeight = h * scaleY;

      context.beginPath();
      context.rect(scaledX, scaledY, scaledWidth, scaledHeight);
      context.lineWidth = 2;
      context.strokeStyle = prediction.class === "person" ? "red" : "blue";
      context.stroke();

      context.fillStyle = prediction.class === "person" ? "red" : "blue";
      context.font = "18px Arial";
      context.fillText(
        `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
        scaledX,
        scaledY > 20 ? scaledY - 10 : 20
      );

      if (prediction.class === "person") {
        humanCount++;
      }
    });

    infoElement.textContent = `Humans Detected: ${humanCount}`;
    requestAnimationFrame(detect);
  };
  detect();
}

async function main() {
  await setupCamera();
  detectObjects();
}

main();

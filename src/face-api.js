import * as faceapi from 'face-api.js';

async function setupFaceApi() {
  await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
  await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
  await faceapi.nets.faceRecognitionNet.loadFromUri('/models');

  const video = document.getElementById('videoElement');

  video.onplay = () => {
    setInterval(async () => {
      const detections = await faceapi.detectSingleFace(video).withFaceLandmarks();
      if (detections) {
        const mouth = detections.landmarks.getMouth();
        // Draw the detected mouth
        faceapi.draw.drawDetections(video);
        faceapi.draw.drawLandmarks(video);
        // Check for mouth movement or use mouth positions for lip reading
      }
    }, 100);
  };
}

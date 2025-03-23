import * as faceMesh from '@mediapipe/face_mesh';
import {Camera} from '@mediapipe/camera_utils';
import {drawConnectors, drawLandmarks} from '@mediapipe/drawing_utils';

// Initialize MediaPipe Face Mesh
const faceMeshModule = new faceMesh.FaceMesh({
  locateLandmarks: true,
});
faceMeshModule.setOptions({
  maxNumFaces: 1,  // Track at most one face
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});

const videoElement = document.querySelector('#videoElement');  // Your video element for input
const canvasElement = document.querySelector('#outputCanvas');  // Your canvas for drawing output
const ctx = canvasElement.getContext('2d');

// Handle media input (video or webcam)
navigator.mediaDevices.getUserMedia({ video: true })
  .then((stream) => {
    videoElement.srcObject = stream;
  })
  .catch((err) => console.error('Error accessing camera:', err));

videoElement.onloadeddata = () => {
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;
  runFaceMesh();
};

// Set flag for lipreading mode
let lipreadingMode = false;

document.querySelector('#lipreadingToggle').addEventListener('click', () => {
  lipreadingMode = !lipreadingMode;
  console.log(lipreadingMode ? 'Lipreading Activated' : 'Lipreading Deactivated');
  if (lipreadingMode) {
    // Initialize lipreading when activated
    startLipreading(videoElement);
  }
});

function runFaceMesh() {
  const camera = new Camera(videoElement, {
    onFrame: async () => {
      await detectMouth(videoElement);
    },
    width: 640,
    height: 480,
  });
  camera.start();
}

async function detectMouth(video) {
  const input = cv.imread(video);
  const results = await faceMeshModule.send({image: input});

  if (results.multiFaceLandmarks) {
    results.multiFaceLandmarks.forEach((landmarks) => {
      // Mouth landmarks: indices 61-80 from the MediaPipe Face Mesh model
      const mouthLandmarks = landmarks.slice(61, 81);

      // Extract the mouth region coordinates (x, y)
      const mouthRegion = mouthLandmarks.map((point) => {
        return [point.x * video.width, point.y * video.height];
      });

      if (lipreadingMode) {
        // Optionally: Pass mouthRegion to the lipreading inference system here
        console.log('Mouth detected, lipreading activated');
        startLipreading(mouthRegion);
      }

      // Draw the mouth region
      ctx.beginPath();
      ctx.moveTo(mouthRegion[0][0], mouthRegion[0][1]);
      mouthRegion.forEach(([x, y]) => {
        ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }
}

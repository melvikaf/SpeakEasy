import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

function LipReadingComponent({ onMouthMovementDetected }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const modelRef = useRef(null);

  useEffect(() => {
    setupCamera();
    loadModel();
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const loadModel = async () => {
    try {
      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      const detectorConfig = {
        runtime: 'tfjs',
        refineLandmarks: true,
      };
      modelRef.current = await faceLandmarksDetection.createDetector(
        model,
        detectorConfig
      );
      setIsLoading(false);
      detectMouthMovement();
    } catch (err) {
      console.error("Error loading face detection model:", err);
      setError("Failed to load face detection model");
      setIsLoading(false);
    }
  };

  const setupCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Failed to access camera");
      setIsLoading(false);
    }
  };

  const detectMouthMovement = async () => {
    if (!modelRef.current || !videoRef.current || !canvasRef.current || isLoading) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const detect = async () => {
      if (!modelRef.current || !videoRef.current || !canvasRef.current) return;

      try {
        // Detect face landmarks
        const faces = await modelRef.current.estimateFaces({
          input: video,
          returnTensors: false,
          flipHorizontal: false,
        });

        if (faces.length > 0) {
          const face = faces[0];
          
          // Get lip landmarks (indices 61-68 for outer lip, 78-83 for inner lip)
          const outerLip = face.keypoints.slice(61, 69);
          const innerLip = face.keypoints.slice(78, 84);

          // Calculate mouth openness
          const upperLip = outerLip[2];
          const lowerLip = outerLip[6];
          const mouthOpenness = Math.abs(upperLip.y - lowerLip.y);

          // Detect significant mouth movement
          const threshold = 10; // Adjust this threshold as needed
          const isMouthMoving = mouthOpenness > threshold;

          // Draw face mesh
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Draw lip landmarks
          ctx.fillStyle = isMouthMoving ? 'red' : 'green';
          outerLip.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
            ctx.fill();
          });

          // Notify parent component about mouth movement
          onMouthMovementDetected(isMouthMoving);
        }
      } catch (err) {
        console.error("Error detecting mouth movement:", err);
      }

      // Continue detection loop
      requestAnimationFrame(detect);
    };

    detect();
  };

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full rounded-lg"
        style={{ transform: 'scaleX(-1)' }}
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
          <div className="text-white">Loading face detection model...</div>
        </div>
      )}
    </div>
  );
}

export default LipReadingComponent; 
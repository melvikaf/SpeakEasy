import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

function LipReadingComponent({ onMouthMovementDetected }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');
  const detectorRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    setupCamera();
    loadModel();
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const loadModel = async () => {
    try {
      setDebugInfo('Loading face detection model...');
      // Initialize TensorFlow.js
      await tf.setBackend('webgl');
      await tf.ready();
      
      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      const detectorConfig = {
        runtime: 'tfjs',
        refineLandmarks: true,
        maxFaces: 1,
      };
      
      detectorRef.current = await faceLandmarksDetection.createDetector(
        model,
        detectorConfig
      );
      
      setIsLoading(false);
      setDebugInfo('Model loaded successfully');
    } catch (err) {
      setError('Failed to load face detection model');
      setDebugInfo('Error loading model: ' + err.message);
      console.error('Error loading model:', err);
    }
  };

  const setupCamera = async () => {
    try {
      setDebugInfo('Setting up camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = resolve;
        });
        
        if (canvasRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
          setDebugInfo(`Camera setup complete. Resolution: ${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`);
        }
      }
    } catch (err) {
      setError('Failed to access camera');
      setDebugInfo('Error accessing camera: ' + err.message);
      console.error('Error accessing camera:', err);
    }
  };

  const detectMouthMovement = async () => {
    if (!detectorRef.current || !videoRef.current || !canvasRef.current) {
      const msg = 'Detector or video/canvas not ready';
      console.log(msg);
      setDebugInfo(msg);
      return;
    }

    try {
      // Get video frame
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Draw video frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Detect faces
      const msg = 'Attempting face detection...';
      console.log(msg);
      setDebugInfo(msg);
      
      const faces = await detectorRef.current.estimateFaces(video, {
        flipHorizontal: false,
        staticMode: false,
        returnTensors: false,
      });

      const faceMsg = `Found ${faces.length} faces`;
      console.log(faceMsg);
      setDebugInfo(faceMsg);

      if (faces.length > 0) {
        const face = faces[0];
        const confidenceMsg = `Face detected! Confidence: ${(face.score * 100).toFixed(2)}%`;
        console.log(confidenceMsg);
        setDebugInfo(confidenceMsg);

        // Log total number of keypoints
        const keypointsMsg = `Total keypoints: ${face.keypoints.length}`;
        console.log(keypointsMsg);
        setDebugInfo(prev => `${prev}\n${keypointsMsg}`);

        // Get lip landmarks
        const outerLip = face.keypoints.slice(61, 69);
        const innerLip = face.keypoints.slice(78, 84);

        // Log lip landmark positions
        const lipMsg = `Outer lip points: ${outerLip.length}\nInner lip points: ${innerLip.length}`;
        console.log(lipMsg);
        setDebugInfo(prev => `${prev}\n${lipMsg}`);

        // Draw all face landmarks for debugging
        ctx.fillStyle = 'blue';
        face.keypoints.forEach((point, index) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI);
          ctx.fill();
          
          // Draw landmark numbers
          ctx.fillStyle = 'white';
          ctx.font = '8px Arial';
          ctx.fillText(index, point.x + 2, point.y + 2);
        });

        // Draw outer lip landmarks
        ctx.fillStyle = 'red';
        outerLip.forEach((point, index) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
          ctx.fill();
          // Log outer lip point coordinates
          setDebugInfo(prev => `${prev}\nOuter lip ${index}: (${point.x.toFixed(1)}, ${point.y.toFixed(1)})`);
        });

        // Draw inner lip landmarks
        ctx.fillStyle = 'green';
        innerLip.forEach((point, index) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
          ctx.fill();
          // Log inner lip point coordinates
          setDebugInfo(prev => `${prev}\nInner lip ${index}: (${point.x.toFixed(1)}, ${point.y.toFixed(1)})`);
        });

        // Calculate mouth openness
        const upperLip = outerLip[2];
        const lowerLip = outerLip[6];
        const mouthOpenness = Math.abs(upperLip.y - lowerLip.y);
        const threshold = 10;
        const isMouthMoving = mouthOpenness > threshold;

        // Log mouth openness calculation
        const mouthMsg = `Mouth openness: ${mouthOpenness.toFixed(1)}\nThreshold: ${threshold}\nStatus: ${isMouthMoving ? 'Moving' : 'Still'}`;
        console.log(mouthMsg);
        setDebugInfo(prev => `${prev}\n${mouthMsg}`);

        // Draw mouth openness indicator
        ctx.fillStyle = isMouthMoving ? 'red' : 'green';
        ctx.font = '16px Arial';
        ctx.fillText(`Mouth Openness: ${mouthOpenness.toFixed(1)}`, 10, 30);
        ctx.fillText(`Threshold: ${threshold}`, 10, 50);
        ctx.fillText(`Status: ${isMouthMoving ? 'Moving' : 'Still'}`, 10, 70);

        onMouthMovementDetected(isMouthMoving);
      } else {
        const noFaceMsg = 'No face detected. Please position your face in front of the camera.';
        console.log(noFaceMsg);
        setDebugInfo(noFaceMsg);
      }
    } catch (err) {
      console.error('Error detecting mouth movement:', err);
      const errorMsg = `Error during detection: ${err.message}`;
      setDebugInfo(prev => `${prev}\n${errorMsg}`);
    }

    animationFrameRef.current = requestAnimationFrame(detectMouthMovement);
  };

  useEffect(() => {
    if (!isLoading && !error) {
      detectMouthMovement();
    }
  }, [isLoading, error]);

  if (error) {
    return (
      <div className="text-red-500 p-4 rounded-lg bg-red-50">
        {error}
      </div>
    );
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full rounded-lg"
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
      <div className="mt-4 p-4 bg-black bg-opacity-75 text-white rounded-lg text-sm whitespace-pre-line max-h-48 overflow-y-auto">
        <div className="font-bold mb-2">Debug Information:</div>
        {debugInfo}
      </div>
    </div>
  );
}

export default LipReadingComponent; 
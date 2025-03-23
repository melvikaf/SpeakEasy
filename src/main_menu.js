import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';

// Make sure TensorFlow.js is using WebGL backend
tf.setBackend('webgl');

// Add ASL tips object before the finger position helper functions
const ASL_TIPS = {
  A: {
    position: "Make a fist with thumb resting on the side",
    common_mistakes: "Don't let fingers spread, keep thumb relaxed",
    tip: "Think of holding a small ball tightly"
  },
  B: {
    position: "Hold all fingers straight up, thumb tucked",
    common_mistakes: "Don't spread fingers too wide, keep them together",
    tip: "Imagine your hand is a flat board"
  },
  C: {
    position: "Curve all fingers and thumb to form C shape",
    common_mistakes: "Don't make it too tight or too open",
    tip: "Like holding a small cup"
  },
  D: {
    position: "Index finger up, other fingers together",
    common_mistakes: "Keep other fingers together, not spread",
    tip: "Like pointing up to the sky"
  },
  E: {
    position: "Curl all fingers, thumb tucked under",
    common_mistakes: "Don't let fingers spread while curling",
    tip: "Like a bird's claw"
  },
  F: {
    position: "Touch thumb to index, other fingers up",
    common_mistakes: "Keep other fingers straight and together",
    tip: "Like making the 'OK' sign but with fingers up"
  },
  G: {
    position: "Point index finger to side, thumb out",
    common_mistakes: "Don't point forward, keep to the side",
    tip: "Like a gun pointing sideways"
  },
  H: {
    position: "Index and middle finger together, pointing side",
    common_mistakes: "Keep fingers parallel, not crossed",
    tip: "Like the number 2 rotated sideways"
  },
  I: {
    position: "Pinky up, other fingers closed",
    common_mistakes: "Keep other fingers tight in fist",
    tip: "Like a formal pinky up gesture"
  },
  J: {
    position: "Like I, but trace a J shape",
    common_mistakes: "Start with pinky up, then trace",
    tip: "Think of drawing J in the air"
  },
  K: {
    position: "Index and middle up in V, thumb between",
    common_mistakes: "Don't let fingers touch",
    tip: "Peace sign with thumb between fingers"
  },
  L: {
    position: "Index up, thumb out to side",
    common_mistakes: "Keep angle at 90 degrees",
    tip: "Make a real L shape"
  },
  M: {
    position: "Three fingers over thumb",
    common_mistakes: "Don't show thumb, keep fingers together",
    tip: "Like covering thumb with 3 fingers"
  },
  N: {
    position: "Two fingers over thumb",
    common_mistakes: "Keep fingers together, pointing down",
    tip: "Like M but with two fingers only"
  },
  O: {
    position: "All fingers curved to meet thumb",
    common_mistakes: "Make a clear circle, not too tight",
    tip: "Like making a bubble with your hand"
  },
  P: {
    position: "Point index down, thumb out",
    common_mistakes: "Keep thumb visible from side",
    tip: "Like K rotated down"
  },
  Q: {
    position: "Index down at side, thumb out",
    common_mistakes: "Keep hand vertical",
    tip: "Like G pointing down"
  },
  R: {
    position: "Cross index and middle finger",
    common_mistakes: "Keep fingers crossed, not just together",
    tip: "Like crossing fingers for luck"
  },
  S: {
    position: "Fist with thumb in front of fingers",
    common_mistakes: "Keep thumb in front, not to side",
    tip: "Like A but thumb in front"
  },
  T: {
    position: "Thumb between index and middle",
    common_mistakes: "Keep thumb visible",
    tip: "Like putting thumb between 2 fingers"
  },
  U: {
    position: "Index and middle up together",
    common_mistakes: "Keep fingers close and parallel",
    tip: "Peace sign but fingers together"
  },
  V: {
    position: "Index and middle in V shape",
    common_mistakes: "Don't make V too wide or narrow",
    tip: "Classic peace sign"
  },
  W: {
    position: "Index, middle, and ring fingers up",
    common_mistakes: "Keep fingers spread evenly",
    tip: "Think of number 3 but spread out"
  },
  X: {
    position: "Hook index finger, other fingers closed",
    common_mistakes: "Make clear hook shape",
    tip: "Like holding a tiny hook"
  },
  Y: {
    position: "Thumb and pinky out, others closed",
    common_mistakes: "Keep thumb and pinky straight",
    tip: "Like a surfer's 'hang loose' sign"
  },
  Z: {
    position: "Index finger traces Z shape",
    common_mistakes: "Make clear angles in Z motion",
    tip: "Draw Z in the air"
  }
};

// Finger position helper functions
const fingerIsOpen = (finger, landmarks) => {
  const tipY = landmarks[finger[3]][1];
  const baseY = landmarks[finger[0]][1];
  return tipY < baseY;
};

const getFingerPositions = (landmarks) => {
  // Define finger landmark indices
  const thumbIndices = [1, 2, 3, 4];
  const indexFingerIndices = [5, 6, 7, 8];
  const middleFingerIndices = [9, 10, 11, 12];
  const ringFingerIndices = [13, 14, 15, 16];
  const pinkyIndices = [17, 18, 19, 20];

  // Get vertical positions (y-coordinates)
  const tipY = (finger) => landmarks[finger[3]][1];
  const baseY = (finger) => landmarks[finger[0]][1];
  const midY = (finger) => landmarks[finger[2]][1];

  // Get horizontal positions (x-coordinates)
  const tipX = (finger) => landmarks[finger[3]][0];
  const baseX = (finger) => landmarks[finger[0]][0];

  // Calculate angles and distances for more complex gestures
  const fingerAngle = (finger) => {
    const dx = tipX(finger) - baseX(finger);
    const dy = tipY(finger) - baseY(finger);
    return Math.atan2(dy, dx) * 180 / Math.PI;
  };

  return {
    // Basic finger positions (up/down)
    thumb: tipY(thumbIndices) < baseY(thumbIndices),
    indexFinger: tipY(indexFingerIndices) < baseY(indexFingerIndices),
    middleFinger: tipY(middleFingerIndices) < baseY(middleFingerIndices),
    ringFinger: tipY(ringFingerIndices) < baseY(ringFingerIndices),
    pinky: tipY(pinkyIndices) < baseY(pinkyIndices),

    // Mid-point checks for bent fingers
    indexBent: midY(indexFingerIndices) < tipY(indexFingerIndices),
    middleBent: midY(middleFingerIndices) < tipY(middleFingerIndices),
    ringBent: midY(ringFingerIndices) < tipY(ringFingerIndices),
    pinkyBent: midY(pinkyIndices) < tipY(pinkyIndices),

    // Horizontal positions for crossed fingers
    indexX: tipX(indexFingerIndices),
    middleX: tipX(middleFingerIndices),
    ringX: tipX(ringFingerIndices),
    pinkyX: tipX(pinkyIndices),

    // Angles for specific letters
    thumbAngle: fingerAngle(thumbIndices),
    indexAngle: fingerAngle(indexFingerIndices)
  };
};

const predictASLLetter = (landmarks) => {
  const pos = getFingerPositions(landmarks);
  
  // A: Fist with thumb to the side
  if (!pos.indexFinger && !pos.middleFinger && !pos.ringFinger && !pos.pinky) {
    return { letter: 'A', confidence: 87 };
  }
  
  // B: All fingers up, thumb tucked
  if (pos.indexFinger && pos.middleFinger && pos.ringFinger && pos.pinky) {
    return { letter: 'B', confidence: 92 };
  }
  
  // C: Curved hand, like holding a cup
  if (!pos.indexFinger && !pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      pos.indexBent && pos.middleBent && pos.ringBent && pos.pinkyBent) {
    return { letter: 'C', confidence: 85 };
  }
  
  // D: Index up, others down
  if (pos.indexFinger && !pos.middleFinger && !pos.ringFinger && !pos.pinky) {
    return { letter: 'D', confidence: 88 };
  }
  
  // E: All fingers bent down
  if (!pos.indexFinger && !pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      pos.indexBent && pos.middleBent && pos.ringBent && pos.pinkyBent) {
    return { letter: 'E', confidence: 86 };
  }
  
  // F: Index and thumb connected, others up
  if (!pos.indexFinger && pos.middleFinger && pos.ringFinger && pos.pinky &&
      pos.indexBent) {
    return { letter: 'F', confidence: 84 };
  }
  
  // G: Index pointing to the side, thumb out
  if (pos.indexFinger && !pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      Math.abs(pos.indexAngle) > 45) {
    return { letter: 'G', confidence: 83 };
  }
  
  // H: Index and middle out to the side
  if (pos.indexFinger && pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      Math.abs(pos.indexAngle) > 45) {
    return { letter: 'H', confidence: 82 };
  }
  
  // I: Pinky up only
  if (!pos.indexFinger && !pos.middleFinger && !pos.ringFinger && pos.pinky) {
    return { letter: 'I', confidence: 88 };
  }
  
  // J: Like I but with a motion (simplified to pinky out to side)
  if (!pos.indexFinger && !pos.middleFinger && !pos.ringFinger && pos.pinky &&
      Math.abs(pos.indexAngle) > 45) {
    return { letter: 'J', confidence: 80 };
  }
  
  // K: Index and middle up, palm facing forward
  if (pos.indexFinger && pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      Math.abs(pos.indexX - pos.middleX) > 20) {
    return { letter: 'K', confidence: 85 };
  }
  
  // L: L-shape with index and thumb
  if (pos.indexFinger && !pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      Math.abs(pos.thumbAngle - pos.indexAngle) > 60) {
    return { letter: 'L', confidence: 89 };
  }
  
  // M: Three fingers over thumb
  if (!pos.indexFinger && !pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      pos.indexBent && pos.middleBent && pos.ringBent) {
    return { letter: 'M', confidence: 84 };
  }
  
  // N: Two fingers over thumb
  if (!pos.indexFinger && !pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      pos.indexBent && pos.middleBent && !pos.ringBent) {
    return { letter: 'N', confidence: 83 };
  }
  
  // O: Rounded O shape
  if (!pos.indexFinger && !pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      pos.indexBent && pos.middleBent && pos.ringBent && pos.pinkyBent) {
    return { letter: 'O', confidence: 87 };
  }
  
  // P: Index pointing down, thumb out
  if (!pos.indexFinger && !pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      pos.indexBent) {
    return { letter: 'P', confidence: 82 };
  }
  
  // Q: Index down, thumb to side
  if (!pos.indexFinger && !pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      pos.indexBent && Math.abs(pos.thumbAngle) > 45) {
    return { letter: 'Q', confidence: 81 };
  }
  
  // R: Crossed index and middle
  if (pos.indexFinger && pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      Math.abs(pos.indexX - pos.middleX) < 10) {
    return { letter: 'R', confidence: 84 };
  }
  
  // S: Fist with thumb in front
  if (!pos.indexFinger && !pos.middleFinger && !pos.ringFinger && !pos.pinky) {
    return { letter: 'S', confidence: 86 };
  }
  
  // T: Index bent, thumb between index and middle
  if (!pos.indexFinger && !pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      pos.indexBent) {
    return { letter: 'T', confidence: 83 };
  }
  
  // U: Index and middle parallel up
  if (pos.indexFinger && pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      Math.abs(pos.indexX - pos.middleX) < 20) {
    return { letter: 'U', confidence: 88 };
  }
  
  // V: Index and middle in V shape
  if (pos.indexFinger && pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      Math.abs(pos.indexX - pos.middleX) > 20) {
    return { letter: 'V', confidence: 90 };
  }
  
  // W: Index, middle, and ring spread
  if (pos.indexFinger && pos.middleFinger && pos.ringFinger && !pos.pinky) {
    return { letter: 'W', confidence: 87 };
  }
  
  // X: Index bent hook
  if (!pos.indexFinger && !pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      pos.indexBent) {
    return { letter: 'X', confidence: 82 };
  }
  
  // Y: Thumb and pinky out
  if (!pos.indexFinger && !pos.middleFinger && !pos.ringFinger && pos.pinky &&
      Math.abs(pos.thumbAngle) > 45) {
    return { letter: 'Y', confidence: 85 };
  }
  
  // Z: Index drawing Z shape (simplified to index pointing to side)
  if (pos.indexFinger && !pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      Math.abs(pos.indexAngle) > 45) {
    return { letter: 'Z', confidence: 80 };
  }

  return { letter: '?', confidence: 30 };
};

function CameraComponent({ deviceId, setPrediction, setError }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [handModel, setHandModel] = useState(null);
  const predictionIntervalRef = useRef(null);

  const updateCanvasDimensions = () => {
    if (videoRef.current && canvasRef.current) {
      canvasRef.current.width = videoRef.current.offsetWidth;
      canvasRef.current.height = videoRef.current.offsetHeight;
    }
  };

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            deviceId: deviceId ? { exact: deviceId } : undefined,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            updateCanvasDimensions();
          };
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setError("Camera error: " + err.message);
      }
    }

    async function loadHandModel() {
      try {
        const model = await handpose.load();
        setHandModel(model);
      } catch (err) {
        console.error("Error loading hand model:", err);
        setError("Failed to load hand detection model: " + err.message);
      }
    }
    
    setupCamera();
    loadHandModel();
    window.addEventListener('resize', updateCanvasDimensions);
    
    return () => {
      window.removeEventListener('resize', updateCanvasDimensions);
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      if (predictionIntervalRef.current) {
        clearInterval(predictionIntervalRef.current);
      }
    };
  }, [deviceId, setError]);

  const getBoundingBox = (landmarks) => {
    const xs = landmarks.map(l => l[0]);
    const ys = landmarks.map(l => l[1]);
    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys)
    };
  };

  const drawHandLandmarks = (landmarks) => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    
    // Clear the entire canvas to ensure all previous drawings are removed
    ctx.save();  // Save the current state
    ctx.setTransform(1, 0, 0, 1, 0, 0);  // Reset any transformations applied before
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.restore();  // Restore the previous state

    // Draw hand landmarks
    ctx.fillStyle = '#00FF00';
    landmarks.forEach(point => {
      ctx.beginPath();
      ctx.arc(point[0], point[1], 5, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw bounding box
    const box = getBoundingBox(landmarks);
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.strokeRect(box.x, box.y, box.width, box.height);
  };

  const predict = async () => {
    if (!videoRef.current || !handModel || isLoading) return;

    setIsLoading(true);
    try {
      const hands = await handModel.estimateHands(videoRef.current);
      
      if (hands.length > 0) {
        const landmarks = hands[0].landmarks;
        const prediction = predictASLLetter(landmarks);
        
        setPrediction({
          top_prediction: prediction.letter,
          predictions: [
            { letter: prediction.letter, confidence: prediction.confidence }
          ]
        });
        
        setError(null);
        drawHandLandmarks(landmarks);
      } else {
        setError("No hand detected - Please ensure your hand is clearly visible in the camera");
        setPrediction(null);
        if (canvasRef.current) {
          const ctx = canvasRef.current.getContext('2d');
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    } catch (error) {
      console.error("Error making prediction:", error);
      setError(error.message);
      setPrediction(null);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePrediction = () => {
    if (isPredicting) {
      if (predictionIntervalRef.current) {
        clearInterval(predictionIntervalRef.current);
        predictionIntervalRef.current = null;
      }
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    } else {
      predict();
      predictionIntervalRef.current = setInterval(predict, 1000);
    }
    setIsPredicting(!isPredicting);
  };

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-[300px] object-cover rounded-xl"
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-[300px]"
        style={{ pointerEvents: 'none' }}
      />
      <br />
      <button 
        className={`w-full py-3 px-6 rounded-full text-black font-medium ${
          isPredicting ? 'bg-red-400 hover:bg-red-500' : 'bg-[#E5CBFF] hover:bg-[#D4B3FF]'
        }`}
        onClick={togglePrediction}
        disabled={!handModel}
      >
        {!handModel ? 'Loading hand detection...' : 
         isPredicting ? 'Stop Prediction' : 'Start Live Prediction'}
      </button>
    </div>
  );
}

function MainMenu() {
  const navigate = useNavigate();
  const [cameras, setCameras] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [showTips, setShowTips] = useState(true);  // New state for tips visibility

  useEffect(() => {
    async function getCameras() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setCameras(videoDevices);
      } catch (err) {
        console.error("Error getting cameras:", err);
        setError("Failed to get camera list: " + err.message);
      }
    }
    
    getCameras();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F8FF] p-8">
      <button 
        className="mb-8 px-6 py-2 bg-[#E5CBFF] text-black rounded-full hover:bg-[#D4B3FF] flex items-center gap-2"
        onClick={() => navigate(-1)}
      >
        ← Return
      </button>

      <div className="flex gap-8">
        <div className="flex-1 bg-white rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-6">User 1</h2>
          <div>
            {cameras.length > 0 ? (
              <CameraComponent 
                deviceId={cameras[0].deviceId} 
                setPrediction={setPrediction}
                setError={setError}
              />
            ) : (
              <div className="text-red-500">No cameras found</div>
            )}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-lg p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Output Transcript</h2>
            <button
              className="text-sm text-purple-600 hover:text-purple-800"
              onClick={() => setShowTips(!showTips)}
            >
              {showTips ? 'Hide Tips' : 'Show Tips'}
            </button>
          </div>
          
          {error ? (
            <div className="text-red-500 p-4 rounded-lg bg-red-50">
              {error}
            </div>
          ) : prediction ? (
            <div className="space-y-4">
              <div className="text-4xl font-bold text-center">
                {prediction.top_prediction}
              </div>
              {showTips && ASL_TIPS[prediction.top_prediction] && (
                <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-semibold text-purple-800">Tips for Letter {prediction.top_prediction}</h3>
                  <div className="mt-2 space-y-2 text-sm">
                    <p><span className="font-medium">Position:</span> {ASL_TIPS[prediction.top_prediction].position}</p>
                    <p><span className="font-medium">Common Mistakes:</span> {ASL_TIPS[prediction.top_prediction].common_mistakes}</p>
                    <p><span className="font-medium">Tip:</span> {ASL_TIPS[prediction.top_prediction].tip}</p>
                  </div>
                </div>
              )}
              <div className="mt-8 space-y-2">
                <h3 className="text-lg font-semibold">Top Predictions:</h3>
                {prediction.predictions.map((pred, index) => (
                  <div 
                    key={index}
                    className="flex justify-between items-center p-2 bg-gray-50 rounded"
                  >
                    <span className="font-medium">Letter {pred.letter}</span>
                    <span className="text-gray-600">{pred.confidence.toFixed(1)}% confident</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-center">
              Click "Start Live Prediction" to begin
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MainMenu;

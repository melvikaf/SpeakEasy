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
    return { letter: 'A' };
  }
  
  // B: All fingers up, thumb tucked
  if (pos.indexFinger && pos.middleFinger && pos.ringFinger && pos.pinky) {
    return { letter: 'B' };
  }
  
  // C: Curved hand, like holding a cup
  if (!pos.indexFinger && !pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      pos.indexBent && pos.middleBent && pos.ringBent && pos.pinkyBent) {
    return { letter: 'C' };
  }
  
  // D: Index up, others down
  if (pos.indexFinger && !pos.middleFinger && !pos.ringFinger && !pos.pinky) {
    return { letter: 'D' };
  }
  
  // E: All fingers bent down
  if (!pos.indexFinger && !pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      pos.indexBent && pos.middleBent && pos.ringBent && pos.pinkyBent) {
    return { letter: 'E' };
  }
  
  // F: Index and thumb connected, others up
  if (!pos.indexFinger && pos.middleFinger && pos.ringFinger && pos.pinky &&
      pos.indexBent) {
    return { letter: 'F' };
  }
  
  // G: Index pointing to the side, thumb out
  if (pos.indexFinger && !pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      Math.abs(pos.indexAngle) > 45) {
    return { letter: 'G' };
  }
  
  // H: Index and middle out to the side
  if (pos.indexFinger && pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      Math.abs(pos.indexAngle) > 45) {
    return { letter: 'H' };
  }
  
  // I: Pinky up only
  if (!pos.indexFinger && !pos.middleFinger && !pos.ringFinger && pos.pinky) {
    return { letter: 'I' };
  }
  
  // J: Like I but with a motion (simplified to pinky out to side)
  if (!pos.indexFinger && !pos.middleFinger && !pos.ringFinger && pos.pinky &&
      Math.abs(pos.indexAngle) > 45) {
    return { letter: 'J' };
  }
  
  // K: Index and middle up, palm facing forward
  if (pos.indexFinger && pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      Math.abs(pos.indexX - pos.middleX) > 20) {
    return { letter: 'K' };
  }
  
  // L: L-shape with index and thumb
  if (pos.indexFinger && !pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      Math.abs(pos.thumbAngle - pos.indexAngle) > 60) {
    return { letter: 'L' };
  }
  
  // M: Three fingers over thumb
  if (!pos.indexFinger && !pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      pos.indexBent && pos.middleBent && pos.ringBent) {
    return { letter: 'M' };
  }
  
  // N: Two fingers over thumb
  if (!pos.indexFinger && !pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      pos.indexBent && pos.middleBent && !pos.ringBent) {
    return { letter: 'N' };
  }
  
  // O: Rounded O shape
  if (!pos.indexFinger && !pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      pos.indexBent && pos.middleBent && pos.ringBent && pos.pinkyBent) {
    return { letter: 'O' };
  }
  
  // P: Index pointing down, thumb out
  if (!pos.indexFinger && !pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      pos.indexBent) {
    return { letter: 'P' };
  }
  
  // Q: Index down, thumb to side
  if (!pos.indexFinger && !pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      pos.indexBent && Math.abs(pos.thumbAngle) > 45) {
    return { letter: 'Q' };
  }
  
  // R: Crossed index and middle
  if (pos.indexFinger && pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      Math.abs(pos.indexX - pos.middleX) < 10) {
    return { letter: 'R' };
  }
  
  // S: Fist with thumb in front
  if (!pos.indexFinger && !pos.middleFinger && !pos.ringFinger && !pos.pinky) {
    return { letter: 'S' };
  }
  
  // T: Index bent, thumb between index and middle
  if (!pos.indexFinger && !pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      pos.indexBent) {
    return { letter: 'T' };
  }
  
  // U: Index and middle parallel up
  if (pos.indexFinger && pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      Math.abs(pos.indexX - pos.middleX) < 20) {
    return { letter: 'U' };
  }
  
  // V: Index and middle in V shape
  if (pos.indexFinger && pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      Math.abs(pos.indexX - pos.middleX) > 20) {
    return { letter: 'V' };
  }
  
  // W: Index, middle, and ring spread
  if (pos.indexFinger && pos.middleFinger && pos.ringFinger && !pos.pinky) {
    return { letter: 'W' };
  }
  
  // X: Index bent hook
  if (!pos.indexFinger && !pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      pos.indexBent) {
    return { letter: 'X' };
  }
  
  // Y: Thumb and pinky out
  if (!pos.indexFinger && !pos.middleFinger && !pos.ringFinger && pos.pinky &&
      Math.abs(pos.thumbAngle) > 45) {
    return { letter: 'Y' };
  }
  
  // Z: Index drawing Z shape (simplified to index pointing to side)
  if (pos.indexFinger && !pos.middleFinger && !pos.ringFinger && !pos.pinky &&
      Math.abs(pos.indexAngle) > 45) {
    return { letter: 'Z' };
  }

  return { letter: '?' };
};

// Add Emergency Phrases data
const EMERGENCY_PHRASES = {
  'HELP': {
    text: 'I need immediate assistance',
    color: 'bg-red-100 hover:bg-red-200',
    icon: '🆘'
  },
  'PAIN': {
    text: 'I am in pain',
    color: 'bg-orange-100 hover:bg-orange-200',
    icon: '🤕'
  },
  'WATER': {
    text: 'I need water',
    color: 'bg-blue-100 hover:bg-blue-200',
    icon: '💧'
  },
  'BATHROOM': {
    text: 'I need to use the bathroom',
    color: 'bg-purple-100 hover:bg-purple-200',
    icon: '🚽'
  },
  'MEDICINE': {
    text: 'I need my medicine',
    color: 'bg-green-100 hover:bg-green-200',
    icon: '💊'
  },
  'TIRED': {
    text: 'I am tired',
    color: 'bg-yellow-100 hover:bg-yellow-200',
    icon: '😴'
  }
};

// Add Practice Mode data
const DIFFICULTY_LEVELS = {
  BEGINNER: {
    letters: ['A', 'B', 'C', 'I', 'O'],
    description: 'Simple hand shapes, perfect for starting',
    color: 'bg-green-100 hover:bg-green-200',
    icon: '🌱'
  },
  INTERMEDIATE: {
    letters: ['D', 'E', 'F', 'K', 'L'],
    description: 'More complex shapes, good for practice',
    color: 'bg-yellow-100 hover:bg-yellow-200',
    icon: '⭐'
  },
  ADVANCED: {
    letters: ['J', 'Q', 'R', 'X', 'Z'],
    description: 'Challenging letters with motion',
    color: 'bg-red-100 hover:bg-red-200',
    icon: '🏆'
  }
};

// Emergency Panel Component
const EmergencyPanel = ({ onPhraseClick }) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span>Quick Communication</span>
        <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">Emergency</span>
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(EMERGENCY_PHRASES).map(([key, { text, color, icon }]) => (
          <button
            key={key}
            className={`p-3 ${color} rounded-lg text-left transition-all transform hover:scale-102 flex items-center gap-2`}
            onClick={() => onPhraseClick(text)}
          >
            <span className="text-2xl">{icon}</span>
            <div>
              <div className="font-semibold">{key}</div>
              <div className="text-sm text-gray-600">{text}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Practice Mode Component
const PracticeMode = ({ onLetterSelect, currentPrediction }) => {
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [currentLetter, setCurrentLetter] = useState(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (currentPrediction && currentLetter) {
      if (currentPrediction === currentLetter) {
        setScore(prev => prev + 1);
        setFeedback({ type: 'success', message: 'Correct! Well done! 🎉' });
        // Set new letter after a brief delay
        setTimeout(() => {
          if (selectedLevel) {
            const letters = DIFFICULTY_LEVELS[selectedLevel].letters;
            const newLetter = letters[Math.floor(Math.random() * letters.length)];
            setCurrentLetter(newLetter);
            setFeedback(null);
          }
        }, 1500);
      }
    }
  }, [currentPrediction, currentLetter]);

  const startPractice = (level) => {
    setSelectedLevel(level);
    const letters = DIFFICULTY_LEVELS[level].letters;
    setCurrentLetter(letters[Math.floor(Math.random() * letters.length)]);
    setScore(0);
    setFeedback(null);
  };

  const resetPractice = () => {
    setSelectedLevel(null);
    setCurrentLetter(null);
    setScore(0);
    setFeedback(null);
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Practice Mode</h3>
        {selectedLevel && (
          <button
            onClick={resetPractice}
            className="text-sm text-purple-600 hover:text-purple-800"
          >
            Exit Practice
          </button>
        )}
      </div>

      {!selectedLevel ? (
        <div className="space-y-3">
          {Object.entries(DIFFICULTY_LEVELS).map(([level, { description, color, icon }]) => (
            <button
              key={level}
              className={`w-full p-3 ${color} rounded-lg text-left transition-all flex items-center gap-3`}
              onClick={() => startPractice(level)}
            >
              <span className="text-2xl">{icon}</span>
              <div>
                <div className="font-semibold">{level}</div>
                <div className="text-sm text-gray-600">{description}</div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center">
          <div className="mb-4">
            <div className="text-sm text-gray-600">Current Level</div>
            <div className="font-bold text-lg">{selectedLevel}</div>
          </div>
          
          <div className="mb-6">
            <div className="text-sm text-gray-600">Score</div>
            <div className="font-bold text-3xl text-purple-600">{score}</div>
          </div>

          {currentLetter && (
            <div className="mb-6">
              <div className="text-sm text-gray-600">Make this letter</div>
              <div className="text-6xl font-bold my-4">{currentLetter}</div>
              {ASL_TIPS[currentLetter] && (
                <div className="text-sm text-gray-600 bg-purple-50 p-3 rounded">
                  {ASL_TIPS[currentLetter].tip}
                </div>
              )}
            </div>
          )}

          {feedback && (
            <div className={`mt-4 p-3 rounded ${
              feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {feedback.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
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
      }
    }

    async function loadHandModel() {
      try {
        const model = await handpose.load();
        setHandModel(model);
      } catch (err) {
        console.error("Error loading hand model:", err);
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
  }, [deviceId]);

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
            { letter: prediction.letter }
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
  const [selectedInputMethod, setSelectedInputMethod] = useState("ASL");
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [showTips, setShowTips] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [aslTranscript, setAslTranscript] = useState("");
  const [speechTranscript, setSpeechTranscript] = useState("");
  const recognition = useRef(null);

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

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      recognition.current = new window.webkitSpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      recognition.current.lang = 'en-US';

      recognition.current.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setSpeechTranscript(transcript);
      };

      recognition.current.onstart = () => {
        setIsRecording(true);
      };

      recognition.current.onend = () => {
        setIsRecording(false);
      };
    } else {
      console.error('Speech Recognition API is not supported in this browser.');
    }
  }, []);

  const startRecording = () => {
    if (recognition.current) {
      recognition.current.start();
    }
  };

  const stopRecording = () => {
    if (recognition.current) {
      recognition.current.stop();
    }
  };

  const handleAslPrediction = (prediction) => {
    setPrediction(prediction);
    if (prediction?.top_prediction) {
      setAslTranscript(prev => {
        const newLetter = prediction.top_prediction;
        if (prev.slice(-1) !== newLetter) {
          return prev + newLetter;
        }
        return prev;
      });
    }
  };

  const getCurrentTranscript = () => {
    switch (selectedInputMethod) {
      case "ASL":
        return aslTranscript || "Make ASL signs to see the translation here...";
      case "Speech to Text":
        return speechTranscript || "Start speaking to see the transcription here...";
      default:
        return "Select an input method to begin...";
    }
  };

  const getTranscriptTitle = () => {
    switch (selectedInputMethod) {
      case "ASL":
        return "ASL Translation";
      case "Speech to Text":
        return "Speech Recognition";
      default:
        return "Output Transcript";
    }
  };

  const renderOutputContent = () => {
    if (error) {
      return (
        <div className="text-red-500 p-4 rounded-lg bg-red-50">
          {error}
        </div>
      );
    }

    switch (selectedInputMethod) {
      case "ASL":
        return prediction ? (
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
          </div>
        ) : (
          <div className="text-gray-500 text-center">
            Click "Start Live Prediction" to begin ASL detection
          </div>
        );

      case "Speech to Text":
        return (
          <div className="min-h-[200px] p-4 bg-gray-50 rounded-lg">
            <p className="text-lg text-gray-700 whitespace-pre-wrap">{speechTranscript || "Start speaking to see the transcription here..."}</p>
            {isRecording && (
              <div className="mt-4 p-3 bg-green-100 rounded-lg">
                <p className="text-sm text-green-800">Recording in progress...</p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="text-gray-500 text-center">
            Select an input method to begin
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white text-gray-800 p-6 md:p-8">
      <nav className="mb-8">
        <button 
          className="bg-purple-300 text-white px-6 py-3 rounded-full hover:bg-purple-400 transition-all transform hover:scale-105"
          onClick={() => navigate(-1)}
        >
          ← Return
        </button>
      </nav>

      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
        <div className="w-full md:w-1/2 bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Input Method</h2>
          <div className="space-y-4">
            <select
              className="w-full p-4 bg-white border-2 border-purple-200 rounded-xl
                        focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300
                        text-gray-700 cursor-pointer hover:border-purple-300 transition-all
                        text-lg font-semibold"
              value={selectedInputMethod}
              onChange={(e) => setSelectedInputMethod(e.target.value)}
            >
              <option value="ASL">ASL Sign Language</option>
              <option value="Speech to Text">Speech to Text</option>
            </select>

            <div className="mt-4">
              {selectedInputMethod === "ASL" && cameras.length > 0 && (
                <CameraComponent 
                  deviceId={cameras[0].deviceId} 
                  setPrediction={handleAslPrediction}
                  setError={setError}
                />
              )}
              {selectedInputMethod === "Speech to Text" && (
          <div>
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="w-full py-3 px-6 rounded-full bg-blue-400 text-white font-medium hover:bg-blue-500 transition-all"
                    >
                      Start Talking
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="w-full py-3 px-6 rounded-full bg-red-400 text-white font-medium hover:bg-red-500 transition-all"
                    >
                      Stop Talking
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">{getTranscriptTitle()}</h2>
            {selectedInputMethod === "ASL" && (
              <button
                className="text-sm text-purple-600 hover:text-purple-800"
                onClick={() => setShowTips(!showTips)}
              >
                {showTips ? 'Hide Tips' : 'Show Tips'}
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {renderOutputContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainMenu;

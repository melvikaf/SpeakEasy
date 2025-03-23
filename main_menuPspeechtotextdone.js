import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { OpenCvProvider, useOpenCv } from 'opencv-react';

function CameraComponent({ deviceId }) {
  const videoRef = useRef(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: deviceId ? { exact: deviceId } : undefined }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    }
    
    setupCamera();
    
    // Cleanup function
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [deviceId]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="w-full h-[300px] object-cover rounded-xl"
    />
  );
}

function MainMenu() {
  const navigate = useNavigate();
  const [cameras, setCameras] = useState([]);
  const [selectedInputMethod, setSelectedInputMethod] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    async function getCameras() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setCameras(videoDevices);
      } catch (err) {
        console.error("Error getting cameras:", err);
      }
    }
    
    getCameras();
  }, []);

  // Initialize Speech Recognition API
  const recognition = useRef(null);

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
        setTranscript(transcript);
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

      {/* Split screen container */}
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
        {/* Left panel */}
        <div className="w-full md:w-1/2 bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">User</h2>
          <div className="space-y-4">
            <select
              className="w-full p-4 bg-white border-2 border-purple-200 rounded-xl
                        focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300
                        text-gray-700 cursor-pointer hover:border-purple-300 transition-all
                        text-lg font-semibold"
              value={selectedInputMethod}
              onChange={(e) => setSelectedInputMethod(e.target.value)}
            >
              <option value="" disabled>Select your input method...</option>
              <option value="ASL">ASL</option>
              <option value="Lip Reading">Lip Reading</option>
              <option value="Speech to Text">Speech to Text</option>
            </select>

            {/* Conditional rendering based on input method */}
            <div className="mt-4">
              {selectedInputMethod === "ASL" || selectedInputMethod === "Lip Reading" ? (
                cameras.length > 0 && <CameraComponent deviceId={cameras[0].deviceId} />
              ) : (
                <div>
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="bg-blue-500 text-white px-6 py-3 rounded-full hover:bg-blue-600 transition-all"
                    >
                      Start talking
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="bg-red-500 text-white px-6 py-3 rounded-full hover:bg-red-600 transition-all"
                    >
                      Stop talking
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-full md:w-1/2 bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Output transcript</h2>
          <div className="space-y-4">
            <p className="text-lg text-gray-700">{transcript}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainMenu;

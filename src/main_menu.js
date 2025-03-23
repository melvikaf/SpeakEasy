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
          <h2 className="text-3xl font-bold text-gray-900 mb-6">User 1</h2>
          <div className="space-y-4">
            <select className="w-full p-4 bg-white border-2 border-purple-200 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300
                             text-gray-700 cursor-pointer hover:border-purple-300 transition-all
                             text-lg font-semibold">
              <option value="" disabled selected>Select your input method...</option>
              <option className="py-2">ASL</option>
              <option className="py-2">Lip Reading</option>
              <option className="py-2">Speech to Text</option>
            </select>
            {/* Camera feed */}
            <div className="mt-4">
              {cameras.length > 0 && <CameraComponent deviceId={cameras[0].deviceId} />}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-full md:w-1/2 bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Output transcript</h2>
          <div className="space-y-4">
          </div>
        </div>
      </div>

      
    </div>
  );
}

export default MainMenu;

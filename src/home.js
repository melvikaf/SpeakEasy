import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white text-gray-800 p-6 md:p-8">
      <div className="max-w-6xl mx-auto mb-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Master Communication with <span className="text-purple-300">SpeakEasy</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Break down communication barriers with our ASL detection and speech recognition technology.
        </p>
        <button 
          onClick={() => navigate('/practice')}
          className="bg--purple-460 text-black text-lg px-8 py-4 rounded-full font-semibold 
                   hover:bg-purple-500 transition-all transform hover:scale-105 shadow-lg"
        >
          Start Communicating Now
        </button>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
        <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all">
          <div className="bg-blue-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text--purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-900">ASL Detection</h3>
          <p className="text-gray-600">Real-time ASL letter detection with instant feedback and helpful tips for each sign</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all">
          <div className="bg-green-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-900">Speech Recognition</h3>
          <p className="text-gray-600">Convert your speech to text in real-time with our advanced speech recognition technology</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all">
          <div className="bg-purple-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-900">Easy to Use</h3>
          <p className="text-gray-600">Simple controls and intuitive interface for seamless communication</p>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-400 to--purple-500 rounded-2xl p-8 md:p-12 max-w-6xl mx-auto text-white text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to start communicating?</h2>
        <p className="text-xl text--purple-100 mb-8">Join us in breaking down communication barriers</p>
        <button 
          onClick={() => navigate('/menu')}
          className="bg-white text-purple-400 px-8 py-4 rounded-full font-semibold 
                   hover:bg-purple-50 transition-all transform hover:scale-105 shadow-md"
        >
          Begin Your Journey
        </button>
      </div>

      <button 
        onClick={() => navigate('/menu')}
        className="bg-purple-300 text-white px-6 py-3 rounded-full"
      >
        Go to Menu
      </button>
    </div>
  );
}

export default Home;

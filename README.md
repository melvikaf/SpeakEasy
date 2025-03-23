# SpeakEasy - ASL Transcriber

A real-time American Sign Language (ASL) transcription web application using TensorFlow.js and MediaPipe Hands for hand detection and gesture recognition.

## Features

- Real-time hand detection and tracking
- ASL letter recognition (A-Z)
- Visual feedback with hand landmarks
- Confidence scores for predictions
- Clean and modern UI
- Works entirely in the browser (no backend required)

## Technologies Used

- React.js
- TensorFlow.js
- MediaPipe Hands
- Tailwind CSS
- React Router

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/SpeakEasy.git
cd SpeakEasy
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Navigate to the ASL Transcriber page
2. Allow camera access when prompted
3. Click "Start Live Prediction"
4. Make ASL signs with your hand
5. See real-time predictions with confidence scores

## Supported ASL Letters

The application can recognize all ASL letters (A-Z) with varying confidence levels. Best results are achieved with:
- Good lighting
- Clear hand visibility
- Palm facing the camera
- Steady hand position

## Contributing

Feel free to open issues and pull requests for any improvements you'd like to add.

## License

MIT License - feel free to use this project for any purpose.

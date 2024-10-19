import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios';

const DrawingCanvas = () => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [predictions, setPredictions] = useState([]);
  let xCoords = [];
  let yCoords = [];

  const digitToWord = {
    0: 'zero',
    1: 'one',
    2: 'two',
    3: 'three',
    4: 'four',
    5: 'five',
    6: 'six',
    7: 'seven',
    8: 'eight',
    9: 'nine',
  };

  useEffect(() => {
    // Set canvas size to fit the window size dynamically
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }, []);

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    const context = canvasRef.current.getContext('2d');
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    setIsDrawing(true);
    xCoords.push(offsetX);
    yCoords.push(offsetY);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    const context = canvasRef.current.getContext('2d');
    context.lineTo(offsetX, offsetY);
    context.strokeStyle = 'white';
    context.lineWidth = 4;
    context.stroke();
    xCoords.push(offsetX);
    yCoords.push(offsetY);
  };

  const endDrawing = async () => {
    setIsDrawing(false);
    if (xCoords.length === 0 || yCoords.length === 0) return;
  
    // Find the bounding box of the drawn number
    const minX = Math.min(...xCoords) - 10;
    const minY = Math.min(...yCoords) - 10;
    const maxX = Math.max(...xCoords) + 10;
    const maxY = Math.max(...yCoords) + 10;
  
    // Clear the coordinates
    xCoords = [];
    yCoords = [];
  
    // Get the image data of the bounding box
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const imageData = context.getImageData(minX, minY, maxX - minX, maxY - minY);
  
    // Create a new canvas to crop the number
    const tempCanvas = document.createElement('canvas');
    const tempContext = tempCanvas.getContext('2d');
    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    tempContext.putImageData(imageData, 0, 0);
  
    // Convert to base64 image
    const base64Image = tempCanvas.toDataURL('image/png');
  
    try {
      // Use axios to send the image to the backend for prediction
      const response = await axios.post('http://localhost:5000/predict', {
        image: base64Image
      });
  
      const result = response.data;

      // Draw the red rectangle around the predicted digit
      context.strokeStyle = 'red';
      context.lineWidth = 2;
      context.strokeRect(minX, minY, maxX - minX, maxY - minY);
  
      // Store the prediction along with the coordinates
      setPredictions((prev) => [
        ...prev,
        {
          digit: digitToWord[result.digit], // Convert digit to word
          x: minX,
          y: minY,
        },
      ]);
    } catch (error) {
      console.error('Error predicting the digit:', error);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    setPredictions([]);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        style={{ backgroundColor: 'black' }}
      />
      
      {/* Render the predictions */}
      {predictions.map((prediction, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: `${prediction.x}px`,
            top: `${prediction.y - 20}px`,
            color: 'red',
            backgroundColor: 'white',
            padding: '2px',
          }}
        >
          {prediction.digit}
        </div>
      ))}

      {/* Clear button, positioned bottom-right */}
      <button
        onClick={clearCanvas}
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          padding: '10px 20px',
          backgroundColor: '#ff4c4c',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Clear
      </button>
    </div>
  );
};

export default DrawingCanvas;

from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
from tensorflow.keras.models import load_model  
from PIL import Image
import numpy as np
import base64
from io import BytesIO

app = Flask(__name__)

# Enable CORS for all routes
CORS(app)

# Load your pre-trained Keras model
model = load_model('./recognition.keras')

def preprocess_image(image):
    """ Preprocess the image to fit the model input requirements. """
    image = image.convert('L')  # Convert to grayscale
    image = image.resize((28, 28))  # Resize to 28x28
    image = np.array(image) / 255.0  # Normalize to [0, 1]
    image = np.expand_dims(image, axis=(0, -1))  # Add batch and channel dimensions
    return image

@app.route('/hello', methods=['GET'])
def hello():
    return "Hello, World!"

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    image_data = data.get('image')

    # Decode the base64 image
    if image_data:
        image_data = image_data.split(",")[1]  # Remove the metadata part
        image = Image.open(BytesIO(base64.b64decode(image_data)))

        # Preprocess the image and make predictions
        processed_image = preprocess_image(image)
        prediction = model.predict(processed_image)
        predicted_digit = np.argmax(prediction)

        return jsonify({'digit': int(predicted_digit)})

    return jsonify({'error': 'No image data received'}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

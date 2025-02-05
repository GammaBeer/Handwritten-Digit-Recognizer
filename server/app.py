from flask import Flask, request, jsonify
from flask_cors import CORS  
from tensorflow.keras.models import load_model  
from PIL import Image
import numpy as np
import base64
from io import BytesIO

app = Flask(__name__)

# Enable CORS for all routes
CORS(app, resources={r"/*": {"origins": "*"}})

# Load the trained model once at startup
model = load_model('./recognition.keras')

def preprocess_image(image):
    """ Convert image to grayscale, resize to 28x28, normalize, and reshape for model input. """
    image = image.convert('L')  
    image = image.resize((28, 28))  
    image = np.array(image) / 255.0  
    image = np.expand_dims(image, axis=(0, -1))  
    return image

@app.route('/predict', methods=['POST'])
def predict():
    """ Process the image, make a prediction, and return the digit. """
    data = request.json
    image_data = data.get('image')

    if not image_data:
        return jsonify({'error': 'No image data received'}), 400

    try:
        # Decode base64 image
        image_data = image_data.split(",")[1]  
        image = Image.open(BytesIO(base64.b64decode(image_data)))

        # Preprocess image
        processed_image = preprocess_image(image)

        # Predict
        prediction = model.predict(processed_image)
        predicted_digit = np.argmax(prediction)

        return jsonify({'digit': int(predicted_digit)})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 🛠️ Simple POST method to test deployment
@app.route('/test', methods=['POST'])
def test():
    return jsonify({'message': 'Hello, World! Your Flask server is running successfully.'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import json
import cv2
import numpy as np
from PIL import Image, ExifTags
import tensorflow as tf
import io
import tempfile
import exifread

# Setup
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Disease classes (from original model)
DISEASE_CLASSES = [
    'Apple scab', 'Apple Black rot', 'Cedar apple rust', 
    'Apple healthy', 'Blueberry healthy', 
    'Cherry Powdery mildew', 'Cherry healthy', 
    'Corn Cercospora leaf spot', 'Corn Common rust', 
    'Corn Northern Leaf Blight', 'Corn healthy', 
    'Grape Black rot', 'Grape Black Measles', 
    'Grape Leaf blight', 'Grape healthy', 
    'Orange Haunglongbing', 'Peach Bacterial spot', 
    'Peach healthy', 'Bell Peppers Bacterial spot', 'Bell Peppers healthy', 
    'Potato Early blight', 'Potato Late blight', 'Potato healthy', 
    'Raspberry healthy', 'Soybean healthy', 'Squash Powdery mildew', 
    'Strawberry Leaf scorch', 'Strawberry healthy', 'Tomato Bacterial spot', 
    'Tomato Early blight', 'Tomato Late blight', 'Tomato Leaf Mold', 
    'Tomato Septoria leaf spot', 'Tomato Spider mites', 
    'Tomato Target Spot', 'Tomato Yellow Leaf Curl Virus', 
    'Tomato mosaic virus', 'Tomato healthy'
]

# Load model and treatment data
try:
    model = tf.keras.models.load_model(ROOT_DIR / "model_finetuned.h5")
    print("Model loaded successfully")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

# Load treatment data
treatment_data = {}
try:
    with open(ROOT_DIR / "treatment_data.json", 'r', encoding='utf-8') as f:
        treatment_data = json.load(f)
    print(f"Loaded treatment data for {len(treatment_data)} diseases")
except Exception as e:
    print(f"Error loading treatment data: {e}")

# FastAPI setup
app = FastAPI(title="AgriLens.AI API", description="Plant Disease Detection API")
api_router = APIRouter(prefix="/api")

# Models
class PredictionResult(BaseModel):
    disease: str
    confidence: float
    rank: int

class LocationData(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None

class DiagnosisResponse(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    predictions: List[PredictionResult]
    location: Optional[LocationData] = None
    treatment_info: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class TreatmentInfo(BaseModel):
    disease: str
    type: str
    description: str
    symptoms: str
    cycle_lethality: str
    organic_solutions: str
    inorganic_solutions: str
    sources: str

# Helper functions
def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """Preprocess image for model prediction"""
    try:
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert to numpy array
        image_array = np.array(image)
        
        # Resize to model input size (224x224)
        image_resized = cv2.resize(image_array, (224, 224))
        
        # Normalize pixel values to [0, 1]
        image_normalized = image_resized.astype(np.float32) / 255.0
        
        # Add batch dimension
        image_batch = np.expand_dims(image_normalized, axis=0)
        
        return image_batch
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error preprocessing image: {str(e)}")

def extract_gps_from_image(image_bytes: bytes) -> Optional[LocationData]:
    """Extract GPS coordinates from image EXIF data"""
    try:
        # Reset bytes stream
        image_bytes_io = io.BytesIO(image_bytes)
        
        # Use exifread to extract GPS data
        tags = exifread.process_file(image_bytes_io)
        
        # Check if GPS data exists
        if 'GPS GPSLatitude' in tags and 'GPS GPSLongitude' in tags:
            # Extract latitude
            lat_ref = tags.get('GPS GPSLatitudeRef', 'N')
            lat_coords = tags['GPS GPSLatitude']
            
            # Extract longitude  
            lon_ref = tags.get('GPS GPSLongitudeRef', 'E')
            lon_coords = tags['GPS GPSLongitude']
            
            # Convert to decimal degrees
            def coord_to_decimal(coord_vals, ref):
                decimal = float(coord_vals.values[0].num) / float(coord_vals.values[0].den)
                decimal += (float(coord_vals.values[1].num) / float(coord_vals.values[1].den)) / 60
                decimal += (float(coord_vals.values[2].num) / float(coord_vals.values[2].den)) / 3600
                
                if ref.values in ['S', 'W']:
                    decimal = -decimal
                return decimal
            
            latitude = coord_to_decimal(lat_coords, lat_ref)
            longitude = coord_to_decimal(lon_coords, lon_ref)
            
            return LocationData(
                latitude=latitude,
                longitude=longitude,
                address=f"{latitude:.6f}, {longitude:.6f}"
            )
            
    except Exception as e:
        print(f"GPS extraction error: {e}")
    
    return None

def get_top_predictions(probabilities: np.ndarray, top_k: int = 3) -> List[PredictionResult]:
    """Get top K predictions from model output"""
    # Get top indices
    top_indices = np.argsort(probabilities)[::-1][:top_k]
    
    predictions = []
    for rank, idx in enumerate(top_indices, 1):
        predictions.append(PredictionResult(
            disease=DISEASE_CLASSES[idx],
            confidence=float(probabilities[idx]),
            rank=rank
        ))
    
    return predictions

# API Routes
@api_router.get("/")
async def root():
    return {"message": "AgriLens.AI API v1.0", "status": "operational"}

@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "treatment_data_loaded": len(treatment_data) > 0,
        "total_classes": len(DISEASE_CLASSES)
    }

@api_router.post("/predict", response_model=DiagnosisResponse)
async def predict_disease(file: UploadFile = File(...)):
    """Predict plant disease from uploaded image"""
    
    if not model:
        raise HTTPException(status_code=503, detail="Model not available")
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Check file size (10MB limit)
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
    
    try:
        # Read image bytes
        image_bytes = await file.read()
        
        # Extract GPS data
        location_data = extract_gps_from_image(image_bytes)
        
        # Preprocess image
        processed_image = preprocess_image(image_bytes)
        
        # Make prediction
        probabilities = model.predict(processed_image)[0]
        
        # Get top 3 predictions
        predictions = get_top_predictions(probabilities, top_k=3)
        
        # Get treatment info for top prediction
        top_disease = predictions[0].disease
        treatment_info = treatment_data.get(top_disease)
        
        return DiagnosisResponse(
            predictions=predictions,
            location=location_data,
            treatment_info=treatment_info
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@api_router.get("/treatment/{disease_name}", response_model=TreatmentInfo)
async def get_treatment_info(disease_name: str):
    """Get treatment information for a specific disease"""
    
    if disease_name not in treatment_data:
        raise HTTPException(status_code=404, detail="Treatment information not found")
    
    info = treatment_data[disease_name]
    return TreatmentInfo(
        disease=disease_name,
        **info
    )

@api_router.get("/diseases")
async def get_all_diseases():
    """Get list of all supported diseases"""
    return {
        "classes": DISEASE_CLASSES,
        "total": len(DISEASE_CLASSES),
        "healthy_plants": [cls for cls in DISEASE_CLASSES if "healthy" in cls.lower()],
        "diseases": [cls for cls in DISEASE_CLASSES if "healthy" not in cls.lower()]
    }

# Include router
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
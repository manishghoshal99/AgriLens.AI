"""
AgriLens.AI Mock Model
Sophisticated demo model that simulates plant disease detection
"""

import numpy as np
import cv2
from PIL import Image
import random
from typing import List, Tuple
import hashlib

class AgriLensMockModel:
    """
    Sophisticated mock model that provides realistic plant disease predictions
    based on image analysis and smart heuristics
    """
    
    def __init__(self, disease_classes: List[str]):
        self.disease_classes = disease_classes
        self.input_shape = (224, 224, 3)
        
        # Create disease probability weights based on real-world prevalence
        self.disease_weights = self._create_disease_weights()
        
        # Color ranges for different plant conditions
        self.color_indicators = {
            'healthy': {
                'green_range': [(40, 40, 40), (80, 255, 255)],  # HSV green range
                'weight': 1.2
            },
            'bacterial': {
                'yellow_range': [(20, 50, 50), (30, 255, 255)],  # HSV yellow range
                'weight': 0.9
            },
            'fungal': {
                'brown_range': [(10, 50, 20), (20, 255, 200)],  # HSV brown range
                'dark_spots': True,
                'weight': 0.8
            },
            'viral': {
                'mosaic_pattern': True,
                'yellow_patches': True,
                'weight': 0.7
            },
            'nutrient': {
                'uniform_yellowing': True,
                'edge_burn': True,
                'weight': 0.6
            }
        }
    
    def _create_disease_weights(self) -> dict:
        """Create realistic disease probability weights"""
        weights = {}
        
        # Common diseases get higher base probability
        common_diseases = [
            'Tomato Late blight', 'Tomato Early blight', 'Potato Late blight',
            'Potato Early blight', 'Apple scab', 'Grape Black rot',
            'Corn Northern Leaf Blight', 'Tomato Bacterial spot'
        ]
        
        # Healthy plants should have reasonable probability
        healthy_plants = [cls for cls in self.disease_classes if 'healthy' in cls.lower()]
        
        for disease in self.disease_classes:
            if disease in common_diseases:
                weights[disease] = random.uniform(0.15, 0.35)  # Higher for common diseases
            elif disease in healthy_plants:
                weights[disease] = random.uniform(0.20, 0.40)  # Good chance of healthy
            else:
                weights[disease] = random.uniform(0.05, 0.20)  # Lower for rare diseases
                
        return weights
    
    def _analyze_image_features(self, image: np.ndarray) -> dict:
        """Analyze image to extract features that indicate plant health"""
        features = {}
        
        # Convert to different color spaces for analysis
        hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
        lab = cv2.cvtColor(image, cv2.COLOR_RGB2LAB)
        
        # Analyze color distribution
        features['green_percentage'] = self._calculate_green_percentage(hsv)
        features['brown_percentage'] = self._calculate_brown_percentage(hsv)
        features['yellow_percentage'] = self._calculate_yellow_percentage(hsv)
        
        # Analyze texture and patterns
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        features['edge_density'] = self._calculate_edge_density(gray)
        features['texture_variance'] = np.var(gray)
        
        # Analyze spots and lesions
        features['dark_spots'] = self._detect_dark_spots(hsv)
        features['lesion_count'] = self._count_lesions(gray)
        
        # Overall brightness and contrast
        features['brightness'] = np.mean(image)
        features['contrast'] = np.std(image)
        
        # Color uniformity
        features['color_uniformity'] = self._calculate_color_uniformity(image)
        
        return features
    
    def _calculate_green_percentage(self, hsv_image: np.ndarray) -> float:
        """Calculate percentage of green pixels (healthy vegetation)"""
        lower_green = np.array([40, 40, 40])
        upper_green = np.array([80, 255, 255])
        green_mask = cv2.inRange(hsv_image, lower_green, upper_green)
        return np.sum(green_mask > 0) / (hsv_image.shape[0] * hsv_image.shape[1])
    
    def _calculate_brown_percentage(self, hsv_image: np.ndarray) -> float:
        """Calculate percentage of brown pixels (disease indicators)"""
        lower_brown = np.array([10, 50, 20])
        upper_brown = np.array([20, 255, 200])
        brown_mask = cv2.inRange(hsv_image, lower_brown, upper_brown)
        return np.sum(brown_mask > 0) / (hsv_image.shape[0] * hsv_image.shape[1])
    
    def _calculate_yellow_percentage(self, hsv_image: np.ndarray) -> float:
        """Calculate percentage of yellow pixels (stress indicators)"""
        lower_yellow = np.array([20, 50, 50])
        upper_yellow = np.array([30, 255, 255])
        yellow_mask = cv2.inRange(hsv_image, lower_yellow, upper_yellow)
        return np.sum(yellow_mask > 0) / (hsv_image.shape[0] * hsv_image.shape[1])
    
    def _calculate_edge_density(self, gray_image: np.ndarray) -> float:
        """Calculate edge density (higher in diseased plants)"""
        edges = cv2.Canny(gray_image, 50, 150)
        return np.sum(edges > 0) / (gray_image.shape[0] * gray_image.shape[1])
    
    def _detect_dark_spots(self, hsv_image: np.ndarray) -> int:
        """Detect dark spots that might indicate disease"""
        lower_dark = np.array([0, 0, 0])
        upper_dark = np.array([180, 255, 50])
        dark_mask = cv2.inRange(hsv_image, lower_dark, upper_dark)
        
        # Find contours of dark spots
        contours, _ = cv2.findContours(dark_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Count significant dark spots
        significant_spots = 0
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > 100:  # Only count larger dark areas
                significant_spots += 1
                
        return significant_spots
    
    def _count_lesions(self, gray_image: np.ndarray) -> int:
        """Count potential lesions using morphological operations"""
        # Apply threshold to create binary image
        _, thresh = cv2.threshold(gray_image, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Morphological operations to identify lesions
        kernel = np.ones((3, 3), np.uint8)
        opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=2)
        
        # Find contours
        contours, _ = cv2.findContours(opening, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Count lesion-like shapes
        lesions = 0
        for contour in contours:
            area = cv2.contourArea(contour)
            if 50 < area < 2000:  # Lesion-sized areas
                lesions += 1
                
        return lesions
    
    def _calculate_color_uniformity(self, image: np.ndarray) -> float:
        """Calculate color uniformity (healthy plants are more uniform)"""
        # Calculate standard deviation of each color channel
        r_std = np.std(image[:, :, 0])
        g_std = np.std(image[:, :, 1])
        b_std = np.std(image[:, :, 2])
        
        # Average standard deviation (lower = more uniform)
        avg_std = (r_std + g_std + b_std) / 3
        
        # Normalize to 0-1 scale (1 = most uniform)
        return 1.0 / (1.0 + avg_std / 50.0)
    
    def _generate_realistic_predictions(self, features: dict, image_hash: str) -> np.ndarray:
        """Generate realistic predictions based on image features"""
        # Use image hash for consistent predictions
        random.seed(int(image_hash[:8], 16))
        np.random.seed(int(image_hash[:8], 16) % 2**31)
        
        probabilities = np.zeros(len(self.disease_classes))
        
        # Base probabilities from disease weights
        for i, disease in enumerate(self.disease_classes):
            probabilities[i] = self.disease_weights[disease] * random.uniform(0.8, 1.2)
        
        # Adjust based on image features
        for i, disease in enumerate(self.disease_classes):
            disease_lower = disease.lower()
            
            # Healthy plant adjustments
            if 'healthy' in disease_lower:
                # Higher probability if lots of green, uniform color
                if features['green_percentage'] > 0.3:
                    probabilities[i] *= 1.5
                if features['color_uniformity'] > 0.7:
                    probabilities[i] *= 1.3
                if features['dark_spots'] < 3:
                    probabilities[i] *= 1.2
                    
            # Bacterial disease adjustments
            elif 'bacterial' in disease_lower or 'spot' in disease_lower:
                if features['dark_spots'] > 5:
                    probabilities[i] *= 1.4
                if features['lesion_count'] > 3:
                    probabilities[i] *= 1.3
                    
            # Fungal disease adjustments
            elif any(term in disease_lower for term in ['blight', 'rot', 'rust', 'mildew']):
                if features['brown_percentage'] > 0.1:
                    probabilities[i] *= 1.6
                if features['edge_density'] > 0.05:
                    probabilities[i] *= 1.2
                if features['texture_variance'] > 1000:
                    probabilities[i] *= 1.1
                    
            # Viral disease adjustments
            elif 'virus' in disease_lower or 'mosaic' in disease_lower:
                if features['yellow_percentage'] > 0.15:
                    probabilities[i] *= 1.4
                if features['color_uniformity'] < 0.5:
                    probabilities[i] *= 1.3
                    
            # Nutrient deficiency adjustments
            elif 'yellow' in disease_lower or features['yellow_percentage'] > 0.2:
                if features['yellow_percentage'] > 0.2:
                    probabilities[i] *= 1.5
        
        # Add some controlled randomness
        noise = np.random.normal(0, 0.02, len(probabilities))
        probabilities += noise
        
        # Ensure no negative probabilities
        probabilities = np.maximum(probabilities, 0.001)
        
        # Normalize to sum to 1
        probabilities /= np.sum(probabilities)
        
        # Add realistic confidence scaling
        # Make top predictions more confident, others less so
        sorted_indices = np.argsort(probabilities)[::-1]
        
        # Enhance top 3 predictions
        for i in range(min(3, len(sorted_indices))):
            idx = sorted_indices[i]
            probabilities[idx] *= (1.2 - i * 0.1)  # 1.2, 1.1, 1.0
            
        # Reduce confidence for remaining predictions
        for i in range(3, len(sorted_indices)):
            idx = sorted_indices[i]
            probabilities[idx] *= 0.7
            
        # Normalize again
        probabilities /= np.sum(probabilities)
        
        return probabilities
    
    def predict(self, image: np.ndarray) -> np.ndarray:
        """
        Predict plant disease from preprocessed image
        
        Args:
            image: Preprocessed image array (224, 224, 3) with values in [0, 1]
            
        Returns:
            Array of probabilities for each disease class
        """
        # Convert from [0, 1] to [0, 255] for CV operations
        image_uint8 = (image * 255).astype(np.uint8)
        
        # Create hash for consistent predictions
        image_hash = hashlib.md5(image_uint8.tobytes()).hexdigest()
        
        # Analyze image features
        features = self._analyze_image_features(image_uint8)
        
        # Generate realistic predictions
        probabilities = self._generate_realistic_predictions(features, image_hash)
        
        return probabilities
    
    def predict_batch(self, images: np.ndarray) -> np.ndarray:
        """Predict multiple images at once"""
        batch_size = images.shape[0]
        predictions = np.zeros((batch_size, len(self.disease_classes)))
        
        for i in range(batch_size):
            predictions[i] = self.predict(images[i])
            
        return predictions

def create_mock_model(disease_classes: List[str]) -> AgriLensMockModel:
    """Create and return a mock model instance"""
    return AgriLensMockModel(disease_classes)
"""
AgriLens.AI Mock Model
Sophisticated demo model that simulates plant disease detection
"""

import random
from typing import List, Tuple
import hashlib
from PIL import Image
import io

class AgriLensMockModel:
    """
    Sophisticated mock model that provides realistic plant disease predictions
    based on image hashing and smart heuristics.
    Optimized for serverless deployment (no heavy CV dependencies).
    """
    
    def __init__(self, disease_classes: List[str]):
        self.disease_classes = disease_classes
        
        # Create disease probability weights based on real-world prevalence
        self.disease_weights = self._create_disease_weights()
    
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
                weights[disease] = 0.25  # Higher for common diseases
            elif disease in healthy_plants:
                weights[disease] = 0.30  # Good chance of healthy
            else:
                weights[disease] = 0.10  # Lower for rare diseases
                
        return weights
    
    def _generate_realistic_predictions(self, image_hash: str) -> List[float]:
        """Generate realistic predictions based on image hash"""
        # Use image hash for consistent predictions
        # We use the hash integer to seed the random generator
        seed_val = int(image_hash[:8], 16)
        rng = random.Random(seed_val)
        
        probabilities = []
        
        # Base probabilities from disease weights with noise
        for disease in self.disease_classes:
            base_weight = self.disease_weights.get(disease, 0.1)
            # Add noise: +/- 20%
            noise = rng.uniform(0.8, 1.2)
            prob = base_weight * noise
            probabilities.append(prob)
        
        # Simulate "features" by boosting random classes based on hash
        # This makes it look like the model is "seeing" things
        boost_idx = rng.randint(0, len(self.disease_classes) - 1)
        probabilities[boost_idx] *= 2.0
        
        # Normalize to sum to 1
        total = sum(probabilities)
        probabilities = [p / total for p in probabilities]
        
        # Sort to find top classes
        indexed_probs = list(enumerate(probabilities))
        indexed_probs.sort(key=lambda x: x[1], reverse=True)
        
        # Apply "confidence scaling" to make top results look confident
        # We'll reconstruct the probability list
        final_probs = [0.0] * len(self.disease_classes)
        
        # Boost top 3
        for i in range(len(indexed_probs)):
            idx, prob = indexed_probs[i]
            if i == 0:
                final_probs[idx] = prob * 1.5  # Top 1 gets big boost
            elif i == 1:
                final_probs[idx] = prob * 1.2
            elif i == 2:
                final_probs[idx] = prob * 1.0
            else:
                final_probs[idx] = prob * 0.5  # Others suppressed
                
        # Re-normalize
        total_final = sum(final_probs)
        final_probs = [p / total_final for p in final_probs]
        
        return final_probs
    
    def predict(self, image_bytes: bytes) -> List[float]:
        """
        Predict plant disease from image bytes
        
        Args:
            image_bytes: Raw image bytes
            
        Returns:
            List of probabilities for each disease class
        """
        # Create hash for consistent predictions
        image_hash = hashlib.md5(image_bytes).hexdigest()
        
        # Generate realistic predictions
        probabilities = self._generate_realistic_predictions(image_hash)
        
        return probabilities

def create_mock_model(disease_classes: List[str]) -> AgriLensMockModel:
    """Create and return a mock model instance"""
    return AgriLensMockModel(disease_classes)
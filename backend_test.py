#!/usr/bin/env python3
"""
AgriLens.AI Backend API Testing Suite
Tests the plant disease detection API functionality
"""

import requests
import json
import os
import sys
from pathlib import Path
import tempfile
from PIL import Image
import numpy as np
import io

# Get backend URL from frontend .env file
def get_backend_url():
    frontend_env_path = Path("/app/frontend/.env")
    if frontend_env_path.exists():
        with open(frontend_env_path, 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    return "http://localhost:8001"  # fallback

BACKEND_URL = get_backend_url()
API_BASE = f"{BACKEND_URL}/api"

print(f"Testing AgriLens.AI Backend API at: {API_BASE}")
print("=" * 60)

class APITester:
    def __init__(self):
        self.test_results = []
        self.failed_tests = []
        
    def log_test(self, test_name, success, details=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    {details}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'details': details
        })
        
        if not success:
            self.failed_tests.append(test_name)
    
    def create_test_image(self, size=(224, 224), format='JPEG'):
        """Create a test plant image for API testing"""
        # Create a realistic plant-like image
        image = Image.new('RGB', size, color='green')
        
        # Add some variation to make it look more plant-like
        pixels = np.array(image)
        # Add some brown spots (disease simulation)
        pixels[50:100, 50:100] = [139, 69, 19]  # Brown color
        # Add some yellow areas
        pixels[150:200, 150:200] = [255, 255, 0]  # Yellow color
        
        image = Image.fromarray(pixels)
        
        # Convert to bytes
        img_bytes = io.BytesIO()
        image.save(img_bytes, format=format)
        img_bytes.seek(0)
        
        return img_bytes.getvalue()
    
    def test_health_check(self):
        """Test /api/health endpoint"""
        try:
            response = requests.get(f"{API_BASE}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_fields = ['status', 'model_loaded', 'treatment_data_loaded', 'total_classes']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Health Check - Response Format", False, 
                                f"Missing fields: {missing_fields}")
                    return False
                
                # Check model loading status
                model_loaded = data.get('model_loaded', False)
                treatment_loaded = data.get('treatment_data_loaded', False)
                total_classes = data.get('total_classes', 0)
                
                self.log_test("Health Check - API Response", True, 
                            f"Status: {data['status']}")
                self.log_test("Health Check - Model Loaded", model_loaded, 
                            f"Model loaded: {model_loaded}")
                self.log_test("Health Check - Treatment Data", treatment_loaded, 
                            f"Treatment data loaded: {treatment_loaded}")
                self.log_test("Health Check - Disease Classes", total_classes == 39, 
                            f"Total classes: {total_classes} (expected: 39)")
                
                return model_loaded and treatment_loaded and total_classes == 39
            else:
                self.log_test("Health Check - API Response", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Health Check - Connection", False, f"Connection error: {e}")
            return False
    
    def test_root_endpoint(self):
        """Test /api/ root endpoint"""
        try:
            response = requests.get(f"{API_BASE}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                expected_message = "AgriLens.AI API v1.0"
                
                if data.get('message') == expected_message:
                    self.log_test("Root Endpoint", True, f"Message: {data['message']}")
                    return True
                else:
                    self.log_test("Root Endpoint", False, 
                                f"Unexpected message: {data.get('message')}")
                    return False
            else:
                self.log_test("Root Endpoint", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Root Endpoint", False, f"Connection error: {e}")
            return False
    
    def test_diseases_endpoint(self):
        """Test /api/diseases endpoint"""
        try:
            response = requests.get(f"{API_BASE}/diseases", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_fields = ['classes', 'total', 'healthy_plants', 'diseases']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Diseases Endpoint", False, 
                                f"Missing fields: {missing_fields}")
                    return False
                
                total_classes = data.get('total', 0)
                classes = data.get('classes', [])
                healthy_plants = data.get('healthy_plants', [])
                diseases = data.get('diseases', [])
                
                self.log_test("Diseases Endpoint - Response", True, 
                            f"Total: {total_classes}, Classes: {len(classes)}")
                self.log_test("Diseases Endpoint - Healthy Plants", len(healthy_plants) > 0, 
                            f"Healthy plants: {len(healthy_plants)}")
                self.log_test("Diseases Endpoint - Disease Classes", len(diseases) > 0, 
                            f"Disease classes: {len(diseases)}")
                
                return total_classes == 39 and len(classes) == 39
            else:
                self.log_test("Diseases Endpoint", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Diseases Endpoint", False, f"Connection error: {e}")
            return False
    
    def test_prediction_endpoint(self):
        """Test /api/predict endpoint with image upload"""
        try:
            # Create test image
            test_image = self.create_test_image()
            
            # Prepare file upload
            files = {
                'file': ('test_plant.jpg', test_image, 'image/jpeg')
            }
            
            response = requests.post(f"{API_BASE}/predict", files=files, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_fields = ['id', 'predictions', 'timestamp']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Prediction Endpoint", False, 
                                f"Missing fields: {missing_fields}")
                    return False
                
                predictions = data.get('predictions', [])
                
                if len(predictions) >= 3:
                    # Check prediction structure
                    first_pred = predictions[0]
                    pred_fields = ['disease', 'confidence', 'rank']
                    pred_missing = [field for field in pred_fields if field not in first_pred]
                    
                    if pred_missing:
                        self.log_test("Prediction Endpoint - Structure", False, 
                                    f"Missing prediction fields: {pred_missing}")
                        return False
                    
                    self.log_test("Prediction Endpoint - Success", True, 
                                f"Top prediction: {first_pred['disease']} ({first_pred['confidence']:.3f})")
                    
                    # Check if confidence scores are reasonable
                    valid_confidence = all(0 <= pred['confidence'] <= 1 for pred in predictions)
                    self.log_test("Prediction Endpoint - Confidence Scores", valid_confidence, 
                                f"All confidence scores in [0,1]: {valid_confidence}")
                    
                    # Check if ranks are correct
                    valid_ranks = [pred['rank'] for pred in predictions] == [1, 2, 3]
                    self.log_test("Prediction Endpoint - Ranking", valid_ranks, 
                                f"Correct ranking: {valid_ranks}")
                    
                    return True
                else:
                    self.log_test("Prediction Endpoint", False, 
                                f"Expected 3 predictions, got {len(predictions)}")
                    return False
            
            elif response.status_code == 503:
                self.log_test("Prediction Endpoint - Model Availability", False, 
                            "Model not available (503 error)")
                return False
            else:
                self.log_test("Prediction Endpoint", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Prediction Endpoint", False, f"Connection error: {e}")
            return False
    
    def test_file_validation(self):
        """Test file upload validation"""
        try:
            # Test 1: Non-image file
            text_content = b"This is not an image file"
            files = {'file': ('test.txt', text_content, 'text/plain')}
            
            response = requests.post(f"{API_BASE}/predict", files=files, timeout=10)
            
            if response.status_code == 400:
                self.log_test("File Validation - Non-Image", True, 
                            "Correctly rejected non-image file")
            else:
                self.log_test("File Validation - Non-Image", False, 
                            f"Should reject non-image, got HTTP {response.status_code}")
            
            # Test 2: Large file (simulate > 10MB)
            # Create a large fake image
            large_image = b"fake_image_data" * (1024 * 1024)  # ~13MB of fake data
            files = {'file': ('large.jpg', large_image, 'image/jpeg')}
            
            response = requests.post(f"{API_BASE}/predict", files=files, timeout=10)
            
            if response.status_code == 400:
                self.log_test("File Validation - Size Limit", True, 
                            "Correctly rejected large file")
            else:
                self.log_test("File Validation - Size Limit", False, 
                            f"Should reject large file, got HTTP {response.status_code}")
            
            return True
            
        except requests.exceptions.RequestException as e:
            self.log_test("File Validation", False, f"Connection error: {e}")
            return False
    
    def test_treatment_endpoints(self):
        """Test treatment information endpoints"""
        try:
            # Test with a known disease
            test_diseases = [
                "Tomato Late blight",
                "Apple scab", 
                "Potato Early blight",
                "Corn Common rust"
            ]
            
            success_count = 0
            
            for disease in test_diseases:
                response = requests.get(f"{API_BASE}/treatment/{disease}", timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Check required fields
                    required_fields = ['disease', 'type', 'description']
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if not missing_fields:
                        self.log_test(f"Treatment Info - {disease}", True, 
                                    f"Type: {data.get('type', 'N/A')}")
                        success_count += 1
                    else:
                        self.log_test(f"Treatment Info - {disease}", False, 
                                    f"Missing fields: {missing_fields}")
                else:
                    self.log_test(f"Treatment Info - {disease}", False, 
                                f"HTTP {response.status_code}")
            
            # Test with non-existent disease
            response = requests.get(f"{API_BASE}/treatment/NonExistentDisease", timeout=10)
            
            if response.status_code == 404:
                self.log_test("Treatment Info - Not Found", True, 
                            "Correctly returned 404 for non-existent disease")
            else:
                self.log_test("Treatment Info - Not Found", False, 
                            f"Should return 404, got HTTP {response.status_code}")
            
            return success_count >= len(test_diseases) // 2  # At least half should work
            
        except requests.exceptions.RequestException as e:
            self.log_test("Treatment Endpoints", False, f"Connection error: {e}")
            return False
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("Starting AgriLens.AI Backend API Tests...")
        print()
        
        # Test 1: Health Check (Critical)
        health_ok = self.test_health_check()
        print()
        
        # Test 2: Root Endpoint
        self.test_root_endpoint()
        print()
        
        # Test 3: Diseases Endpoint
        self.test_diseases_endpoint()
        print()
        
        # Test 4: Prediction Endpoint (Critical - depends on model)
        if health_ok:
            self.test_prediction_endpoint()
        else:
            self.log_test("Prediction Endpoint", False, 
                        "Skipped due to model loading issues")
        print()
        
        # Test 5: File Validation
        self.test_file_validation()
        print()
        
        # Test 6: Treatment Endpoints
        self.test_treatment_endpoints()
        print()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if self.failed_tests:
            print("\nFailed Tests:")
            for test in self.failed_tests:
                print(f"  - {test}")
        
        print("\nCritical Issues Found:")
        
        # Check for critical issues
        critical_issues = []
        
        # Model loading issue
        model_tests = [r for r in self.test_results if 'Model Loaded' in r['test']]
        if model_tests and not model_tests[0]['success']:
            critical_issues.append("❌ TensorFlow model not loading (model_loaded: false)")
        
        # Prediction API failure
        pred_tests = [r for r in self.test_results if 'Prediction Endpoint' in r['test'] and 'Success' in r['test']]
        if pred_tests and not pred_tests[0]['success']:
            critical_issues.append("❌ Prediction API not working")
        
        # Treatment data issues
        treatment_tests = [r for r in self.test_results if 'Treatment Data' in r['test']]
        if treatment_tests and not treatment_tests[0]['success']:
            critical_issues.append("❌ Treatment data not loaded")
        
        if critical_issues:
            for issue in critical_issues:
                print(f"  {issue}")
        else:
            print("  ✅ No critical issues found!")
        
        return len(critical_issues) == 0

if __name__ == "__main__":
    tester = APITester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)
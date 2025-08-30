import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  Camera, 
  X, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  MapPin,
  Calendar,
  TrendingUp
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import axios from "axios";

import PredictionResults from "./PredictionResults";
import TreatmentCard from "./TreatmentCard";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DiagnosisPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    onDrop: handleFileSelect,
    onDropRejected: (rejectedFiles) => {
      const error = rejectedFiles[0]?.errors[0];
      if (error?.code === 'file-too-large') {
        toast.error('File too large. Maximum size is 10MB.');
      } else if (error?.code === 'file-invalid-type') {
        toast.error('Invalid file type. Please upload JPG, PNG, or WebP images.');
      } else {
        toast.error('File upload failed. Please try again.');
      }
    }
  });

  function handleFileSelect(files) {
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      toast.success('Image uploaded successfully!');
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleFileSelect([file]);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',  // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast.error('Camera access denied or unavailable');
      console.error('Camera error:', error);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
        handleFileSelect([file]);
        stopCamera();
      }, 'image/jpeg', 0.9);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const analyzeImage = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }

    setIsAnalyzing(true);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await axios.post(`${API}/predict`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResults(response.data);
      
      // Save to history (IndexedDB)
      saveToHistory(response.data, preview);
      
      toast.success('Analysis complete!');
      
    } catch (error) {
      console.error('Analysis error:', error);
      if (error.response?.status === 400) {
        toast.error(error.response.data.detail || 'Invalid image format');
      } else if (error.response?.status === 503) {
        toast.error('Service temporarily unavailable. Please try again.');
      } else {
        toast.error('Analysis failed. Please try again.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveToHistory = async (result, imagePreview) => {
    try {
      const historyItem = {
        id: result.id,
        timestamp: new Date().toISOString(),
        predictions: result.predictions,
        location: result.location,
        image: imagePreview,
        topDisease: result.predictions[0]?.disease,
        confidence: result.predictions[0]?.confidence
      };

      // IndexedDB storage
      const request = indexedDB.open('AgriLensDB', 1);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('history')) {
          db.createObjectStore('history', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['history'], 'readwrite');
        const store = transaction.objectStore('history');
        store.add(historyItem);
      };
    } catch (error) {
      console.error('Failed to save to history:', error);
    }
  };

  const clearImage = () => {
    setSelectedFile(null);
    setPreview(null);
    setResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="pt-20 pb-12 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Plant Disease Diagnosis
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Upload an image or take a photo of your plant to get instant AI-powered diagnosis 
            and treatment recommendations.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Upload Plant Image</h2>
              
              {!preview ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
                    isDragActive 
                      ? 'border-emerald-500 bg-emerald-50' 
                      : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50'
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg text-gray-600 mb-2">
                    {isDragActive ? 'Drop your image here' : 'Drag & drop an image here'}
                  </p>
                  <p className="text-sm text-gray-400 mb-4">or click to browse files</p>
                  <p className="text-xs text-gray-400">
                    Supports JPG, PNG, WebP (max 10MB)
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-80 object-cover rounded-xl"
                  />
                  <button
                    onClick={clearImage}
                    className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex gap-4 mt-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-emerald-600 text-emerald-600 rounded-xl hover:bg-emerald-50 transition-all duration-200"
                >
                  <Upload className="w-5 h-5" />
                  Choose File
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={startCamera}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-200"
                >
                  <Camera className="w-5 h-5" />
                  Take Photo
                </motion.button>
              </div>

              {selectedFile && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                  className="w-full mt-6 flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <TrendingUp className="w-5 h-5" />
                  )}
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Plant'}
                </motion.button>
              )}
            </div>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <AnimatePresence mode="wait">
              {isAnalyzing && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
                >
                  <div className="text-center">
                    <Loader2 className="w-16 h-16 text-emerald-600 animate-spin mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Analyzing Your Plant...
                    </h3>
                    <p className="text-gray-600">
                      Our AI is examining the image for disease patterns
                    </p>
                  </div>
                </motion.div>
              )}

              {results && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <PredictionResults results={results} />
                  {results.treatment_info && (
                    <div className="mt-6">
                      <TreatmentCard 
                        disease={results.predictions[0].disease}
                        treatmentInfo={results.treatment_info}
                      />
                    </div>
                  )}
                </motion.div>
              )}

              {!isAnalyzing && !results && (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
                >
                  <div className="text-center text-gray-500">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <h3 className="text-xl font-semibold mb-2">Ready for Analysis</h3>
                    <p>Upload an image to get started with AI diagnosis</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Camera Modal */}
      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-6 max-w-2xl w-full"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Take Photo</h3>
                <button
                  onClick={stopCamera}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-xl mb-4"
              />
              
              <div className="flex gap-4">
                <button
                  onClick={capturePhoto}
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  Capture
                </button>
                <button
                  onClick={stopCamera}
                  className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default DiagnosisPage;
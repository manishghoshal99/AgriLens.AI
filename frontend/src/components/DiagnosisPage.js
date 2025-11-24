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
  TrendingUp,
  Trophy,
  Star,
  Zap,
  Link as LinkIcon,
  Globe
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import axios from "axios";
import confetti from "canvas-confetti"; // We'll need to install this or use a simple alternative

import PredictionResults from "./PredictionResults";
import TreatmentCard from "./TreatmentCard";

// Gamification Constants
const XP_PER_SCAN = 50;
const LEVELS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 5000];

const GamificationHeader = ({ xp, level, streak }) => {
  const nextLevelXp = LEVELS[level] || LEVELS[LEVELS.length - 1];
  const prevLevelXp = LEVELS[level - 1] || 0;
  const progress = ((xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100;

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-100 p-2 rounded-lg">
            <Trophy className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Plant Doctor</p>
            <p className="text-sm font-bold text-gray-900">Level {level}</p>
          </div>
        </div>

        <div className="flex-1 max-w-md mx-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium text-gray-600">{xp} XP</span>
            <span className="text-gray-400">{nextLevelXp} XP</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-amber-100 p-2 rounded-lg">
            <Zap className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Daily Streak</p>
            <p className="text-sm font-bold text-gray-900">{streak} Days</p>
          </div>
        </div>
      </div>
      <div className="absolute top-16 right-4 z-50">
        <div id="google_translate_element" className="shadow-md rounded-lg overflow-hidden"></div>
      </div>
    </motion.div>
  );
};

// Determine backend URL with sensible defaults
const defaultBackendUrl =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8001"
    : "";
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || defaultBackendUrl;
const API = BACKEND_URL ? `${BACKEND_URL}/api` : "/api";

const DiagnosisPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'url'
  const [imageUrl, setImageUrl] = useState('');
  const [xp, setXp] = useState(() => parseInt(localStorage.getItem('plant_doctor_xp') || '0'));
  const [streak, setStreak] = useState(() => parseInt(localStorage.getItem('plant_doctor_streak') || '1'));
  const [level, setLevel] = useState(1);

  // Calculate level based on XP
  React.useEffect(() => {
    let currentLevel = 1;
    for (let i = 0; i < LEVELS.length; i++) {
      if (xp >= LEVELS[i]) {
        currentLevel = i + 1;
      } else {
        break;
      }
    }
    setLevel(currentLevel);
    localStorage.setItem('plant_doctor_xp', xp.toString());
  }, [xp]);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const triggerConfetti = () => {
    // Simple confetti effect using particles (simulated for now without extra lib if needed, 
    // but we'll assume we can add a visual flair)
    // For now, we'll just show a toast, but in a real app we'd import canvas-confetti
    toast.success("🎉 +50 XP! Great job diagnosing!");
  };

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

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    if (!imageUrl) return;

    setIsAnalyzing(true);
    setResults(null);

    try {
      // Send URL to backend for processing
      const response = await axios.post(`${API}/predict_url`, { url: imageUrl }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setResults(response.data);
      setPreview(imageUrl); // Show the URL as preview

      // Save to history
      saveToHistory(response.data, imageUrl);

      toast.success('Analysis complete!');
      setXp(prev => prev + XP_PER_SCAN);
      triggerConfetti();

    } catch (error) {
      console.error("URL Analysis Error:", error);
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error("Failed to analyze image URL. Try a different link.");
      }
    } finally {
      setIsAnalyzing(false);
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

      // Gamification Reward
      setXp(prev => prev + XP_PER_SCAN);
      triggerConfetti();

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
    <div className="min-h-screen bg-gray-50">
      <GamificationHeader xp={xp} level={level} streak={streak} />

      <div className="pt-8 pb-12">
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
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setUploadMode('file')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${uploadMode === 'file'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    Upload File
                  </button>
                  <button
                    onClick={() => setUploadMode('url')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${uploadMode === 'url'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    Image URL
                  </button>
                </div>

                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  {uploadMode === 'file' ? 'Upload Plant Image' : 'Paste Image URL'}
                </h2>

                {uploadMode === 'url' && !preview && (
                  <form onSubmit={handleUrlSubmit} className="mb-6">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="url"
                          placeholder="https://example.com/plant.jpg"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!imageUrl || isAnalyzing}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        Load
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Note: Some URLs may not work due to security policies (CORS).
                    </p>
                  </form>
                )}

                {!preview && uploadMode === 'file' && (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${isDragActive
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
                )}

                {preview && (
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

                {uploadMode === 'file' && (
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
                )}

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
    </div>
  );
};

export default DiagnosisPage;
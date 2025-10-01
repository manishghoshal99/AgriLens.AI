import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { motion } from "framer-motion";
import { Toaster } from "sonner";
import "./App.css";

// Components
import HomePage from "./components/HomePage";
import DiagnosisPage from "./components/DiagnosisPage";
import HistoryPage from "./components/HistoryPage";
import Navbar from "./components/Navbar";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
          <Navbar />
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/diagnosis" element={<DiagnosisPage />} />
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </motion.main>
          <Toaster 
            position="bottom-right" 
            toastOptions={{
              style: {
                background: '#10b981',
                color: 'white',
                border: 'none',
              },
            }}
          />
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
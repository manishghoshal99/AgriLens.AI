import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Leaf, 
  Droplets, 
  Shield, 
  ExternalLink,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Info
} from "lucide-react";

const TreatmentCard = ({ disease, treatmentInfo }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({});
  
  const isHealthy = treatmentInfo.type === 'healthy';

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'organic', label: 'Organic', icon: Leaf },
    { id: 'inorganic', label: 'Inorganic', icon: Shield },
  ];

  const treatmentSections = [
    {
      id: 'symptoms',
      title: 'Symptoms',
      content: treatmentInfo.symptoms,
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-50'
    },
    {
      id: 'cycle',
      title: 'Disease Cycle & Impact',
      content: treatmentInfo.cycle_lethality,
      icon: Droplets,
      color: 'text-blue-600 bg-blue-50'
    }
  ];

  if (isHealthy) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200"
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <Leaf className="w-8 h-8 text-white" />
          </motion.div>
          
          <h3 className="text-2xl font-bold text-green-800 mb-3">
            Healthy Plant Detected! 🌱
          </h3>
          
          <p className="text-green-700 text-lg mb-6">
            {treatmentInfo.description}
          </p>
          
          <div className="bg-white rounded-xl p-6 border border-green-200">
            <h4 className="font-semibold text-green-800 mb-3">Care Recommendations:</h4>
            <ul className="text-green-700 text-left space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                Continue regular watering and fertilization
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                Monitor for any changes in leaf color or texture
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                Maintain proper spacing for good air circulation
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span>
                Regular preventive care helps maintain plant health
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 border-b border-red-100">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Treatment Guide
        </h3>
        <p className="text-red-700 font-medium">
          {disease}
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-all ${
                activeTab === tab.id
                  ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50'
                  : 'text-gray-600 hover:text-emerald-600 hover:bg-emerald-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Description */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  About This Disease
                </h4>
                <p className="text-gray-700 leading-relaxed">
                  {treatmentInfo.description}
                </p>
              </div>

              {/* Expandable Sections */}
              <div className="space-y-4">
                {treatmentSections.map((section) => (
                  section.content && (
                    <div key={section.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${section.color}`}>
                            <section.icon className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-gray-900">{section.title}</span>
                        </div>
                        
                        {expandedSections[section.id] ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                      
                      <AnimatePresence>
                        {expandedSections[section.id] && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 bg-white border-t border-gray-200">
                              <p className="text-gray-700 leading-relaxed">
                                {section.content}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'organic' && (
            <motion.div
              key="organic"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <Leaf className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-green-800">
                    Organic Treatment Options
                  </h4>
                </div>
                
                <div className="prose prose-green max-w-none">
                  <p className="text-green-700 leading-relaxed whitespace-pre-line">
                    {treatmentInfo.organic_solutions || 'No organic treatment information available.'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'inorganic' && (
            <motion.div
              key="inorganic"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-blue-800">
                    Chemical Treatment Options
                  </h4>
                </div>
                
                <div className="prose prose-blue max-w-none">
                  <p className="text-blue-700 leading-relaxed whitespace-pre-line">
                    {treatmentInfo.inorganic_solutions || 'No chemical treatment information available.'}
                  </p>
                </div>

                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800 mb-1">Safety Warning</p>
                      <p className="text-sm text-yellow-700">
                        Always follow label instructions and safety guidelines when using chemical treatments. 
                        Wear appropriate protective equipment and avoid application during windy conditions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sources */}
        {treatmentInfo.sources && (
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h5 className="font-medium text-gray-900 mb-2">Learn More</h5>
            <a
              href={treatmentInfo.sources}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Source Information
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TreatmentCard;
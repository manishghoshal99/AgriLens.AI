import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  History as HistoryIcon, 
  Calendar, 
  MapPin, 
  Trash2, 
  Download,
  Search,
  Filter,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";

const HistoryPage = () => {
  const [historyItems, setHistoryItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, healthy, diseased
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, confidence

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const request = indexedDB.open('AgriLensDB', 1);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('history')) {
          db.createObjectStore('history', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['history'], 'readonly');
        const store = transaction.objectStore('history');
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
          setHistoryItems(getAllRequest.result);
        };
      };
    } catch (error) {
      console.error('Failed to load history:', error);
      toast.error('Failed to load history');
    }
  };

  const deleteHistoryItem = async (id) => {
    try {
      const request = indexedDB.open('AgriLensDB', 1);
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['history'], 'readwrite');
        const store = transaction.objectStore('history');
        
        store.delete(id);
        
        transaction.oncomplete = () => {
          setHistoryItems(prev => prev.filter(item => item.id !== id));
          toast.success('Item deleted from history');
        };
      };
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast.error('Failed to delete item');
    }
  };

  const clearAllHistory = async () => {
    if (!window.confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
      return;
    }

    try {
      const request = indexedDB.open('AgriLensDB', 1);
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['history'], 'readwrite');
        const store = transaction.objectStore('history');
        
        store.clear();
        
        transaction.oncomplete = () => {
          setHistoryItems([]);
          toast.success('History cleared successfully');
        };
      };
    } catch (error) {
      console.error('Failed to clear history:', error);
      toast.error('Failed to clear history');
    }
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(historyItems, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `agrilens-history-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('History exported successfully');
  };

  const filteredAndSortedItems = historyItems
    .filter(item => {
      const matchesSearch = item.topDisease?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || 
        (filterType === 'healthy' && item.topDisease?.toLowerCase().includes('healthy')) ||
        (filterType === 'diseased' && !item.topDisease?.toLowerCase().includes('healthy'));
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.timestamp) - new Date(b.timestamp);
        case 'confidence':
          return (b.confidence || 0) - (a.confidence || 0);
        default: // newest
          return new Date(b.timestamp) - new Date(a.timestamp);
      }
    });

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
            Diagnosis History
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            View your past plant diagnoses and track the health of your crops over time.
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search diseases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Results</option>
              <option value="healthy">Healthy Plants</option>
              <option value="diseased">Diseases Detected</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="confidence">Highest Confidence</option>
            </select>

            {/* Actions */}
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportHistory}
                disabled={historyItems.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex-1"
              >
                <Download className="w-4 h-4" />
                Export
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearAllHistory}
                disabled={historyItems.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* History Items */}
        {filteredAndSortedItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center"
          >
            <HistoryIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              {searchTerm || filterType !== 'all' ? 'No matching results' : 'No diagnosis history'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Start diagnosing plants to build your history'
              }
            </p>
            {!searchTerm && filterType === 'all' && (
              <motion.a
                href="/diagnosis"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Start First Diagnosis
              </motion.a>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredAndSortedItems.map((item, index) => (
              <HistoryItem
                key={item.id}
                item={item}
                index={index}
                onDelete={deleteHistoryItem}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

const HistoryItem = ({ item, index, onDelete }) => {
  const isHealthy = item.topDisease?.toLowerCase().includes('healthy');
  const confidence = (item.confidence * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300"
    >
      {/* Image */}
      <div className="aspect-square bg-gray-100">
        {item.image ? (
          <img
            src={item.image}
            alt="Plant diagnosis"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <HistoryIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-3">
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            isHealthy 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {isHealthy ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
            {isHealthy ? 'Healthy' : 'Disease'}
          </div>
          
          <button
            onClick={() => onDelete(item.id)}
            className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Disease Name */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {item.topDisease}
        </h3>

        {/* Confidence */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <span>Confidence:</span>
          <span className={`font-medium ${
            item.confidence >= 0.8 ? 'text-green-600' :
            item.confidence >= 0.6 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {confidence}%
          </span>
        </div>

        {/* Metadata */}
        <div className="space-y-2 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{new Date(item.timestamp).toLocaleDateString()}</span>
          </div>
          
          {item.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate">
                {item.location.address || 'Location captured'}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default HistoryPage;
import React from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle,
  TrendingUp,
  MapPin,
  Calendar,
  Award,
  Activity,
  Info
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from "recharts";

const PredictionResults = ({ results }) => {
  const { predictions, location, timestamp } = results;
  const topPrediction = predictions[0];

  const isHealthy = topPrediction.disease.toLowerCase().includes('healthy');

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBackground = (confidence) => {
    if (confidence >= 0.8) return 'bg-green-100';
    if (confidence >= 0.6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8"
    >
      <div className="flex items-center gap-3 mb-6">
        {isHealthy ? (
          <CheckCircle className="w-8 h-8 text-green-600" />
        ) : (
          <AlertCircle className="w-8 h-8 text-red-600" />
        )}
        <h2 className="text-2xl font-bold text-gray-900">
          Diagnosis Results
        </h2>
      </div>

      {/* Top Prediction */}
      <div className={`rounded-xl p-6 mb-6 ${isHealthy ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-semibold text-gray-900">
            Primary Diagnosis
          </h3>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceBackground(topPrediction.confidence)
            } ${getConfidenceColor(topPrediction.confidence)}`}>
            {(topPrediction.confidence * 100).toFixed(1)}% confidence
          </div>
        </div>

        <h4 className="text-2xl font-bold text-gray-900 mb-2">
          {topPrediction.disease}
        </h4>

        {isHealthy ? (
          <p className="text-green-700">
            Great news! Your plant appears to be healthy. Continue with regular care and monitoring.
          </p>
        ) : (
          <p className="text-red-700">
            Disease detected. Please review the treatment recommendations below for proper care.
          </p>
        )}
      </div>

      {/* Rich Analytics Section */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Confidence Distribution Chart */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            Confidence Analysis
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={predictions.slice(0, 5)} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 1]} hide />
                <YAxis
                  dataKey="disease"
                  type="category"
                  width={100}
                  tick={{ fontSize: 11 }}
                  interval={0}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${(value * 100).toFixed(1)}%`, 'Confidence']}
                />
                <Bar dataKey="confidence" radius={[0, 4, 4, 0]}>
                  {predictions.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? (isHealthy ? '#10b981' : '#ef4444') : '#94a3b8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Health Score Gauge */}
        <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center justify-center">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Plant Health Score</h4>
          <div className="relative w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { value: isHealthy ? topPrediction.confidence : (1 - topPrediction.confidence), fill: isHealthy ? '#10b981' : '#ef4444' },
                    { value: 1 - (isHealthy ? topPrediction.confidence : (1 - topPrediction.confidence)), fill: '#e2e8f0' }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  startAngle={180}
                  endAngle={0}
                  dataKey="value"
                  cornerRadius={10}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
              <span className={`text-4xl font-bold ${isHealthy ? 'text-emerald-600' : 'text-red-600'}`}>
                {Math.round((isHealthy ? topPrediction.confidence : (1 - topPrediction.confidence)) * 100)}
              </span>
              <span className="text-sm text-gray-500 font-medium">/ 100</span>
            </div>
          </div>
          <p className="text-center text-sm text-gray-600 mt-[-20px] max-w-xs">
            {isHealthy
              ? "Your plant is showing strong signs of vitality!"
              : "Health compromised. Immediate attention recommended."}
          </p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-500" />
          Detailed Breakdown
        </h4>
        <div className="space-y-3">
          {predictions.slice(0, 3).map((pred, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${index === 0 ? 'bg-emerald-500' : 'bg-gray-400'
                  }`}>
                  #{index + 1}
                </div>
                <span className="font-medium text-gray-900">{pred.disease}</span>
              </div>

              <div className="w-32 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${index === 0 ? (isHealthy ? 'bg-emerald-500' : 'bg-red-500') : 'bg-gray-400'}`}
                  style={{ width: `${pred.confidence * 100}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Metadata */}
      <div className="border-t border-gray-200 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>
              Analyzed: {new Date(timestamp || Date.now()).toLocaleString()}
            </span>
          </div>

          {location && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>
                Location: {location.address || `${location.latitude?.toFixed(4)}, ${location.longitude?.toFixed(4)}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        <motion.a
          href="https://buymeacoffee.com/manishghoshal99"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
        >
          <Award className="w-4 h-4" />
          Ask Expert
        </motion.a>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            const dataStr = JSON.stringify(results, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `diagnosis-${Date.now()}.json`;
            link.click();
            URL.revokeObjectURL(url);
          }}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
        >
          Export Results
        </motion.button>
      </div>
    </motion.div>
  );
};

export default PredictionResults;
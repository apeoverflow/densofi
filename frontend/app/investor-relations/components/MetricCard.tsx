'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import type { MetricCardProps } from '../types';

export default function MetricCard({ 
  icon, 
  title, 
  value, 
  subtitle, 
  uncertainty, 
  description 
}: MetricCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.02 }}
      className="relative bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
    >
      {/* Icon and uncertainty indicator */}
      <div className="flex items-start justify-between mb-4">
        <div className="text-blue-400">
          {icon}
        </div>
        {uncertainty && (
          <div className="relative">
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="text-yellow-400 hover:text-yellow-300 transition-colors duration-200"
              aria-label="Estimated value"
            >
              <Info className="w-4 h-4" />
            </button>
            
            {/* Tooltip */}
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-0 top-6 z-50 w-64 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl"
              >
                <p className="text-sm text-gray-300">
                  This value is estimated and should be verified with current platform data.
                </p>
                <div className="absolute -top-1 right-2 w-2 h-2 bg-gray-900 border-l border-t border-gray-700 rotate-45"></div>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Main value */}
      <div className="mb-2">
        <div className="flex items-baseline gap-1">
          <h3 className="text-2xl md:text-3xl font-bold text-white">
            {value}
          </h3>
          {uncertainty && (
            <span className="text-yellow-400 text-sm font-medium">?</span>
          )}
        </div>
        <p className="text-gray-400 text-sm font-medium">
          {subtitle}
        </p>
      </div>

      {/* Title */}
      <h4 className="text-lg font-semibold text-white mb-3">
        {title}
      </h4>

      {/* Description */}
      <p className="text-gray-300 text-sm leading-relaxed">
        {description}
      </p>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  );
}
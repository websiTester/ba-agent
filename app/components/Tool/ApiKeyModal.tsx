'use client';

import React, { useState, useEffect } from 'react';
import { X, Key, Eye, EyeOff, Save } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApiKeyModal({ isOpen, onClose }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadApiKey();
    }
  }, [isOpen]);

  const loadApiKey = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://127.0.0.1:8000/apikeys/apikey', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load API key');
      }

      const data = await response.json();
      
      if (data.success && data.api_key) {
        setApiKey(data.api_key);
        localStorage.setItem('user_api_key', data.api_key);
      }
    } catch (error) {
      console.error('Error loading API key:', error);
      setError('Không thể tải API key từ database.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      const response = await fetch('http://127.0.0.1:8000/apikeys/apikey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });

      if (!response.ok) {
        throw new Error('Failed to save API key');
      }

      // Lưu API key vào localStorage
      localStorage.setItem('user_api_key', apiKey);
      onClose();
    } catch (error) {
      console.error('Error saving API key:', error);
      setError('Không thể lưu API key. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setApiKey('');
    setShowApiKey(false);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-orange-100/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-lg">
              <Key size={18} className="text-orange-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-800">API Key</h3>
          </div>
          <button 
            onClick={handleClose}
            className="p-1.5 hover:bg-orange-50 rounded-lg transition-colors group"
            aria-label="Close"
          >
            <X size={18} className="text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nhập API Key của bạn
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
              disabled={isLoading}
              className="w-full px-4 py-2.5 pr-12 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
            >
              {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            API Key sẽ được lưu trữ cục bộ trên trình duyệt của bạn.
          </p>
          {error && (
            <p className="text-xs text-red-500 mt-2 font-medium">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-orange-100/50 bg-gradient-to-b from-white to-orange-50/20">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={!apiKey.trim() || isSaving || isLoading}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium text-white bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            <Save size={16} />
            <span>{isSaving ? 'Đang lưu...' : isLoading ? 'Đang tải...' : 'Lưu'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

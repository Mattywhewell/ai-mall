'use client';

import { useState, useRef } from 'react';
import { Mic, Camera, X } from 'lucide-react';
import Image from 'next/image';

type Props = {
  onSearchQueryChange: (query: string) => void;
  onImageSearch: (imageUrl: string) => void;
};

export function VoiceAndImageSearch({ onSearchQueryChange, onImageSearch }: Props) {
  const [isListening, setIsListening] = useState(false);
  const [imageSearch, setImageSearch] = useState<string | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice Search
  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice search is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onSearchQueryChange(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Voice recognition error:', event.error);
      setIsListening(false);
      alert(`Voice search error: ${event.error}`);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Image Search
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setImageSearch(imageUrl);
      setShowImageUpload(false);
      onImageSearch(imageUrl);
      // In production, send to AI vision API (OpenAI Vision, Google Cloud Vision, etc.)
      onSearchQueryChange('Visual search - finding similar products');
    };
    reader.readAsDataURL(file);
  };

  const clearImageSearch = () => {
    setImageSearch(null);
    onSearchQueryChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        {/* Voice Search Button */}
        <button
          onClick={handleVoiceSearch}
          disabled={isListening}
          className={`p-3 border-2 rounded-xl transition-all ${
            isListening 
              ? 'border-red-500 bg-red-50 animate-pulse' 
              : 'border-gray-200 hover:border-purple-500'
          }`}
          title="Voice search (Click and speak)"
        >
          <Mic className={`w-5 h-5 ${isListening ? 'text-red-600' : 'text-gray-600'}`} />
        </button>

        {/* Image Search Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-3 border-2 border-gray-200 rounded-xl hover:border-purple-500 transition-colors"
          title="Search by image"
        >
          <Camera className="w-5 h-5 text-gray-600" />
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Voice Search Status */}
      {isListening && (
        <div className="mt-4 flex items-center justify-center space-x-2 text-red-600 animate-in slide-in-from-top">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          <span className="ml-2 text-sm font-medium">🎤 Listening... Speak now</span>
        </div>
      )}

      {/* Image Search Preview */}
      {imageSearch && (
        <div className="mt-4 relative inline-block animate-in fade-in">
          <div className="relative group">
            <Image
              src={imageSearch}
              alt="Search image"
              width={120}
              height={120}
              className="rounded-xl object-cover border-2 border-purple-300"
            />
            <button
              onClick={clearImageSearch}
              className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-lg hover:scale-110"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-gray-600 mt-2 text-center font-medium">
            📸 Searching by image
          </div>
        </div>
      )}
    </>
  );
}

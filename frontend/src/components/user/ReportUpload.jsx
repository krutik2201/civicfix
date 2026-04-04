import React, { useState, useRef } from 'react';
import { FiUpload, FiCamera, FiX } from 'react-icons/fi';

const ReportUpload = ({ onImageSelect, onLocationSelect }) => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [location, setLocation] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
      onImageSelect(file);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current.click();
  };

  const handleRemoveImage = () => {
    setImage(null);
    setPreview(null);
    onImageSelect(null);
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setLocation(loc);
          onLocationSelect(loc);
        },
        (error) => {
          alert('Unable to get location. Please enable location services.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Report Infrastructure Issue
      </h2>

      {/* Image Upload Area */}
      <div className="mb-6">
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
            ${preview ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'}`}
          onClick={handleCameraClick}
        >
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveImage();
                }}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
              >
                <FiX />
              </button>
            </div>
          ) : (
            <div className="py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <FiCamera className="text-3xl text-blue-600" />
              </div>
              <p className="text-gray-600 mb-2">Click to upload or take a photo</p>
              <p className="text-sm text-gray-500">Supports JPG, PNG (Max 5MB)</p>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            capture="environment"
            className="hidden"
          />
        </div>
      </div>

      {/* Location Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          Location
        </h3>
        <div className="flex items-center gap-4">
          <button
            onClick={handleGetLocation}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <FiCamera />
            {location ? 'Update Location' : 'Use Current Location'}
          </button>
        </div>
        {location && (
          <div className="mt-3 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              📍 Location captured: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
          </div>
        )}
      </div>

      {/* Upload Button */}
      <button
        onClick={handleCameraClick}
        disabled={!preview}
        className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2
          ${preview
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
      >
        <FiUpload />
        {preview ? 'Upload for AI Analysis' : 'Upload a photo first'}
      </button>

      <p className="text-sm text-gray-500 text-center mt-4">
        Our AI will analyze the image and assign a severity score
      </p>
    </div>
  );
};

export default ReportUpload;  
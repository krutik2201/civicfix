import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUpload, FiShield, FiMapPin, FiCheck } from 'react-icons/fi';

const LoadingSequence = ({ isActive, currentStep, onComplete }) => {
  const steps = [
    {
      id: 1,
      title: "Uploading to Secure Cloud",
      icon: <FiUpload className="text-xl" />,
      duration: 1000,
    },
    {
      id: 2,
      title: "AI Analyzing Structural Integrity",
      icon: <FiShield className="text-xl" />,
      duration: 2000,
    },
    {
      id: 3,
      title: "Verifying GPS Coordinates",
      icon: <FiMapPin className="text-xl" />,
      duration: 1000,
    },
    {
      id: 4,
      title: "Analysis Complete",
      icon: <FiCheck className="text-xl" />,
      duration: 500,
    },
  ];

  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    let timeout;
    const currentStepObj = steps[activeStep];

    if (activeStep < steps.length - 1) {
      timeout = setTimeout(() => {
        setActiveStep(activeStep + 1);
      }, currentStepObj.duration);
    } else {
      timeout = setTimeout(() => {
        onComplete();
      }, currentStepObj.duration);
    }

    return () => clearTimeout(timeout);
  }, [isActive, activeStep, onComplete]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
          Analyzing Report
        </h2>

        <div className="space-y-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: index <= activeStep ? 1 : 0.3,
                x: 0,
              }}
              transition={{ duration: 0.3 }}
              className={`flex items-center gap-4 p-4 rounded-xl transition-all
                ${index === activeStep ? 'bg-blue-50 border-2 border-blue-200' : ''}
                ${index < activeStep ? 'bg-green-50 border border-green-200' : ''}
                ${index > activeStep ? 'bg-gray-50 border border-gray-200' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center
                ${index === activeStep ? 'bg-blue-100 text-blue-600' : ''}
                ${index < activeStep ? 'bg-green-100 text-green-600' : ''}
                ${index > activeStep ? 'bg-gray-100 text-gray-400' : ''}`}>
                {step.icon}
              </div>

              <div className="flex-1">
                <p className={`font-medium
                  ${index === activeStep ? 'text-blue-700' : ''}
                  ${index < activeStep ? 'text-green-700' : ''}
                  ${index > activeStep ? 'text-gray-400' : ''}`}>
                  {step.title}
                </p>
                {index === activeStep && (
                  <motion.div
                    className="h-1 bg-blue-500 rounded-full mt-2"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: step.duration / 1000 }}
                  />
                )}
              </div>

              {index < activeStep && (
                <FiCheck className="text-green-500 text-xl" />
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Our AI is examining the infrastructure issue...
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingSequence;
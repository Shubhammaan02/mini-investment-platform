// frontend/src/components/auth/PasswordStrength.tsx
'use client';

import React from 'react';

interface PasswordStrengthProps {
  password: string;
}

interface StrengthAnalysis {
  score: number;
  strength: 'weak' | 'medium' | 'strong';
  feedback: string[];
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const analyzePassword = (pwd: string): StrengthAnalysis => {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (pwd.length >= 12) {
      score += 2;
    } else if (pwd.length >= 8) {
      score += 1;
      feedback.push('Use at least 12 characters for better security');
    } else {
      feedback.push('Password should be at least 8 characters long');
    }

    // Upper case letters
    if (/[A-Z]/.test(pwd)) {
      score += 1;
    } else {
      feedback.push('Include uppercase letters');
    }

    // Lower case letters
    if (/[a-z]/.test(pwd)) {
      score += 1;
    } else {
      feedback.push('Include lowercase letters');
    }

    // Numbers
    if (/[0-9]/.test(pwd)) {
      score += 1;
    } else {
      feedback.push('Include numbers');
    }

    // Special characters
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      score += 1;
    } else {
      feedback.push('Add special characters (!@#$% etc.)');
    }

    // Determine strength
    let strength: 'weak' | 'medium' | 'strong';
    if (score >= 5) {
      strength = 'strong';
      feedback.length = 0; // Clear feedback for strong passwords
      feedback.push('Excellent! Your password is strong and secure');
    } else if (score >= 3) {
      strength = 'medium';
    } else {
      strength = 'weak';
    }

    return { score, strength, feedback };
  };

  const analysis = analyzePassword(password);

  if (!password) return null;

  const getStrengthColor = () => {
    switch (analysis.strength) {
      case 'weak': return 'bg-danger-500';
      case 'medium': return 'bg-warning-500';
      case 'strong': return 'bg-success-500';
      default: return 'bg-gray-300';
    }
  };

  const getStrengthText = () => {
    switch (analysis.strength) {
      case 'weak': return 'Weak';
      case 'medium': return 'Medium';
      case 'strong': return 'Strong';
      default: return '';
    }
  };

  const getStrengthTextColor = () => {
    switch (analysis.strength) {
      case 'weak': return 'text-danger-600';
      case 'medium': return 'text-warning-600';
      case 'strong': return 'text-success-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Password strength</span>
        <span className={`text-sm font-semibold ${getStrengthTextColor()}`}>
          {getStrengthText()}
        </span>
      </div>
      
      {/* Strength bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
          style={{
            width: `${(analysis.score / 5) * 100}%`
          }}
        />
      </div>

      {/* Feedback */}
      {analysis.feedback.length > 0 && (
        <div className="space-y-1 strength-pass-bg">
          {analysis.feedback.map((message, index) => (
            <div
              key={index}
              className={`text-xs flex items-center space-x-1 ${
                analysis.strength === 'strong' ? 'text-success-600' : 'text-gray-600'
              }`}
            >
              {analysis.strength === 'strong' ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
              <span>{message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
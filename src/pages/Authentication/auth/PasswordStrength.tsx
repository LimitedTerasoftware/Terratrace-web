import React, { useEffect, useState } from 'react';

interface PasswordStrengthProps {
  password: string;
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const [strength, setStrength] = useState<number>(0);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    calculateStrength(password);
  }, [password]);

  const calculateStrength = (pass: string) => {
    if (!pass) {
      setStrength(0);
      setMessage('');
      return;
    }

    let score = 0;
    
    // Length check
    if (pass.length >= 8) score += 1;
    if (pass.length >= 12) score += 1;
    
    // Complexity checks
    if (/[a-z]/.test(pass)) score += 1; // lowercase
    if (/[A-Z]/.test(pass)) score += 1; // uppercase
    if (/[0-9]/.test(pass)) score += 1; // numbers
    if (/[^a-zA-Z0-9]/.test(pass)) score += 1; // special chars
    
    // Deductions for common patterns
    if (/^[a-zA-Z]+$/.test(pass)) score -= 1; // only letters
    if (/^[0-9]+$/.test(pass)) score -= 1; // only numbers
    if (/(.)\1{2,}/.test(pass)) score -= 1; // repeated characters
    
    // Ensure score is at least 0
    score = Math.max(0, score);
    
    // Cap at 5
    score = Math.min(5, score);
    
    setStrength(score);
    
    // Set appropriate message
    const messages = [
      'Too weak',
      'Weak',
      'Fair',
      'Good',
      'Strong',
      'Very strong'
    ];
    
    setMessage(messages[score]);
  };

  const getColor = () => {
    const colors = [
      'bg-red-500', // 0 - Too weak
      'bg-red-500', // 1 - Weak
      'bg-yellow-500', // 2 - Fair
      'bg-yellow-400', // 3 - Good
      'bg-green-500', // 4 - Strong
      'bg-green-600', // 5 - Very strong
    ];
    
    return colors[strength];
  };

  const getWidth = () => {
    return `${(strength / 5) * 100}%`;
  };

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor()} transition-all duration-300 ease-in-out`} 
          style={{ width: getWidth() }}
        />
      </div>
      <p className={`text-xs mt-1 ${strength <= 1 ? 'text-red-500' : strength <= 3 ? 'text-yellow-600' : 'text-green-600'}`}>
        {message}
      </p>
    </div>
  );
};

export default PasswordStrength;
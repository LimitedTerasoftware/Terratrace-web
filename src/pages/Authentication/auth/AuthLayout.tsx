import React from 'react';
import { Zap } from 'lucide-react';
import Logo from '../../../images/logo/Tricad.png';
import BGImage from '../../../images/cover/abstract-futuristic-digital-lines-wavy-pattern-backdrop-design-vector.png';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Branding Side */}
      <div className="w-full md:w-1/2 bg-[#111827] p-8 md:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Network grid background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.15) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>

        {/* Fiber network lines */}
        <div className="absolute inset-0 opacity-20">
          <img src={BGImage}/>
          <svg className="w-full h-full">
            <defs>
              <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#818CF8" stopOpacity="0.5" />
              </linearGradient>
            </defs>
            <path d="M0 200 Q 400 0 800 300" stroke="url(#line-gradient)" strokeWidth="1" fill="none" />
            <path d="M0 400 Q 400 200 800 500" stroke="url(#line-gradient)" strokeWidth="1" fill="none" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative animate-fade-in">
          <div className="flex items-center">
             <img className="h-15 w-auto" src={Logo} alt="Logo" />
          </div>
          <div className="mt-16 md:mt-13">
            <h6 className="text-3xl md:text-3xl font-bold text-gray-100">
              Deploy smarter. Track faster. Build better.
            </h6>
            <p className="mt-4 text-gray-400 max-w-md">
              An AI-first platform for managing fiber and utility projects at scale.
            </p>
          </div>
        </div>
        
        {/* Network Status Card */}
        <div className="hidden md:block relative mt-16">
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 animate-float">
            <div className="flex items-center space-x-3">
              <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
              <div className="h-3 w-3 bg-blue-400 rounded-full animate-pulse-slow"></div>
              <div className="h-3 w-3 bg-purple-400 rounded-full animate-pulse"></div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-800/50 rounded"></div>
              ))}
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div className="h-2 w-16 bg-gray-700 rounded"></div>
              <div className="h-8 w-24 bg-gradient-to-r from-gray-700 to-gray-600 rounded"></div>
            </div>
          </div>
        </div>

        {/* Connection points */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-2 h-2 bg-purple-400 rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
      </div>
      
      {/* Form Side */}
      <div className="w-full md:w-1/2 bg-[#F1F3F6] p-8 md:p-16 flex flex-col justify-center">
        <div className="max-w-md w-full mx-auto">
          <Link className="mb-5.5 inline-flex items-center gap-2 text-[18px] font-medium" to="/">
          
          <div className="text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
          </div>
           </Link>
          <div className="mt-8 animate-fade-up">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
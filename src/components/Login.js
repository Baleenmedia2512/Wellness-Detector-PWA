import React from 'react';

const Login = ({ onSignIn, loading }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Splashing background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-green-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-teal-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 right-0 w-60 h-60 bg-emerald-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>
      
      {/* Login card */}
      <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden relative z-10 border border-white/20">
        {/* Decorative accent */}
        <div className="h-2 bg-gradient-to-r from-green-400 to-teal-400"></div>
        
        <div className="p-8">
          <div className="text-center mb-8">
            {/* Animated logo */}
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Wellness Buddy</h1>
            <p className="text-gray-500">Sign in to continue your wellness journey</p>
          </div>
          
          {/* Enhanced Google button */}
          <button
            onClick={onSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center px-6 py-3.5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 disabled:opacity-50"
          >
            <div className="flex items-center">
              <img 
                src="https://developers.google.com/identity/images/g-logo.png"
                alt="Google logo" 
                className="h-5 w-5 mr-3"
              />
              <span className="text-sm font-medium text-gray-700">
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : 'Continue with Google'}
              </span>
            </div>
          </button>
          
          {/* Footer text */}
          <p className="mt-6 text-center text-xs text-gray-400">
            By continuing, you agree to our <span className="text-green-500">Terms</span> and <span className="text-green-500">Privacy Policy</span>
          </p>
        </div>
      </div>
      
      {/* Add animation styles */}
      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Login;
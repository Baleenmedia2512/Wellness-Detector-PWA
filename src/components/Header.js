import React, { useState } from 'react';
import { LogOut, Camera } from 'lucide-react';

const Header = ({ user, onTestCamera, onSignOut }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="bg-white shadow-lg border-b-4 border-green-500">
      <div className="max-w-md mx-auto px-4 pt-4 pb-3 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-green-700 flex items-center space-x-2">
            <span className="text-2xl">🌿</span>
            <span>Wellness Buddy</span>
          </h1>
          <p className="text-sm text-green-600 mt-1 ml-10">
            Track your meals effortlessly
          </p>
        </div>

        <div className="relative pt-1">
          <button
            onClick={toggleMenu}
            className="focus:outline-none"
            title="User Menu"
          >
            <img
              src={user.photoURL || 'https://i.pravatar.cc/40'}
              alt="User Avatar"
              className="h-10 w-10 rounded-full border border-gray-300 shadow-sm"
            />
          </button>

          {menuOpen && (
            <div className="absolute right-0 w-56 bg-white rounded-xl shadow-xl ring-1 ring-black/5 z-50">
              <div className="py-2">
                <button
                  onClick={() => {
                    onTestCamera();
                    closeMenu();
                  }}
                  className="w-full px-4 py-3 flex items-start space-x-3 hover:bg-gray-50 text-left transition-colors"
                >
                  <Camera className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Test Camera</p>
                    <p className="text-xs text-gray-500">Check your device camera</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onSignOut();
                    closeMenu();
                  }}
                  className="w-full px-4 py-3 flex items-start space-x-3 hover:bg-gray-50 text-left transition-colors"
                >
                  <LogOut className="h-5 w-5 text-red-600 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Sign Out</p>
                    <p className="text-xs text-gray-500">Logout from your account</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

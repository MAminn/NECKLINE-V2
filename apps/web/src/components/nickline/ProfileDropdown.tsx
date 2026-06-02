import { useState, useEffect, useRef } from "react";
import { User as UserIcon, LogOut, Settings, Package, Heart, LayoutDashboard, LogIn } from "lucide-react";

// Mock user type that includes the requirements
export interface UserProfile {
  name: string;
  email: string;
  role: 'admin' | 'customer';
}

interface ProfileDropdownProps {
  user?: UserProfile | null;
  onLogout: () => void;
  onOpenAdmin?: () => void;
}

export default function ProfileDropdown({ user, onLogout, onOpenAdmin }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 transition-colors duration-200 rounded-full cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <UserIcon className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-lg py-1 z-50">
          
          {/* User Context Header */}
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
            <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
              {user ? user.name : 'Welcome, Guest'}
            </p>
            <p className="text-xs text-neutral-500 truncate">
              {user ? user.email : 'Sign In'}
            </p>
          </div>

          {user && (
            <div className="py-1">
              {/* Conditional Admin Guard */}
              {user.role === 'admin' && (
                <button 
                  onClick={() => {
                    console.log("Navigating to admin dashboard for user:", user.email);
                    setIsOpen(false);
                    onOpenAdmin?.();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </button>
              )}

              {/* Standard Navigation Links */}
              <button 
                onClick={() => {
                  console.log("Navigating to /account for user:", user.email);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                My Account
              </button>
              <button 
                onClick={() => {
                  console.log("Navigating to /orders for user:", user.email);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <Package className="w-4 h-4" />
                Orders
              </button>
              <button 
                onClick={() => {
                  console.log("Navigating to /wishlist for user:", user.email);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <Heart className="w-4 h-4" />
                Wishlist
              </button>
            </div>
          )}

          <div className="border-t border-neutral-200 dark:border-neutral-800 py-1">
            {user ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            ) : (
              <button
                onClick={() => {
                  console.log("Navigating to Login component");
                  setIsOpen(false);
                  onOpenAdmin?.(); // Temporarily utilizing admin entry for general login overlay per current architecture
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                Login
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

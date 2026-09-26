import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flower2,
  HelpCircle,
  Mail,
  Lock,
  User,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useOrganizerAuth } from '../../hooks/useOrganizerAuth';

type TabType = 'organizer' | 'staff';

export default function EventOpsAuth(): React.JSX.Element {
  const navigate = useNavigate();
  const auth = useOrganizerAuth(() => navigate('/events', { replace: true }));

  // The tab is just which role a new account gets; signing in works the same either way.
  const activeTab: TabType = auth.role;
  const isRegister = auth.mode === 'register';

  const handleTabSwitch = (tab: TabType) => {
    auth.setRole(tab);
    auth.clearError();
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-[#121d1e] bg-[#f7f6f2]">
      {/* 1. Header */}
      <header className="w-full bg-[#f7f6f2]">
        <div className="max-w-300 mx-auto flex justify-between items-center px-9 py-3">
          <div className="flex items-center gap-3">
            <Flower2 className="w-6 h-6 text-[#001f1f] fill-[#001f1f]" />
            <span className="text-[22px] font-medium text-[#001f1f] tracking-tight">EventOps</span>
          </div>
          <button
            type="button"
            className="text-[#414848] hover:text-[#001f1f] transition-colors text-sm flex items-center gap-2 cursor-pointer"
          >
            <span>Help</span>
            <HelpCircle className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* 2. Main Canvas */}
      <main className="grow flex items-center justify-center p-5">
        <div className="w-full max-w-md bg-white rounded-[14px] shadow-[0_4px_12px_rgba(0,31,31,0.06),0_1px_2px_rgba(0,31,31,0.04),0_0_0_1px_rgba(0,31,31,0.05)] p-12">

          {/* Role tabs — only relevant when creating an account */}
          <div className="flex border-b border-[#d9e5e5] mb-8">
            <button
              type="button"
              onClick={() => handleTabSwitch('organizer')}
              className={`flex-1 py-3 text-sm text-center transition-all cursor-pointer ${
                activeTab === 'organizer'
                  ? 'text-[#001f1f] border-b-2 border-[#001f1f] font-medium'
                  : 'text-[#414848] border-b-2 border-transparent hover:text-[#001f1f]'
              }`}
            >
              Organizer
            </button>
            <button
              type="button"
              onClick={() => handleTabSwitch('staff')}
              className={`flex-1 py-3 text-sm text-center transition-all cursor-pointer ${
                activeTab === 'staff'
                  ? 'text-[#001f1f] border-b-2 border-[#001f1f] font-medium'
                  : 'text-[#414848] border-b-2 border-transparent hover:text-[#001f1f]'
              }`}
            >
              Event Staff
            </button>
          </div>

          {/* Error Banner */}
          {auth.errorMessage && (
            <div className="mb-6 p-3 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-xl flex items-center gap-2 text-[#93000a] text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{auth.errorMessage}</span>
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-[22px] font-medium text-[#001f1f] mb-2 leading-tight">
              {isRegister
                ? activeTab === 'staff'
                  ? 'Create a Staff Account'
                  : 'Create an Organizer Account'
                : 'Sign in'}
            </h2>
            <p className="text-sm text-[#414848]">
              {activeTab === 'staff'
                ? 'See the tasks and floor plan for events you are on.'
                : 'Manage your events and production teams.'}
            </p>
          </div>

          <form onSubmit={auth.handleLogin} className="space-y-5">
            <div className="space-y-3">
              {/* Name — sign-up only */}
              {isRegister && (
                <div>
                  <label
                    htmlFor="auth-name"
                    className="block text-[11px] font-medium tracking-[0.08em] text-[#001f1f] mb-2 uppercase"
                  >
                    Full Name
                  </label>
                  <div className="rounded-xl bg-white flex items-center px-3 h-12 shadow-[0_0_0_0.5px_rgba(0,31,31,0.2)] focus-within:shadow-[0_0_0_1.5px_rgba(0,31,31,0.8)] transition-shadow">
                    <User className="w-5 h-5 text-[#717878] mr-3 shrink-0" />
                    <input
                      id="auth-name"
                      type="text"
                      required
                      disabled={auth.isLoading}
                      value={auth.name}
                      onChange={(e) => auth.setName(e.target.value)}
                      placeholder="Alex Morgan"
                      className="w-full bg-transparent border-none p-0 text-sm text-[#001f1f] placeholder-[#c1c8c7] focus:outline-none focus:ring-0 disabled:opacity-50"
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-[11px] font-medium tracking-[0.08em] text-[#001f1f] mb-2 uppercase"
                >
                  Email Address
                </label>
                <div className="rounded-xl bg-white flex items-center px-3 h-12 shadow-[0_0_0_0.5px_rgba(0,31,31,0.2)] focus-within:shadow-[0_0_0_1.5px_rgba(0,31,31,0.8)] transition-shadow">
                  <Mail className="w-5 h-5 text-[#717878] mr-3 shrink-0" />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    disabled={auth.isLoading}
                    value={auth.email}
                    onChange={(e) => auth.setEmail(e.target.value)}
                    placeholder="jane@eventops.com"
                    className="w-full bg-transparent border-none p-0 text-sm text-[#001f1f] placeholder-[#c1c8c7] focus:outline-none focus:ring-0 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-[11px] font-medium tracking-[0.08em] text-[#001f1f] mb-2 uppercase"
                >
                  Password
                </label>
                <div className="rounded-xl bg-white flex items-center px-3 h-12 shadow-[0_0_0_0.5px_rgba(0,31,31,0.2)] focus-within:shadow-[0_0_0_1.5px_rgba(0,31,31,0.8)] transition-shadow">
                  <Lock className="w-5 h-5 text-[#717878] mr-3 shrink-0" />
                  <input
                    id="auth-password"
                    type="password"
                    required
                    minLength={6}
                    disabled={auth.isLoading}
                    value={auth.password}
                    onChange={(e) => auth.setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent border-none p-0 text-sm text-[#001f1f] placeholder-[#c1c8c7] focus:outline-none focus:ring-0 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={auth.isLoading}
              className="w-full h-12 bg-[#001f1f] text-white rounded-[29px] text-sm font-medium hover:bg-opacity-90 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {auth.isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isRegister ? 'Creating account...' : 'Signing in...'}</span>
                </>
              ) : (
                <span>{isRegister ? 'Create account' : 'Sign in to Dashboard'}</span>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex py-2 items-center">
              <div className="grow border-t border-[#d9e5e5]"></div>
              <span className="shrink-0 mx-3 text-[11px] font-medium text-[#c1c8c7] uppercase tracking-wider">
                Or
              </span>
              <div className="grow border-t border-[#d9e5e5]"></div>
            </div>

            <button
              type="button"
              onClick={() => auth.switchMode(isRegister ? 'login' : 'register')}
              className="w-full h-12 border-[1.5px] border-[#001f1f] text-[#001f1f] rounded-[29px] text-sm font-medium hover:bg-[#001f1f]/5 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isRegister ? 'I already have an account' : 'Create a new account'}
            </button>
          </form>
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="w-full bg-[#f7f6f2] mt-auto">
        <div className="max-w-300 mx-auto flex flex-col md:flex-row justify-between items-center px-9 py-8">
          <div className="text-sm text-[#414848] mb-4 md:mb-0">
            © {new Date().getFullYear()} EventOps. All rights reserved.
          </div>
          <div className="flex gap-8">
            <a href="#privacy" className="text-sm text-[#414848] hover:text-[#001f1f] transition-colors duration-200">
              Privacy Policy
            </a>
            <a href="#terms" className="text-sm text-[#414848] hover:text-[#001f1f] transition-colors duration-200">
              Terms of Service
            </a>
            <a href="#support" className="text-sm text-[#414848] hover:text-[#001f1f] transition-colors duration-200">
              Contact Support
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  Flower2, 
  HelpCircle, 
  Mail, 
  Lock, 
  Sparkles, 
  User, 
  Smartphone, 
  Ticket 
} from 'lucide-react';

type TabType = 'organizer' | 'staff';

export default function EventOpsAuth(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabType>('organizer');

  // Organizer Form State
  const [organizerEmail, setOrganizerEmail] = useState('');
  const [organizerPassword, setOrganizerPassword] = useState('');

  // Staff Form State
  const [staffName, setStaffName] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [eventCode, setEventCode] = useState('');

  const handleOrganizerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Organizer Login:', { email: organizerEmail, password: organizerPassword });
  };

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Staff Login:', { name: staffName, phone: staffPhone, eventCode });
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-[#121d1e] bg-[#f7f6f2]">
      {/* 1. Header */}
      <header className="w-full top-0 bg-[#f7f6f2] flex justify-between items-center px-9 py-3 max-w-300 mx-auto z-50">
        <div className="flex items-center gap-3">
          <Flower2 className="w-6 h-6 text-[#001f1f] fill-[#001f1f]" />
          <span className="text-[22px] font-medium text-[#001f1f] tracking-tight">EventOps</span>
        </div>
        <div className="flex items-center">
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
          
          {/* Tab Navigation */}
          <div className="flex border-b border-[#d9e5e5] mb-9">
            <button
              type="button"
              onClick={() => setActiveTab('organizer')}
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
              onClick={() => setActiveTab('staff')}
              className={`flex-1 py-3 text-sm text-center transition-all cursor-pointer ${
                activeTab === 'staff'
                  ? 'text-[#001f1f] border-b-2 border-[#001f1f] font-medium'
                  : 'text-[#414848] border-b-2 border-transparent hover:text-[#001f1f]'
              }`}
            >
              Event Staff
            </button>
          </div>

          {/* TAB 1: ORGANIZER TAB */}
          {activeTab === 'organizer' && (
            <div className="animate-fadeIn">
              <div className="mb-9">
                <h2 className="text-[22px] font-medium text-[#001f1f] mb-2 leading-tight">
                  Organizer Sign-in
                </h2>
                <p className="text-sm text-[#414848]">
                  Manage your events and production teams.
                </p>
              </div>

              <form onSubmit={handleOrganizerSubmit} className="space-y-5">
                <div className="space-y-3">
                  {/* Email Field */}
                  <div>
                    <label className="block text-[11px] font-medium tracking-[0.08em] text-[#001f1f] mb-2 uppercase">
                      Email Address
                    </label>
                    <div className="rounded-xl bg-white flex items-center px-3 h-12 shadow-[0_0_0_0.5px_rgba(0,31,31,0.2)] focus-within:shadow-[0_0_0_1.5px_rgba(0,31,31,0.8)] transition-shadow">
                      <Mail className="w-5 h-5 text-[#717878] mr-3 shrink-0" />
                      <input
                        type="email"
                        required
                        value={organizerEmail}
                        onChange={(e) => setOrganizerEmail(e.target.value)}
                        placeholder="jane@eventops.com"
                        className="w-full bg-transparent border-none p-0 text-sm text-[#001f1f] placeholder-[#c1c8c7] focus:outline-none focus:ring-0"
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                      <label className="block text-[11px] font-medium tracking-[0.08em] text-[#001f1f] uppercase">
                        Password
                      </label>
                      <a href="#forgot" className="text-[11px] font-medium text-[#001f1f] hover:underline">
                        Forgot?
                      </a>
                    </div>
                    <div className="rounded-xl bg-white flex items-center px-3 h-12 shadow-[0_0_0_0.5px_rgba(0,31,31,0.2)] focus-within:shadow-[0_0_0_1.5px_rgba(0,31,31,0.8)] transition-shadow">
                      <Lock className="w-5 h-5 text-[#717878] mr-3 shrink-0" />
                      <input
                        type="password"
                        required
                        value={organizerPassword}
                        onChange={(e) => setOrganizerPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-transparent border-none p-0 text-sm text-[#001f1f] placeholder-[#c1c8c7] focus:outline-none focus:ring-0"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full h-12 bg-[#001f1f] text-white rounded-[29px] text-sm font-medium hover:bg-opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Sign in to Dashboard
                </button>

                {/* Divider */}
                <div className="relative flex py-3 items-center">
                  <div className="grow border-t border-[#d9e5e5]"></div>
                  <span className="shrink-0 mx-3 text-[11px] font-medium text-[#c1c8c7] uppercase tracking-wider">
                    Or
                  </span>
                  <div className="grow border-t border-[#d9e5e5]"></div>
                </div>

                {/* Secondary Actions */}
                <div className="space-y-3">
                  <button
                    type="button"
                    className="w-full h-12 border-[1.5px] border-[#001f1f] text-[#001f1f] rounded-[29px] text-sm font-medium hover:bg-[#001f1f]/5 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>Send magic link</span>
                  </button>

                  <button
                    type="button"
                    className="w-full h-12 border-[1.5px] border-[#001f1f] text-[#001f1f] rounded-[29px] text-sm font-medium hover:bg-[#001f1f]/5 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {/* Google SVG Logo */}
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Sign in with Google</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: EVENT STAFF TAB */}
          {activeTab === 'staff' && (
            <div className="animate-fadeIn">
              <div className="mb-9">
                <h2 className="text-[22px] font-medium text-[#001f1f] mb-2 leading-tight">
                  Staff Onboarding
                </h2>
                <p className="text-sm text-[#414848]">
                  Enter your event code to join the floor crew.
                </p>
              </div>

              <form onSubmit={handleStaffSubmit} className="space-y-5">
                <div className="space-y-3">
                  {/* Full Name */}
                  <div>
                    <label className="block text-[11px] font-medium tracking-[0.08em] text-[#001f1f] mb-2 uppercase">
                      Full Name
                    </label>
                    <div className="rounded-xl bg-white flex items-center px-3 h-12 shadow-[0_0_0_0.5px_rgba(0,31,31,0.2)] focus-within:shadow-[0_0_0_1.5px_rgba(0,31,31,0.8)] transition-shadow">
                      <User className="w-5 h-5 text-[#717878] mr-3 shrink-0" />
                      <input
                        type="text"
                        required
                        value={staffName}
                        onChange={(e) => setStaffName(e.target.value)}
                        placeholder="Alex Morgan"
                        className="w-full bg-transparent border-none p-0 text-sm text-[#001f1f] placeholder-[#c1c8c7] focus:outline-none focus:ring-0"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-[11px] font-medium tracking-[0.08em] text-[#001f1f] mb-2 uppercase">
                      Phone Number
                    </label>
                    <div className="rounded-xl bg-white flex items-center px-3 h-12 shadow-[0_0_0_0.5px_rgba(0,31,31,0.2)] focus-within:shadow-[0_0_0_1.5px_rgba(0,31,31,0.8)] transition-shadow">
                      <Smartphone className="w-5 h-5 text-[#717878] mr-3 shrink-0" />
                      <input
                        type="tel"
                        required
                        value={staffPhone}
                        onChange={(e) => setStaffPhone(e.target.value)}
                        placeholder="(555) 000-0000"
                        className="w-full bg-transparent border-none p-0 text-sm text-[#001f1f] placeholder-[#c1c8c7] focus:outline-none focus:ring-0"
                      />
                    </div>
                  </div>

                  {/* 6-Digit Event Code */}
                  <div>
                    <label className="block text-[11px] font-medium tracking-[0.08em] text-[#001f1f] mb-2 uppercase">
                      6-Digit Event Code
                    </label>
                    <div className="rounded-xl bg-[#e4f7f9] flex items-center px-3 h-12 shadow-[0_0_0_0.5px_rgba(0,31,31,0.2)] focus-within:shadow-[0_0_0_1.5px_rgba(0,31,31,0.8)] transition-shadow">
                      <Ticket className="w-5 h-5 text-[#001f1f] mr-3 shrink-0" />
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={eventCode}
                        onChange={(e) => setEventCode(e.target.value.toUpperCase())}
                        placeholder="------"
                        className="w-full bg-transparent border-none p-0 text-[22px] font-medium text-[#001f1f] placeholder-[#c1c8c7] tracking-widest uppercase text-center focus:outline-none focus:ring-0"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full h-12 bg-[#001f1f] text-white rounded-[29px] text-sm font-medium hover:bg-opacity-90 active:scale-[0.98] transition-all cursor-pointer mt-9"
                >
                  Join Event Crew
                </button>

                <div className="text-center mt-5">
                  <p className="text-[11px] text-[#889494] uppercase tracking-widest font-medium">
                    Session expires 24h after event ends.
                  </p>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="w-full bg-[#f7f6f2] flex flex-col md:flex-row justify-between items-center px-9 py-9 max-w-300 mx-auto mt-auto">
        <div className="text-sm text-[#414848] mb-5 md:mb-0">
          © {new Date().getFullYear()} EventOps. All rights reserved.
        </div>
        <div className="flex gap-9">
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
      </footer>
    </div>
  );
}
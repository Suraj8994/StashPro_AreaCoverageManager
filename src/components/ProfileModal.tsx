import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { changeUserPassword, updateAdminProfile } from '../services/dataService';
import { formatAndValidateMobile, validateEmail } from '../utils/securityUtils';
import {
  X,
  KeyRound,
  Phone,
  Mail,
  User as UserIcon,
  CheckCircle,
  AlertCircle,
  Lock,
  Building,
  ShieldCheck,
} from 'lucide-react';

export const ProfileModal: React.FC = () => {
  const { currentUser, isProfileOpen, setIsProfileOpen, areas } = useApp();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Admin profile edit states
  const [adminName, setAdminName] = useState(currentUser?.name || '');
  const [adminEmail, setAdminEmail] = useState(currentUser?.email || '');
  const [adminMobile, setAdminMobile] = useState(currentUser?.mobile || '');
  const [adminProfileLoading, setAdminProfileLoading] = useState(false);
  const [adminSuccess, setAdminSuccess] = useState<string | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);

  if (!isProfileOpen || !currentUser) return null;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 4) {
      setPasswordError('New password must be at least 4 characters long.');
      return;
    }

    setPasswordLoading(true);
    const res = await changeUserPassword(currentUser.id, currentPassword, newPassword);
    setPasswordLoading(false);

    if (!res.success) {
      setPasswordError(res.message || 'Failed to change password.');
    } else {
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    }
  };

  const handleSaveAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAdminSuccess(null);

    if (!adminName.trim()) {
      setAdminError('Admin name cannot be blank.');
      return;
    }

    if (!adminEmail.trim() || !validateEmail(adminEmail.trim())) {
      setAdminError('Please enter a valid email address.');
      return;
    }

    const validation = formatAndValidateMobile(adminMobile);
    if (!validation.valid) {
      setAdminError(validation.error || 'Invalid mobile number.');
      return;
    }

    setAdminProfileLoading(true);
    const res = await updateAdminProfile(currentUser.id, {
      name: adminName.trim(),
      email: adminEmail.trim().toLowerCase(),
      mobile: validation.formatted,
    });
    setAdminProfileLoading(false);

    if (!res.success) {
      setAdminError(res.message || 'Failed to update admin profile.');
    } else {
      setAdminSuccess('Admin profile (Email & Mobile) updated successfully!');
      setTimeout(() => setAdminSuccess(null), 3500);
    }
  };

  const allocatedAreaNames = areas
    .filter((a) => currentUser.allocatedAreaIds?.includes(a.id))
    .map((a) => a.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xl relative my-auto max-h-[92vh] overflow-y-auto">
        <button
          type="button"
          onClick={() => setIsProfileOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Header */}
        <div className="flex items-center gap-3 pb-3.5 border-b border-slate-100">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 ${
              currentUser.role === 'admin'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-slate-100 text-slate-800 border border-slate-200'
            }`}
          >
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 truncate">
              <span>{currentUser.name}</span>
              <span
                className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  currentUser.role === 'admin'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-slate-100 text-slate-800 border border-slate-200'
                }`}
              >
                {currentUser.role}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">@{currentUser.username}</p>
          </div>
        </div>

        {/* Read-only Quick Summary */}
        <div className="py-3 space-y-1.5 border-b border-slate-100 text-xs text-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Current Mobile:</span>
            </span>
            <strong className="text-emerald-700 font-bold">{currentUser.mobile || 'Not set'}</strong>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Current Email:</span>
            </span>
            <strong className="text-slate-900 font-semibold truncate max-w-[200px]">
              {currentUser.email || 'Not specified'}
            </strong>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Login Method:</span>
            </span>
            <strong className="text-slate-800 capitalize">
              {currentUser.loginMethod === 'both'
                ? 'Password & Google'
                : currentUser.loginMethod === 'google'
                ? 'Google Only'
                : 'Password Only'}
            </strong>
          </div>

          {currentUser.role === 'worker' && (
            <div className="pt-2">
              <span className="text-slate-500 flex items-center gap-1.5 mb-1 font-medium">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Allocated Areas ({allocatedAreaNames.length}):</span>
              </span>
              <div className="flex flex-wrap gap-1">
                {allocatedAreaNames.length === 0 ? (
                  <span className="text-slate-400 italic">All areas or no restriction</span>
                ) : (
                  allocatedAreaNames.map((name, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold"
                    >
                      {name}
                    </span>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Modification Section (Email & Mobile) */}
        {currentUser.role === 'admin' && (
          <div className="py-3.5 border-b border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Admin Profile Rights (Edit Mobile & Email)</span>
              </h4>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-bold">
                Admin Modification Rights
              </span>
            </div>

            {adminSuccess && (
              <div className="mb-2.5 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{adminSuccess}</span>
              </div>
            )}

            {adminError && (
              <div className="mb-2.5 p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{adminError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdminProfile} className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Admin Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Anil Sakpal"
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Admin Mobile Number (+91)
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={adminMobile}
                    onChange={(e) => setAdminMobile(e.target.value)}
                    placeholder="+91 8108941215 or 8108941215"
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-semibold text-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Admin Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="anilsakpal@stashpro.com"
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={adminProfileLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>{adminProfileLoading ? 'Saving Changes...' : 'Save Admin Email & Mobile'}</span>
              </button>
            </form>
          </div>
        )}

        {/* Change Password */}
        <div className="pt-3.5">
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2.5 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
            <span>Change Password</span>
          </h4>

          {currentUser.loginMethod === 'google' ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
              Your account is authenticated via Google. Password is managed directly by Google and cannot be changed here.
            </div>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-2.5">
              {passwordSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 4 characters"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

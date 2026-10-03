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
      setAdminSuccess('Admin profile updated successfully!');
      setTimeout(() => setAdminSuccess(null), 4000);
    }
  };

  const allocatedAreaNames = areas
    .filter((a) => currentUser.allocatedAreaIds?.includes(a.id))
    .map((a) => a.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-2xl relative my-6 text-slate-800">
        <button
          type="button"
          onClick={() => setIsProfileOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        {/* User Card Header */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 pr-8">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 ${
              currentUser.role === 'admin'
                ? 'bg-emerald-100 text-[#064e3b] border border-emerald-300'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 truncate">
              <span>{currentUser.name}</span>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  currentUser.role === 'admin'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                {currentUser.role === 'admin' ? 'Admin' : 'Sales Representative'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">@{currentUser.username}</p>
          </div>
        </div>

        {/* Read-only Quick Summary */}
        <div className="py-3.5 space-y-2 border-b border-slate-100 text-sm text-slate-700 font-medium">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Mobile:</span>
            </span>
            <strong className="text-emerald-700 font-bold">{currentUser.mobile || 'Not set'}</strong>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>Email:</span>
            </span>
            <strong className="text-slate-900 font-semibold truncate max-w-[200px]">
              {currentUser.email || 'Not specified'}
            </strong>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400" />
              <span>Auth:</span>
            </span>
            <strong className="text-slate-800">Password Authentication</strong>
          </div>

          {currentUser.role === 'worker' && (
            <div className="pt-2">
              <span className="text-slate-600 flex items-center gap-2 mb-1.5 font-bold text-xs uppercase">
                <Building className="w-4 h-4 text-slate-400" />
                <span>Allocated Areas ({allocatedAreaNames.length}):</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {allocatedAreaNames.length === 0 ? (
                  <span className="text-slate-400 text-xs italic">All areas or no restriction</span>
                ) : (
                  allocatedAreaNames.map((name, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold"
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
          <div className="py-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Admin Mobile & Email Rights</span>
              </h4>
            </div>

            {adminSuccess && (
              <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs sm:text-sm flex items-center gap-2 font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{adminSuccess}</span>
              </div>
            )}

            {adminError && (
              <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs sm:text-sm flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{adminError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAdminProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Admin Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Anil Sakpal"
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-3 py-3 text-slate-900 text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Admin Mobile (+91)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={adminMobile}
                    onChange={(e) => setAdminMobile(e.target.value)}
                    placeholder="+91 8108941215 or 8108941215"
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-3 py-3 text-slate-900 text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="anilsakpal@stashpro.com"
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-10 pr-3 py-3 text-slate-900 text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={adminProfileLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs flex items-center justify-center gap-2 min-h-[44px]"
              >
                <span>{adminProfileLoading ? 'Saving Changes...' : 'Save Admin Details'}</span>
              </button>
            </form>
          </div>
        )}

        {/* Change Password */}
        <div className="pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-emerald-600" />
            <span>Change Account Password</span>
          </h4>

          <form onSubmit={handlePasswordChange} className="space-y-3">
            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs sm:text-sm flex items-center gap-2 font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs sm:text-sm flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 4 characters"
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 cursor-pointer min-h-[44px]"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={passwordLoading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer min-h-[44px]"
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
export default ProfileModal;

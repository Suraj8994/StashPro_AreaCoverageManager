import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Area, User, Visit, LoginMethod } from '../types';
import { getAreaDisplayInfo, formatDateTimeIST } from '../utils/dateUtils';
import { StashProLogo } from './StashProLogo';
import {
  addArea,
  updateArea,
  deleteArea,
  addWorkerComplete,
  updateWorkerComplete,
  toggleWorkerStatus,
  unlockWorkerAccount,
  WorkerFormData,
} from '../services/dataService';
import {
  Building,
  Plus,
  Edit2,
  Trash2,
  Users,
  Clock,
  Check,
  X,
  History,
  Sliders,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  Lock,
  Unlock,
  Search,
  ShieldCheck,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    areas,
    users,
    visits,
    currentUser,
    setIsProfileOpen,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'areas' | 'workers' | 'history'>('areas');

  // Add / Edit Area Modal
  const [isAddAreaOpen, setIsAddAreaOpen] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaInterval, setNewAreaInterval] = useState(7);

  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [editAreaName, setEditAreaName] = useState('');
  const [editAreaInterval, setEditAreaInterval] = useState(7);

  // Add / Edit Sales Representative Modal
  const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<User | null>(null);
  const [workerFullName, setWorkerFullName] = useState('');
  const [workerUsername, setWorkerUsername] = useState('');
  const [workerEmail, setWorkerEmail] = useState('');
  const [workerMobile, setWorkerMobile] = useState('');
  const [workerPin, setWorkerPin] = useState('');
  const [workerLoginMethod] = useState<LoginMethod>('password');
  const [workerAllocatedAreas, setWorkerAllocatedAreas] = useState<string[]>([]);
  const [workerActive, setWorkerActive] = useState(true);
  const [areaSearchTerm, setAreaSearchTerm] = useState('');

  // History modal for specific area
  const [historyArea, setHistoryArea] = useState<Area | null>(null);

  // Status feedback messages
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Filter active areas
  const activeAreas = areas.filter((a) => a.active);
  const salesReps = users.filter((u) => u.role === 'worker');

  const resetWorkerForm = () => {
    setWorkerFullName('');
    setWorkerUsername('');
    setWorkerEmail('');
    setWorkerMobile('');
    setWorkerPin('');
    setWorkerAllocatedAreas([]);
    setWorkerActive(true);
    setAreaSearchTerm('');
    setFormError(null);
  };

  const openEditWorker = (worker: User) => {
    setEditingWorker(worker);
    setWorkerFullName(worker.name);
    setWorkerUsername(worker.username);
    setWorkerEmail(worker.email || '');
    setWorkerMobile(worker.mobile || '');
    setWorkerPin(''); // Blank unless changing
    setWorkerAllocatedAreas(worker.allocatedAreaIds || []);
    setWorkerActive(worker.active);
    setAreaSearchTerm('');
    setFormError(null);
  };

  const toggleAreaAllocation = (areaId: string) => {
    setWorkerAllocatedAreas((prev) =>
      prev.includes(areaId) ? prev.filter((id) => id !== areaId) : [...prev, areaId]
    );
  };

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setFormError(null);

    if (!workerPin.trim()) {
      setFormError('Please enter a password for the sales representative.');
      return;
    }

    const formData: WorkerFormData = {
      name: workerFullName,
      username: workerUsername,
      email: workerEmail,
      mobile: workerMobile,
      pin: workerPin.trim(),
      loginMethod: workerLoginMethod,
      allocatedAreaIds: workerAllocatedAreas,
      active: workerActive,
    };

    const res = await addWorkerComplete(formData, currentUser);
    if (!res.success) {
      setFormError(res.message || 'Failed to add sales representative');
    } else {
      setFormSuccess('Sales representative account created successfully!');
      resetWorkerForm();
      setIsAddWorkerOpen(false);
      setTimeout(() => setFormSuccess(null), 3500);
    }
  };

  const handleUpdateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !editingWorker) return;
    setFormError(null);

    const updates: Partial<WorkerFormData> = {
      name: workerFullName,
      email: workerEmail,
      mobile: workerMobile,
      loginMethod: workerLoginMethod,
      allocatedAreaIds: workerAllocatedAreas,
      active: workerActive,
    };

    if (workerPin.trim()) {
      updates.pin = workerPin.trim();
    }

    const res = await updateWorkerComplete(editingWorker.id, updates, currentUser);
    if (!res.success) {
      setFormError(res.message || 'Failed to update sales representative');
    } else {
      setFormSuccess('Sales representative details updated successfully!');
      setEditingWorker(null);
      resetWorkerForm();
      setTimeout(() => setFormSuccess(null), 3500);
    }
  };

  const handleUnlockAccount = async (worker: User) => {
    if (!currentUser) return;
    const res = await unlockWorkerAccount(worker.id, currentUser);
    if (res.success) {
      setFormSuccess(`Unlocked account for ${worker.name}.`);
      setTimeout(() => setFormSuccess(null), 3500);
    } else {
      setFormError(res.message || 'Failed to unlock account');
    }
  };

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setFormError(null);

    const res = await addArea(newAreaName, newAreaInterval, currentUser);
    if (!res.success) {
      setFormError(res.message || 'Failed to create area');
    } else {
      setFormSuccess(`Area "${newAreaName}" created with ${newAreaInterval}-day interval!`);
      setNewAreaName('');
      setNewAreaInterval(7);
      setIsAddAreaOpen(false);
      setTimeout(() => setFormSuccess(null), 3500);
    }
  };

  const handleUpdateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !editingArea) return;
    setFormError(null);

    const res = await updateArea(
      editingArea.id,
      { name: editAreaName, visitIntervalDays: editAreaInterval },
      currentUser
    );
    if (!res.success) {
      setFormError(res.message || 'Failed to update area');
    } else {
      setFormSuccess(`Area "${editAreaName}" updated!`);
      setEditingArea(null);
      setTimeout(() => setFormSuccess(null), 3500);
    }
  };

  const handleDeleteArea = async (area: Area) => {
    if (!currentUser) return;
    if (!window.confirm(`Are you sure you want to delete "${area.name}"?`)) return;

    const res = await deleteArea(area.id, currentUser);
    if (!res.success) {
      setFormError(res.message || 'Failed to delete area');
    } else {
      setFormSuccess(`Area "${area.name}" removed successfully.`);
      setTimeout(() => setFormSuccess(null), 3500);
    }
  };

  // Filter Visits for Selected History Area
  const areaHistoryVisits = visits.filter(
    (v) => historyArea && v.areaId === historyArea.id
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 pb-28 overflow-x-hidden bg-white min-h-[calc(100vh-60px)]">
      {/* Notifications */}
      {formError && (
        <div className="mb-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-semibold">{formError}</span>
          </div>
          <button
            type="button"
            onClick={() => setFormError(null)}
            className="text-rose-500 hover:text-rose-800 cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {formSuccess && (
        <div className="mb-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{formSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setFormSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Admin Highlight Profile Banner - Anil Sakpal with Area Coverage Logo */}
      <div className="mb-5 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3.5">
        <div className="flex items-center gap-3.5 min-w-0">
          <StashProLogo size="md" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {currentUser?.name || 'Anil Sakpal'}
              </h2>
              <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#064e3b] border border-emerald-300">
                Administrator
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 flex flex-wrap items-center gap-2.5 mt-1 font-medium">
              <span className="flex items-center gap-1 font-bold text-emerald-700">
                <Phone className="w-4 h-4" />
                <span>{currentUser?.mobile || '+91 8108941215'}</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{currentUser?.email || 'anilsakpal@stashpro.com'}</span>
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="text-emerald-900 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-xs hidden sm:inline">
                Full Modification Rights
              </span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsProfileOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs flex items-center gap-2 min-h-[42px]"
        >
          <Edit2 className="w-4 h-4" />
          <span>Edit Admin Details</span>
        </button>
      </div>

      {/* Main Admin Section Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Admin Center</span>
          </h2>
          <p className="text-sm text-slate-600 mt-1 font-medium">
            Manage coverage areas, sales representatives, visit intervals, and view activity.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1.5 bg-[#f8fafc] p-1.5 rounded-2xl border border-slate-200 shadow-xs self-stretch sm:self-auto overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('areas')}
            className={`flex-1 sm:flex-none px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all min-h-[40px] ${
              activeTab === 'areas'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Areas ({activeAreas.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('workers')}
            className={`flex-1 sm:flex-none px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all min-h-[40px] ${
              activeTab === 'workers'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Sales Reps ({salesReps.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 sm:flex-none px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer transition-all min-h-[40px] ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Activity</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: AREAS MANAGEMENT ================= */}
      {activeTab === 'areas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Active Coverage Areas
            </h3>
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setIsAddAreaOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 min-h-[42px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Area</span>
            </button>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-[#f8fafc] text-xs font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Area Name</th>
                    <th className="py-3.5 px-4">Visit Interval</th>
                    <th className="py-3.5 px-4">Allocated Sales Reps</th>
                    <th className="py-3.5 px-4">Current Status</th>
                    <th className="py-3.5 px-4">Next Visit</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeAreas.map((area) => {
                    const info = getAreaDisplayInfo(area);
                    const allocatedWorkers = users.filter(
                      (u) => u.role === 'worker' && u.allocatedAreaIds?.includes(area.id)
                    );

                    return (
                      <tr key={area.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4 font-bold text-slate-900 whitespace-nowrap text-base">
                          {area.name}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span>{area.visitIntervalDays} days</span>
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {allocatedWorkers.length === 0 ? (
                              <span className="text-xs text-slate-400 font-medium">All Sales Reps</span>
                            ) : (
                              allocatedWorkers.map((w) => (
                                <span
                                  key={w.id}
                                  className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold"
                                >
                                  {w.name.split(' ')[0]}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="text-xs sm:text-sm font-bold text-slate-800">
                            {info.statusLabel}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-xs sm:text-sm text-slate-600 font-medium whitespace-nowrap">
                          {info.formattedNextVisit}
                        </td>
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setHistoryArea(area)}
                              title="View History"
                              className="p-2 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingArea(area);
                                setEditAreaName(area.name);
                                setEditAreaInterval(area.visitIntervalDays);
                                setFormError(null);
                              }}
                              title="Edit Area & Interval"
                              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteArea(area)}
                              title="Remove Area"
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Stacked Card View */}
          <div className="block md:hidden space-y-3.5">
            {activeAreas.map((area) => {
              const info = getAreaDisplayInfo(area);
              const allocatedWorkers = users.filter(
                (u) => u.role === 'worker' && u.allocatedAreaIds?.includes(area.id)
              );

              return (
                <div
                  key={area.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-lg truncate">{area.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-600 mt-1 font-medium">
                        <span>Interval: <strong className="text-slate-900">{area.visitIntervalDays}d</strong></span>
                        <span>•</span>
                        <span>Next: <strong className="text-slate-900">{info.formattedNextVisit}</strong></span>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg shrink-0">
                      {info.statusLabel}
                    </span>
                  </div>

                  {/* Allocated Sales Reps */}
                  <div className="text-xs sm:text-sm">
                    <span className="text-slate-500 text-xs uppercase font-bold block mb-1">
                      Assigned Sales Reps:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {allocatedWorkers.length === 0 ? (
                        <span className="text-slate-400 text-xs italic">All Sales Reps</span>
                      ) : (
                        allocatedWorkers.map((w) => (
                          <span
                            key={w.id}
                            className="text-xs px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 font-bold"
                          >
                            {w.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm">
                    <button
                      type="button"
                      onClick={() => setHistoryArea(area)}
                      className="text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1.5 py-1.5"
                    >
                      <History className="w-4 h-4 text-emerald-600" />
                      <span>History</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingArea(area);
                          setEditAreaName(area.name);
                          setEditAreaInterval(area.visitIntervalDays);
                          setFormError(null);
                        }}
                        className="py-1.5 px-3 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200 font-bold flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteArea(area)}
                        className="p-2 rounded-xl bg-slate-100 text-rose-600 hover:bg-rose-50 border border-slate-200"
                        title="Delete Area"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 2: SALES REPRESENTATIVES DIRECTORY ================= */}
      {activeTab === 'workers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Sales Representatives Directory
            </h3>
            <button
              type="button"
              onClick={() => {
                resetWorkerForm();
                setIsAddWorkerOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 min-h-[42px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Sales Rep</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {/* Pinned Administrator Card - Anil Sakpal */}
            <div className="bg-white border-2 border-emerald-500/80 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl shadow-2xs">
                Admin (Super Rights)
              </div>

              <div>
                <div className="flex items-start gap-3 min-w-0 pr-16">
                  <StashProLogo size="sm" />
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-base truncate">{currentUser?.name || 'Anil Sakpal'}</h4>
                    <p className="text-xs text-slate-500 truncate font-medium">@{currentUser?.username || 'admin'}</p>
                  </div>
                </div>

                {/* Contact details */}
                <div className="mt-4 space-y-1.5 text-xs sm:text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-emerald-800">{currentUser?.mobile || '+91 8108941215'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="text-slate-600 truncate font-medium">{currentUser?.email || 'anilsakpal@stashpro.com'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-slate-600 text-xs">Rights to manage areas, reps & passwords</span>
                  </div>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-slate-100">
                  <div className="text-xs text-emerald-900 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    Full modification rights active
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(true)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-200 flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[42px]"
                >
                  <Edit2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Modify Admin Email & Mobile</span>
                </button>
              </div>
            </div>

            {/* Sales Representatives Cards */}
            {salesReps.map((worker) => {
              const isLocked =
                worker.lockedUntil && new Date(worker.lockedUntil).getTime() > Date.now();
              const allocatedNames = areas
                .filter((a) => worker.allocatedAreaIds?.includes(a.id))
                .map((a) => a.name);

              return (
                <div
                  key={worker.id}
                  className={`bg-white border rounded-2xl p-4 sm:p-5 transition-all flex flex-col justify-between shadow-xs ${
                    isLocked
                      ? 'border-rose-300 bg-rose-50/30'
                      : worker.active
                      ? 'border-slate-200'
                      : 'border-slate-200 opacity-60 bg-slate-50'
                  }`}
                >
                  <div>
                    {/* Top Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-900 border border-slate-200 flex items-center justify-center font-bold text-sm shrink-0">
                          {worker.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-base truncate">{worker.name}</h4>
                          <p className="text-xs text-slate-500 truncate font-medium">@{worker.username}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isLocked && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                            <Lock className="w-3 h-3 text-rose-600" />
                            <span>Locked</span>
                          </span>
                        )}
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            worker.active
                              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                              : 'bg-rose-50 text-rose-600 border border-rose-200'
                          }`}
                        >
                          {worker.active ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className="mt-3.5 space-y-1.5 text-xs sm:text-sm text-slate-700">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-bold text-slate-900 truncate">{worker.mobile || 'No mobile'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-600 truncate font-medium">{worker.email || 'No email'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-600 font-medium">
                          Auth: <strong className="text-slate-900 font-bold">Password Login</strong>
                        </span>
                      </div>
                    </div>

                    {/* Area Allocations */}
                    <div className="mt-3.5 pt-2.5 border-t border-slate-100">
                      <div className="text-xs text-slate-600 font-bold mb-1.5">
                        Allocated Areas ({allocatedNames.length}):
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                        {allocatedNames.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">
                            Can visit all areas
                          </span>
                        ) : (
                          allocatedNames.map((name, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold"
                            >
                              {name}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditWorker(worker)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer min-h-[38px]"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Edit Details</span>
                      </button>

                      {isLocked && (
                        <button
                          type="button"
                          onClick={() => handleUnlockAccount(worker)}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Unlock</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleWorkerStatus(worker.id, !worker.active)}
                      className={`font-bold text-xs px-3 py-1.5 rounded-xl border transition-colors cursor-pointer min-h-[38px] ${
                        worker.active
                          ? 'border-rose-300 text-rose-600 hover:bg-rose-50'
                          : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {worker.active ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 3: ACTIVITY LOGS ================= */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Live Activity Audit Trail
            </h3>
            <span className="text-xs sm:text-sm text-slate-500 font-medium">
              Recent events & status changes
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            {visits.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No recent activity recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {visits.slice(0, 30).map((v) => (
                  <div key={v.id} className="p-4 sm:p-4.5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">{v.areaName}</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          v.visitType === 'Early Visit'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {v.visitType}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                        Visited by Sales Rep: <strong className="text-slate-900">{v.workerName}</strong>
                      </p>
                    </div>
                    <div className="text-xs text-slate-500 font-medium sm:text-right">
                      <div>Completed: {formatDateTimeIST(v.completionTime)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT SALES REPRESENTATIVE ================= */}
      {isAddWorkerOpen || editingWorker ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xl relative my-6">
            <button
              type="button"
              onClick={() => {
                setIsAddWorkerOpen(false);
                setEditingWorker(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 flex items-center gap-2.5">
              <Users className="w-6 h-6 text-emerald-600" />
              <span>{editingWorker ? 'Edit Sales Representative Details' : 'Add New Sales Representative'}</span>
            </h3>

            {/* Admin Modification Rights Notice */}
            <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                <strong>Admin Modification Rights:</strong> You can edit this sales representative&apos;s mobile number, email address, password, and area allocations directly.
              </span>
            </div>

            <form
              onSubmit={editingWorker ? handleUpdateWorker : handleCreateWorker}
              className="space-y-4 text-sm"
            >
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 text-xs mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={workerFullName}
                  onChange={(e) => setWorkerFullName(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 text-xs mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingWorker)}
                  placeholder="e.g. rahul"
                  value={workerUsername}
                  onChange={(e) => setWorkerUsername(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 text-xs mb-1.5 flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="text-emerald-700 font-bold text-xs">Editable by Admin</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul@field.com"
                  value={workerEmail}
                  onChange={(e) => setWorkerEmail(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 text-xs mb-1.5 flex items-center justify-between">
                  <span>Mobile Number (+91)</span>
                  <span className="text-emerald-700 font-bold text-xs">Editable by Admin</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 9876543210 or 9876543210"
                  value={workerMobile}
                  onChange={(e) => setWorkerMobile(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium text-emerald-900"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 text-xs mb-1.5">
                  {editingWorker ? 'Change Password (Optional)' : 'Account Password'}
                </label>
                <input
                  type="password"
                  placeholder={editingWorker ? 'Leave blank to keep unchanged' : 'Enter password'}
                  value={workerPin}
                  onChange={(e) => setWorkerPin(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              {/* Area Allocation Multi-Select */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold uppercase tracking-wider text-slate-700 text-xs">
                    Area Allocation ({workerAllocatedAreas.length})
                  </label>
                  <span className="text-xs text-slate-500 font-medium">
                    Select to restrict
                  </span>
                </div>

                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter areas..."
                    value={areaSearchTerm}
                    onChange={(e) => setAreaSearchTerm(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl bg-white p-2 space-y-1">
                  {activeAreas
                    .filter((a) =>
                      a.name.toLowerCase().includes(areaSearchTerm.toLowerCase().trim())
                    )
                    .map((area) => {
                      const isSelected = workerAllocatedAreas.includes(area.id);
                      return (
                        <div
                          key={area.id}
                          onClick={() => toggleAreaAllocation(area.id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                              : 'hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <span className="text-sm font-medium">{area.name}</span>
                          <div
                            className={`w-5 h-5 rounded flex items-center justify-center border ${
                              isSelected
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-slate-700 text-xs sm:text-sm">Account Status</span>
                <button
                  type="button"
                  onClick={() => setWorkerActive(!workerActive)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-colors ${
                    workerActive
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-rose-100 text-rose-700 border border-rose-200'
                  }`}
                >
                  {workerActive ? 'Active' : 'Disabled'}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddWorkerOpen(false);
                    setEditingWorker(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:text-slate-900 cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-xs cursor-pointer text-sm min-h-[44px]"
                >
                  {editingWorker ? 'Save Changes' : 'Create Sales Rep'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* ================= MODAL: ADD AREA ================= */}
      {isAddAreaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xl relative">
            <button
              type="button"
              onClick={() => setIsAddAreaOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2.5">
              <Building className="w-6 h-6 text-emerald-600" />
              <span>Add New Area</span>
            </h3>

            <form onSubmit={handleCreateArea} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Area Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Andheri East, Malad West..."
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 placeholder-slate-400 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              {/* Slider for Visit Interval: 1 to 30 days */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span className="uppercase tracking-wider">Visit Again After</span>
                  <span className="text-emerald-900 font-black text-sm bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                    {newAreaInterval} days
                  </span>
                </div>

                <input
                  type="range"
                  min="1"
                  max="30"
                  value={newAreaInterval}
                  onChange={(e) => setNewAreaInterval(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />

                <div className="flex justify-between text-xs text-slate-500 mt-1.5 font-medium">
                  <span>1 day</span>
                  <span>15 days</span>
                  <span>30 days</span>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddAreaOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:text-slate-900 cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-xs cursor-pointer min-h-[44px]"
                >
                  Save Area
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT AREA & INTERVAL ================= */}
      {editingArea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xl relative">
            <button
              type="button"
              onClick={() => setEditingArea(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-4 flex items-center gap-2.5">
              <Sliders className="w-6 h-6 text-amber-500" />
              <span>Edit Area & Visit Interval</span>
            </h3>

            <form onSubmit={handleUpdateArea} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Area Name
                </label>
                <input
                  type="text"
                  required
                  value={editAreaName}
                  onChange={(e) => setEditAreaName(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 placeholder-slate-400 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span className="uppercase tracking-wider">Next Visit Interval</span>
                  <span className="text-emerald-900 font-black text-sm bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                    {editAreaInterval} days
                  </span>
                </div>

                <input
                  type="range"
                  min="1"
                  max="30"
                  value={editAreaInterval}
                  onChange={(e) => setEditAreaInterval(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />

                <div className="flex justify-between text-xs text-slate-500 mt-1.5 font-medium">
                  <span>1 day</span>
                  <span>15 days</span>
                  <span>30 days</span>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingArea(null)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:text-slate-900 cursor-pointer min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-xs cursor-pointer min-h-[44px]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: AREA VISIT HISTORY ================= */}
      {historyArea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xl relative max-h-[85vh] flex flex-col">
            <button
              type="button"
              onClick={() => setHistoryArea(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-3.5">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                <span>Visit History: {historyArea.name}</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
                Standard Interval: {historyArea.visitIntervalDays} days
              </p>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 space-y-3">
              {areaHistoryVisits.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  No historical visits recorded for this area yet.
                </div>
              ) : (
                areaHistoryVisits.map((visit) => (
                  <div
                    key={visit.id}
                    className="p-3.5 bg-[#f8fafc] border border-slate-200 rounded-2xl text-sm space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>Sales Rep: {visit.workerName}</span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          visit.visitType === 'Early Visit'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        }`}
                      >
                        {visit.visitType}
                      </span>
                    </div>

                    <div className="text-slate-600 flex items-center justify-between text-xs pt-1">
                      <span>Started: {formatDateTimeIST(visit.startTime)}</span>
                      <span>Done: {formatDateTimeIST(visit.completionTime)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setHistoryArea(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-sm font-bold border border-slate-200 cursor-pointer min-h-[42px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminDashboard;

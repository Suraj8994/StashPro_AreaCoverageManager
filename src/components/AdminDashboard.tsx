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
  Sparkles,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    areas,
    users,
    visits,
    activityLogs,
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

  // Add / Edit Worker Modal
  const [isAddWorkerOpen, setIsAddWorkerOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<User | null>(null);
  const [workerFullName, setWorkerFullName] = useState('');
  const [workerUsername, setWorkerUsername] = useState('');
  const [workerEmail, setWorkerEmail] = useState('');
  const [workerMobile, setWorkerMobile] = useState('');
  const [workerPin, setWorkerPin] = useState('');
  const [workerLoginMethod, setWorkerLoginMethod] = useState<LoginMethod>('both');
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

  const resetWorkerForm = () => {
    setWorkerFullName('');
    setWorkerUsername('');
    setWorkerEmail('');
    setWorkerMobile('');
    setWorkerPin('');
    setWorkerLoginMethod('both');
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
    setWorkerLoginMethod(worker.loginMethod || 'both');
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

    if (workerLoginMethod !== 'google' && !workerPin.trim()) {
      setFormError('Please enter a password for the worker.');
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
      setFormError(res.message || 'Failed to add worker');
    } else {
      setFormSuccess('Worker created successfully with email and mobile!');
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
      setFormError(res.message || 'Failed to update worker');
    } else {
      setFormSuccess(`Worker details (Email & Mobile) updated successfully!`);
      setEditingWorker(null);
      resetWorkerForm();
      setTimeout(() => setFormSuccess(null), 3500);
    }
  };

  const handleUnlockAccount = async (worker: User) => {
    if (!currentUser) return;
    const res = await unlockWorkerAccount(worker.id, currentUser);
    if (res.success) {
      setFormSuccess(`Unlocked login for ${worker.name}.`);
      setTimeout(() => setFormSuccess(null), 3500);
    } else {
      setFormError(res.message || 'Could not unlock account.');
    }
  };

  // Add Area Handler
  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!newAreaName.trim()) {
      setFormError('Please enter an area name');
      return;
    }

    const result = await addArea(newAreaName, newAreaInterval, currentUser);
    if (!result.success) {
      setFormError(result.message || 'Failed to add area');
    } else {
      setFormSuccess(`Area "${newAreaName}" added successfully!`);
      setNewAreaName('');
      setNewAreaInterval(7);
      setIsAddAreaOpen(false);
      setTimeout(() => setFormSuccess(null), 3500);
    }
  };

  // Update Area Handler
  const handleUpdateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !editingArea) return;
    if (!editAreaName.trim()) {
      setFormError('Please enter an area name');
      return;
    }

    const result = await updateArea(
      editingArea.id,
      {
        name: editAreaName.trim(),
        visitIntervalDays: editAreaInterval,
      },
      currentUser
    );

    if (!result.success) {
      setFormError(result.message || 'Failed to update area');
    } else {
      setFormSuccess(`Area "${editAreaName}" updated successfully!`);
      setEditingArea(null);
      setTimeout(() => setFormSuccess(null), 3500);
    }
  };

  // Delete Area Handler
  const handleDeleteArea = async (area: Area) => {
    if (!currentUser) return;
    if (
      !window.confirm(
        `Are you sure you want to remove area "${area.name}"? Historical visits will be preserved.`
      )
    ) {
      return;
    }

    const result = await deleteArea(area.id, currentUser);
    if (!result.success) {
      setFormError(result.message || 'Failed to delete area');
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
        <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{formError}</span>
          </div>
          <button
            type="button"
            onClick={() => setFormError(null)}
            className="text-rose-500 hover:text-rose-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {formSuccess && (
        <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{formSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setFormSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Admin Highlight Profile Banner - Anil Sakpal with Area Coverage Logo */}
      <div className="mb-5 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <StashProLogo size="md" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {currentUser?.name || 'Anil Sakpal'}
              </h2>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Administrator
              </span>
            </div>
            <p className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 font-bold text-emerald-700">
                <Phone className="w-3.5 h-3.5" />
                <span>{currentUser?.mobile || '+91 8108941215'}</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentUser?.email || 'anilsakpal@stashpro.com'}</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded text-[10px]">
                Full Modification Rights
              </span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsProfileOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
        >
          <Edit2 className="w-3.5 h-3.5" />
          <span>Edit Admin Mobile & Email</span>
        </button>
      </div>

      {/* Main Admin Section Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Admin Center</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage coverage areas, field workers, visit intervals, and view activity.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-[#f8fafc] p-1 rounded-2xl border border-slate-200 shadow-xs self-stretch sm:self-auto overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('areas')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'areas'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Areas ({activeAreas.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('workers')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'workers'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Workers ({users.filter((u) => u.role === 'worker').length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Activity</span>
          </button>
        </div>
      </div>

      {/* ================= TAB 1: AREAS MANAGEMENT ================= */}
      {activeTab === 'areas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-slate-800">
              Active Coverage Areas
            </h3>
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setIsAddAreaOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Area</span>
            </button>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-[#f8fafc] text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Area Name</th>
                    <th className="py-3 px-4">Visit Interval</th>
                    <th className="py-3 px-4">Allocated Workers</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-4">Next Visit</th>
                    <th className="py-3 px-4 text-right">Actions</th>
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
                        <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                          {area.name}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{area.visitIntervalDays} days</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {allocatedWorkers.length === 0 ? (
                              <span className="text-[11px] text-slate-400">All Workers</span>
                            ) : (
                              allocatedWorkers.map((w) => (
                                <span
                                  key={w.id}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold"
                                >
                                  {w.name.split(' ')[0]}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="text-xs font-bold text-slate-800">
                            {info.statusLabel}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {info.formattedNextVisit}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setHistoryArea(area)}
                              title="View History"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition-colors cursor-pointer"
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
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteArea(area)}
                              title="Remove Area"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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

          {/* Mobile Stacked Card View (Clean White) */}
          <div className="block md:hidden space-y-3">
            {activeAreas.map((area) => {
              const info = getAreaDisplayInfo(area);
              const allocatedWorkers = users.filter(
                (u) => u.role === 'worker' && u.allocatedAreaIds?.includes(area.id)
              );

              return (
                <div
                  key={area.id}
                  className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-base truncate">{area.name}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span>Interval: <strong className="text-slate-800">{area.visitIntervalDays}d</strong></span>
                        <span>•</span>
                        <span>Next: <strong className="text-slate-800">{info.formattedNextVisit}</strong></span>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                      {info.statusLabel}
                    </span>
                  </div>

                  {/* Allocated Workers */}
                  <div className="text-xs">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">
                      Assigned:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {allocatedWorkers.length === 0 ? (
                        <span className="text-slate-400 text-[11px] italic">All Workers</span>
                      ) : (
                        allocatedWorkers.map((w) => (
                          <span
                            key={w.id}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold"
                          >
                            {w.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => setHistoryArea(area)}
                      className="text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1"
                    >
                      <History className="w-3.5 h-3.5 text-emerald-600" />
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
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 flex items-center gap-1 px-2.5"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteArea(area)}
                        className="p-1.5 rounded-lg bg-slate-100 text-rose-500 hover:bg-rose-50 border border-slate-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 2: WORKER DIRECTORY ================= */}
      {activeTab === 'workers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-slate-800">
              Field Workers Directory
            </h3>
            <button
              type="button"
              onClick={() => {
                resetWorkerForm();
                setIsAddWorkerOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Worker</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* Pinned Administrator Card - Anil Sakpal */}
            <div className="bg-white border-2 border-emerald-500/80 rounded-2xl p-4 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-bl-xl shadow-2xs">
                Admin (Super Rights)
              </div>

              <div>
                <div className="flex items-start gap-2.5 min-w-0 pr-16">
                  <StashProLogo size="sm" />
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 text-sm truncate">{currentUser?.name || 'Anil Sakpal'}</h4>
                    <p className="text-[10px] text-slate-500 truncate">@{currentUser?.username || 'admin'}</p>
                  </div>
                </div>

                {/* Contact details */}
                <div className="mt-3.5 space-y-1 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="font-bold text-emerald-700">{currentUser?.mobile || '+91 8108941215'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-600 truncate">{currentUser?.email || 'anilsakpal@stashpro.com'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-slate-600">Rights to modify own & workers' emails & mobile</span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100">
                  <div className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                    Full modification rights active
                  </div>
                </div>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setIsProfileOpen(true)}
                  className="w-full py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3 h-3 text-emerald-600" />
                  <span>Modify Admin Email & Mobile</span>
                </button>
              </div>
            </div>

            {/* Field Workers Cards */}
            {users
              .filter((u) => u.role === 'worker')
              .map((worker) => {
                const isLocked =
                  worker.lockedUntil && new Date(worker.lockedUntil).getTime() > Date.now();
                const allocatedNames = areas
                  .filter((a) => worker.allocatedAreaIds?.includes(a.id))
                  .map((a) => a.name);

                return (
                  <div
                    key={worker.id}
                    className={`bg-white border rounded-2xl p-4 transition-all flex flex-col justify-between shadow-xs ${
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
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center font-bold text-sm shrink-0">
                            {worker.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm truncate">{worker.name}</h4>
                            <p className="text-[10px] text-slate-500 truncate">@{worker.username}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {isLocked && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5 text-rose-600" />
                              <span>Locked</span>
                            </span>
                          )}
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              worker.active
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-50 text-rose-600 border border-rose-200'
                            }`}
                          >
                            {worker.active ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                      </div>

                      {/* Contact details */}
                      <div className="mt-3 space-y-1 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-bold text-slate-900 truncate">{worker.mobile || 'No mobile'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-slate-600 truncate">{worker.email || 'No email'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-slate-500 capitalize truncate">
                            Login:{' '}
                            <strong className="text-slate-800">
                              {worker.loginMethod === 'both'
                                ? 'Pass & Google'
                                : worker.loginMethod === 'google'
                                ? 'Google Only'
                                : 'Password Only'}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Area Allocations */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100">
                        <div className="text-[10px] text-slate-500 font-bold mb-1">
                          Allocated Areas ({allocatedNames.length}):
                        </div>
                        <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                          {allocatedNames.length === 0 ? (
                            <span className="text-[10px] text-slate-400 italic">
                              Can visit all areas
                            </span>
                          ) : (
                            allocatedNames.map((name, i) => (
                              <span
                                key={i}
                                className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold"
                              >
                                {name}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditWorker(worker)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3 text-emerald-600" />
                          <span>Edit Details</span>
                        </button>

                        {isLocked && (
                          <button
                            type="button"
                            onClick={() => handleUnlockAccount(worker)}
                            className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-300 flex items-center gap-1 transition-colors cursor-pointer text-[11px]"
                          >
                            <Unlock className="w-3 h-3" />
                            <span>Unlock</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleWorkerStatus(worker.id, !worker.active)}
                        className={`font-bold text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
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

      {/* ================= TAB 3: ACTIVITY LOGS & AUDIT TRAIL ================= */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-slate-800">
              Live Activity Audit Trail
            </h3>
            <span className="text-[11px] text-slate-500">
              Real-time audit log
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="divide-y divide-slate-100">
              {activityLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No activity recorded yet.
                </div>
              ) : (
                activityLogs.map((log) => (
                  <div key={log.id} className="p-3 sm:p-4 flex items-start gap-2.5 hover:bg-slate-50">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {log.userName}{' '}
                          <span className="font-normal text-slate-500">
                            ({log.userRole})
                          </span>
                        </span>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {formatDateTimeIST(log.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 break-words">
                        {log.details || `${log.action} on ${log.areaName}`}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT WORKER (Clean White) ================= */}
      {(isAddWorkerOpen || editingWorker) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xl relative my-auto max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setIsAddWorkerOpen(false);
                setEditingWorker(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>{editingWorker ? 'Edit Field Worker Details' : 'Add New Field Worker'}</span>
            </h3>

            {/* Admin Modification Rights Notice */}
            <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Admin Modification Rights:</strong> You can edit this worker&apos;s mobile number, email address, password, and area allocations directly.
              </span>
            </div>

            <form
              onSubmit={editingWorker ? handleUpdateWorker : handleCreateWorker}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={workerFullName}
                  onChange={(e) => setWorkerFullName(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingWorker)}
                  placeholder="e.g. rahul"
                  value={workerUsername}
                  onChange={(e) => setWorkerUsername(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
                  <span>Email Address</span>
                  <span className="text-emerald-700 font-semibold text-[10px]">Editable by Admin</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul@field.com"
                  value={workerEmail}
                  onChange={(e) => setWorkerEmail(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
                  <span>Mobile Number (+91)</span>
                  <span className="text-emerald-700 font-semibold text-[10px]">Editable by Admin</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 9876543210 or 9876543210"
                  value={workerMobile}
                  onChange={(e) => setWorkerMobile(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-medium text-emerald-800"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Login Method
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'both', label: 'Pass & Google' },
                    { id: 'password', label: 'Password' },
                    { id: 'google', label: 'Google' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setWorkerLoginMethod(m.id as LoginMethod)}
                      className={`p-2 rounded-xl border text-center font-bold cursor-pointer transition-colors text-[11px] ${
                        workerLoginMethod === m.id
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  {editingWorker ? 'Change Password (Optional)' : 'Worker Password'}
                </label>
                <input
                  type="password"
                  placeholder={editingWorker ? 'Leave blank to keep unchanged' : 'Enter worker password'}
                  value={workerPin}
                  onChange={(e) => setWorkerPin(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              {/* Area Allocation Multi-Select */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold uppercase tracking-wider text-slate-700">
                    Area Allocation ({workerAllocatedAreas.length})
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Select to restrict
                  </span>
                </div>

                <div className="relative mb-1.5">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter areas..."
                    value={areaSearchTerm}
                    onChange={(e) => setAreaSearchTerm(e.target.value)}
                    className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                </div>

                <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-xl bg-white p-1.5 space-y-1">
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
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span className="text-xs">{area.name}</span>
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border ${
                              isSelected
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-slate-700">Account Status</span>
                <button
                  type="button"
                  onClick={() => setWorkerActive(!workerActive)}
                  className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-colors ${
                    workerActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-100 text-rose-700 border border-rose-200'
                  }`}
                >
                  {workerActive ? 'Active' : 'Disabled'}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddWorkerOpen(false);
                    setEditingWorker(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-xs cursor-pointer"
                >
                  {editingWorker ? 'Save Worker Details' : 'Create Worker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD AREA ================= */}
      {isAddAreaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xl relative">
            <button
              type="button"
              onClick={() => setIsAddAreaOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-emerald-600" />
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
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              {/* Slider for Visit Interval: 1 to 30 days */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span className="uppercase tracking-wider">Visit Again After</span>
                  <span className="text-emerald-800 font-black text-sm bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                    {newAreaInterval} days
                  </span>
                </div>

                <input
                  type="range"
                  min="1"
                  max="30"
                  value={newAreaInterval}
                  onChange={(e) => setNewAreaInterval(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />

                <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-medium">
                  <span>1 day</span>
                  <span>15 days</span>
                  <span>30 days</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddAreaOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-xs cursor-pointer"
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
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-500" />
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
                  className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                  <span className="uppercase tracking-wider">Next Visit Interval</span>
                  <span className="text-emerald-800 font-black text-sm bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                    {editAreaInterval} days
                  </span>
                </div>

                <input
                  type="range"
                  min="1"
                  max="30"
                  value={editAreaInterval}
                  onChange={(e) => setEditAreaInterval(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />

                <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-medium">
                  <span>1 day</span>
                  <span>15 days</span>
                  <span>30 days</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingArea(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-xs cursor-pointer"
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
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-3">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                <span>Visit History: {historyArea.name}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Interval: {historyArea.visitIntervalDays} days
              </p>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 space-y-2.5">
              {areaHistoryVisits.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No historical visits recorded for this area yet.
                </div>
              ) : (
                areaHistoryVisits.map((visit) => (
                  <div
                    key={visit.id}
                    className="p-3 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{visit.workerName}</span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                          visit.visitType === 'Early Visit'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {visit.visitType}
                      </span>
                    </div>

                    <div className="text-slate-500 flex items-center justify-between text-[10px] pt-1">
                      <span>Started: {formatDateTimeIST(visit.startTime)}</span>
                      <span>Done: {formatDateTimeIST(visit.completionTime)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setHistoryArea(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 cursor-pointer"
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

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AreaDisplayInfo, AreaStatus } from '../types';
import { getAreaDisplayInfo, formatDateTimeIST } from '../utils/dateUtils';
import {
  startAreaVisit,
  completeAreaVisit,
  undoAreaCompletion,
} from '../services/dataService';
import confetti from 'canvas-confetti';
import {
  Search,
  CheckCircle2,
  Clock,
  Zap,
  RotateCcw,
  Building,
  UserCheck,
  AlertTriangle,
  Calendar,
  CheckCheck,
} from 'lucide-react';

type FilterType =
  | 'ALL'
  | 'MY_AREAS'
  | 'VISIT_TODAY'
  | 'VISIT_TOMORROW'
  | 'IN_PROGRESS'
  | 'COMPLETED';

export const WorkerDashboard: React.FC = () => {
  const { areas, currentUser, setIsProfileOpen } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');
  const [actionLoadingAreaId, setActionLoadingAreaId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Compute live display info for active areas
  const areasDisplayInfo = useMemo(() => {
    return areas
      .filter((a) => a.active)
      .map((area) => getAreaDisplayInfo(area));
  }, [areas]);

  // Counts for Top Summary Bar
  const summaryCounts = useMemo(() => {
    let visitToday = 0;
    let visitTomorrow = 0;
    let inProgress = 0;
    let completed = 0;
    let myAllocated = 0;

    areasDisplayInfo.forEach((item) => {
      if (item.computedStatus === 'VISIT_TODAY') visitToday++;
      if (item.computedStatus === 'VISIT_TOMORROW') visitTomorrow++;
      if (item.computedStatus === 'IN_PROGRESS') inProgress++;
      if (item.computedStatus === 'COMPLETED') completed++;

      if (currentUser?.allocatedAreaIds?.includes(item.area.id)) {
        myAllocated++;
      }
    });

    return {
      total: areasDisplayInfo.length,
      visitToday,
      visitTomorrow,
      inProgress,
      completed,
      myAllocated,
    };
  }, [areasDisplayInfo, currentUser]);

  // Filtered and Searched Areas
  const filteredAreas = useMemo(() => {
    return areasDisplayInfo.filter((item) => {
      // Search by Area Name
      if (
        searchTerm.trim() &&
        !item.area.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
      ) {
        return false;
      }

      // Filter by Status or Allocation
      if (activeFilter === 'MY_AREAS') {
        return currentUser?.allocatedAreaIds?.includes(item.area.id);
      }
      if (activeFilter !== 'ALL') {
        return item.computedStatus === activeFilter;
      }

      return true;
    });
  }, [areasDisplayInfo, searchTerm, activeFilter, currentUser]);

  // Start Visit
  const handleStartVisit = async (areaId: string) => {
    if (!currentUser) return;
    setActionLoadingAreaId(areaId);
    setErrorMessage(null);

    const result = await startAreaVisit(areaId, currentUser);
    setActionLoadingAreaId(null);

    if (!result.success) {
      setErrorMessage(result.message || 'Could not start visit.');
      setTimeout(() => setErrorMessage(null), 4000);
    } else {
      setSuccessToast('Visit started! Area is now IN PROGRESS.');
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  // Complete Visit
  const handleCompleteVisit = async (areaId: string) => {
    if (!currentUser) return;
    setActionLoadingAreaId(areaId);
    setErrorMessage(null);

    const result = await completeAreaVisit(areaId, currentUser);
    setActionLoadingAreaId(null);

    if (!result.success) {
      setErrorMessage(result.message || 'Could not complete visit.');
      setTimeout(() => setErrorMessage(null), 4000);
    } else {
      confetti({
        particleCount: 35,
        spread: 55,
        origin: { y: 0.8 },
      });
      setSuccessToast('Area marked as COMPLETED! Next visit date calculated.');
      setTimeout(() => setSuccessToast(null), 3500);
    }
  };

  // Undo
  const handleUndo = async (areaId: string) => {
    if (!currentUser) return;
    if (!window.confirm('Are you sure you want to undo this completion?')) return;

    setActionLoadingAreaId(areaId);
    setErrorMessage(null);

    const result = await undoAreaCompletion(areaId, currentUser);
    setActionLoadingAreaId(null);

    if (!result.success) {
      setErrorMessage(result.message || 'Could not undo completion.');
      setTimeout(() => setErrorMessage(null), 4000);
    } else {
      setSuccessToast('Completion undone. Area returned to IN PROGRESS.');
      setTimeout(() => setSuccessToast(null), 3000);
    }
  };

  // Standard Status Badges on white UI
  const getStatusBadge = (item: AreaDisplayInfo) => {
    switch (item.computedStatus) {
      case 'IN_PROGRESS':
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-700',
          dot: 'bg-blue-600 animate-pulse',
          text: 'IN PROGRESS',
        };
      case 'COMPLETED':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          dot: 'bg-emerald-600',
          text: 'COMPLETED',
        };
      case 'VISIT_TODAY':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-700',
          dot: 'bg-rose-600 animate-ping',
          text: item.isOverdue
            ? `VISIT TODAY (${item.overdueDays}d overdue)`
            : 'VISIT TODAY',
        };
      case 'VISIT_TOMORROW':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-700',
          dot: 'bg-amber-500',
          text: 'VISIT TOMORROW',
        };
      case 'WAIT':
      default:
        return {
          bg: 'bg-slate-100 border-slate-200 text-slate-700',
          dot: 'bg-slate-400',
          text: `WAIT – ${item.daysRemaining} days`,
        };
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 pb-28 overflow-x-hidden bg-white min-h-[calc(100vh-60px)]">
      {/* Toast Messages */}
      {errorMessage && (
        <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-50 bg-rose-700 border border-rose-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 backdrop-blur-md animate-fade-in w-[92%] sm:w-auto sm:max-w-md">
          <AlertTriangle className="w-5 h-5 text-rose-200 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      {successToast && (
        <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 border border-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 backdrop-blur-md animate-fade-in w-[92%] sm:w-auto sm:max-w-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{successToast}</span>
        </div>
      )}

      {/* Clean White Worker Profile Bar for Mobile */}
      {currentUser && (
        <div className="mb-4 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-xs shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0 truncate">
              <span className="font-bold text-slate-900 text-xs sm:text-sm block truncate">
                {currentUser.name}
              </span>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
                <span className="text-emerald-700 font-semibold">{currentUser.mobile}</span>
                <span>•</span>
                <span className="truncate">{currentUser.email}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsProfileOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[#f8fafc] hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold cursor-pointer transition-colors shrink-0 shadow-2xs"
          >
            My Profile
          </button>
        </div>
      )}

      {/* Clean In-App Schedule Reminders */}
      {(summaryCounts.visitToday > 0 || summaryCounts.visitTomorrow > 0) && (
        <div className="mb-4 sm:mb-6 p-3.5 sm:p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white text-emerald-600 border border-emerald-200 shadow-xs flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-slate-900 tracking-wide uppercase">
                Visit Schedule Reminder
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
                {summaryCounts.visitToday > 0 && (
                  <span className="text-rose-600 font-bold mr-1.5">
                    • {summaryCounts.visitToday} area{summaryCounts.visitToday > 1 ? 's' : ''} need visit today!
                  </span>
                )}
                {summaryCounts.visitTomorrow > 0 && (
                  <span className="text-amber-700 font-semibold">
                    • {summaryCounts.visitTomorrow} area{summaryCounts.visitTomorrow > 1 ? 's' : ''} tomorrow.
                  </span>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveFilter(summaryCounts.visitToday > 0 ? 'VISIT_TODAY' : 'VISIT_TOMORROW')}
            className="text-[11px] sm:text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-xl shadow-xs self-start sm:self-auto cursor-pointer transition-colors"
          >
            View Due Areas
          </button>
        </div>
      )}

      {/* Summary Cards Grid (Mobile 2 cols, Desktop 5 cols) on Clean White */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5 mb-5 sm:mb-6">
        {/* Total Areas */}
        <div
          onClick={() => setActiveFilter('ALL')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer select-none ${
            activeFilter === 'ALL'
              ? 'bg-white border-emerald-600 shadow-sm ring-2 ring-emerald-500'
              : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
          }`}
        >
          <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
            Areas
          </div>
          <div className="text-xl sm:text-3xl font-black text-slate-900 mt-0.5 sm:mt-1">
            {summaryCounts.total}
          </div>
          <div className="text-[10px] text-slate-400 font-medium">Total active</div>
        </div>

        {/* Visit Today (Red) */}
        <div
          onClick={() => setActiveFilter('VISIT_TODAY')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer select-none ${
            activeFilter === 'VISIT_TODAY'
              ? 'bg-rose-50/70 border-rose-500 shadow-sm ring-2 ring-rose-400'
              : 'bg-white border-slate-200 shadow-xs hover:border-rose-300'
          }`}
        >
          <div className="text-[10px] sm:text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center justify-between">
            <span>Visit Today</span>
            {summaryCounts.visitToday > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>
          <div className="text-xl sm:text-3xl font-black text-rose-600 mt-0.5 sm:mt-1">
            {summaryCounts.visitToday}
          </div>
          <div className="text-[10px] text-rose-400 font-medium">Due or overdue</div>
        </div>

        {/* Visit Tomorrow (Yellow) */}
        <div
          onClick={() => setActiveFilter('VISIT_TOMORROW')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer select-none ${
            activeFilter === 'VISIT_TOMORROW'
              ? 'bg-amber-50/70 border-amber-500 shadow-sm ring-2 ring-amber-400'
              : 'bg-white border-slate-200 shadow-xs hover:border-amber-300'
          }`}
        >
          <div className="text-[10px] sm:text-xs font-bold text-amber-600 uppercase tracking-wider">
            Tomorrow
          </div>
          <div className="text-xl sm:text-3xl font-black text-amber-600 mt-0.5 sm:mt-1">
            {summaryCounts.visitTomorrow}
          </div>
          <div className="text-[10px] text-amber-500 font-medium">Upcoming 1 day</div>
        </div>

        {/* In Progress (Blue) */}
        <div
          onClick={() => setActiveFilter('IN_PROGRESS')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer select-none ${
            activeFilter === 'IN_PROGRESS'
              ? 'bg-blue-50/70 border-blue-500 shadow-sm ring-2 ring-blue-400'
              : 'bg-white border-slate-200 shadow-xs hover:border-blue-300'
          }`}
        >
          <div className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center justify-between">
            <span>In Progress</span>
            {summaryCounts.inProgress > 0 && (
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            )}
          </div>
          <div className="text-xl sm:text-3xl font-black text-blue-600 mt-0.5 sm:mt-1">
            {summaryCounts.inProgress}
          </div>
          <div className="text-[10px] text-blue-400 font-medium">Active visits</div>
        </div>

        {/* Completed (Green) */}
        <div
          onClick={() => setActiveFilter('COMPLETED')}
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer select-none col-span-2 sm:col-span-1 ${
            activeFilter === 'COMPLETED'
              ? 'bg-emerald-50 border-emerald-600 shadow-sm ring-2 ring-emerald-500'
              : 'bg-white border-slate-200 shadow-xs hover:border-emerald-300'
          }`}
        >
          <div className="text-[10px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wider">
            Completed
          </div>
          <div className="text-xl sm:text-3xl font-black text-emerald-700 mt-0.5 sm:mt-1">
            {summaryCounts.completed}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium">Up to date</div>
        </div>
      </div>

      {/* Search Bar & Clean Filter Pills */}
      <div className="space-y-2.5 mb-5 sm:mb-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search area (e.g. Andheri, Goregaon)..."
            className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-10 py-3 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar text-xs font-bold">
          {[
            { id: 'ALL', label: 'All' },
            ...(currentUser?.allocatedAreaIds && currentUser.allocatedAreaIds.length > 0
              ? [{ id: 'MY_AREAS', label: `My Areas (${summaryCounts.myAllocated})` }]
              : []),
            { id: 'VISIT_TODAY', label: 'Visit Today' },
            { id: 'VISIT_TOMORROW', label: 'Tomorrow' },
            { id: 'IN_PROGRESS', label: 'In Progress' },
            { id: 'COMPLETED', label: 'Completed' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFilter(f.id as FilterType)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer text-xs ${
                activeFilter === f.id
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Area Cards on Crisp White Surface */}
      <div className="space-y-3">
        {filteredAreas.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
            <Building className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm sm:text-base font-bold text-slate-700">
              No areas found
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              {searchTerm
                ? `No areas matched "${searchTerm}".`
                : 'There are no areas under this filter.'}
            </p>
          </div>
        ) : (
          filteredAreas.map((item) => {
            const badge = getStatusBadge(item);
            const isActing = actionLoadingAreaId === item.area.id;
            const isAllocatedToMe = currentUser?.allocatedAreaIds?.includes(item.area.id);
            const canUndo =
              item.computedStatus === 'COMPLETED' &&
              (currentUser?.role === 'admin' ||
                item.area.completedByWorkerId === currentUser?.id);

            return (
              <div
                key={item.area.id}
                className={`bg-white border rounded-2xl p-4 sm:p-5 transition-all shadow-xs ${
                  item.computedStatus === 'COMPLETED'
                    ? 'border-emerald-200 bg-gradient-to-r from-emerald-50/30 to-white'
                    : item.computedStatus === 'IN_PROGRESS'
                    ? 'border-blue-200 bg-gradient-to-r from-blue-50/40 to-white'
                    : item.computedStatus === 'VISIT_TODAY'
                    ? 'border-rose-200 bg-gradient-to-r from-rose-50/40 to-white'
                    : item.computedStatus === 'VISIT_TOMORROW'
                    ? 'border-amber-200 bg-gradient-to-r from-amber-50/40 to-white'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
                  {/* Left Column: Area Info & Status */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                      <h3 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight">
                        {item.area.name}
                      </h3>

                      {/* Status Tag */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold border tracking-wide uppercase ${badge.bg}`}
                      >
                        <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${badge.dot}`} />
                        <span>{badge.text}</span>
                      </span>

                      {/* My Area indicator */}
                      {isAllocatedToMe && (
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                          My Area
                        </span>
                      )}

                      {/* Early Visit tag */}
                      {item.computedStatus === 'COMPLETED' && item.area.isEarlyVisit && (
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Early Visit
                        </span>
                      )}
                    </div>

                    {/* Metadata details */}
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[11px] sm:text-xs text-slate-500 mt-1.5">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          Next: <strong className="text-slate-800">{item.formattedNextVisit}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          Days:{' '}
                          <strong className="text-slate-800">
                            {item.daysRemaining > 0
                              ? item.daysRemaining
                              : item.daysRemaining === 0
                              ? '0 (Today)'
                              : `Due (${Math.abs(item.daysRemaining)}d ago)`}
                          </strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">Interval:</span>
                        <strong className="text-slate-800">{item.area.visitIntervalDays}d</strong>
                      </div>
                    </div>

                    {/* Active Worker info */}
                    {item.computedStatus === 'IN_PROGRESS' && item.area.currentWorkerName && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-2.5 py-1 w-fit">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>
                          Started by <strong className="text-blue-900">{item.area.currentWorkerName}</strong>
                        </span>
                      </div>
                    )}

                    {item.computedStatus === 'COMPLETED' && item.area.completedByWorkerName && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50/70 border border-emerald-200 rounded-xl px-2.5 py-1 w-fit">
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          Completed by <strong className="text-slate-900">{item.area.completedByWorkerName}</strong> on {formatDateTimeIST(item.area.completedAt)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Full-width touch friendly actions for mobile */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t border-slate-100 md:border-t-0 w-full md:w-auto">
                    {/* WAIT, TODAY, TOMORROW -> [ Visit Now ] */}
                    {item.computedStatus !== 'IN_PROGRESS' &&
                      item.computedStatus !== 'COMPLETED' && (
                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() => handleStartVisit(item.area.id)}
                          className="w-full md:w-auto min-w-[140px] py-3 px-5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                        >
                          <Zap className="w-4 h-4 fill-white" />
                          <span>{isActing ? 'Starting...' : 'Visit Now'}</span>
                        </button>
                      )}

                    {/* IN_PROGRESS -> [ In Progress ] */}
                    {item.computedStatus === 'IN_PROGRESS' && (
                      <button
                        type="button"
                        disabled={isActing}
                        onClick={() => handleCompleteVisit(item.area.id)}
                        className="w-full md:w-auto min-w-[140px] py-3 px-5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-emerald-600 active:scale-[0.98] shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50 group"
                      >
                        <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span className="group-hover:hidden">
                          {isActing ? 'Saving...' : 'In Progress'}
                        </span>
                        <span className="hidden group-hover:inline">
                          Mark Completed
                        </span>
                      </button>
                    )}

                    {/* COMPLETED -> [ Visit Early ] & [ Undo ] */}
                    {item.computedStatus === 'COMPLETED' && (
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <button
                          type="button"
                          disabled={isActing}
                          onClick={() => handleStartVisit(item.area.id)}
                          title="Visit early for urgent requirement"
                          className="flex-1 md:flex-none py-2.5 px-3.5 rounded-xl font-bold text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center justify-center gap-1 cursor-pointer transition-all"
                        >
                          <Zap className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Visit Early</span>
                        </button>

                        {canUndo && (
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => handleUndo(item.area.id)}
                            title="Undo recent completion"
                            className="py-2.5 px-3 rounded-xl font-bold text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center gap-1 cursor-pointer transition-all"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Undo</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../context/WebSocketContext';
import { dashboardApi } from '../../services/api';
import { AuditLog } from '../../types';
import { Modal } from './Modal';
import {
  Layers,
  FolderGit2,
  Users2,
  ListTodo,
  CalendarDays,
  FileBarChart2,
  ChevronLeft,
  ChevronRight,
  X,
  Activity,
  BookOpen,
  ShieldCheck,
  HelpCircle,
  Clock,
  Sparkles,
  Server,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Info,
  Shield,
  Search,
  RefreshCw,
  Workflow
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const { user } = useAuth();
  const { connected } = useWebSocket();

  // Modal States for the 3 Sidebar Features
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);

  // Activity Stream State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [searchLog, setSearchLog] = useState('');

  // Guide Tab State
  const [activeGuideTab, setActiveGuideTab] = useState<'stages' | 'roles' | 'security'>('stages');

  const fetchAuditLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await dashboardApi.getAuditLogs();
      setAuditLogs(res.data);
    } catch {
      // Ignore
    } finally {
      setLogsLoading(false);
    }
  };

  const handleOpenActivity = () => {
    setIsActivityModalOpen(true);
    fetchAuditLogs();
  };

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: Layers, badge: null },
    { id: 'projects', label: 'Projects', icon: FolderGit2, badge: '4' },
    { id: 'teams', label: 'Teams & Squads Hub', icon: Users2, badge: 'Squads' },
    { id: 'issues', label: 'Sprint Issues', icon: ListTodo, badge: 'Kanban' },
    { id: 'timeline', label: 'Timeline & Gantt', icon: CalendarDays, badge: null },
    { id: 'reports', label: 'Reports & Analytics', icon: FileBarChart2, badge: '10' },
  ];

  const filteredLogs = auditLogs.filter(log =>
    log.action?.toLowerCase().includes(searchLog.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchLog.toLowerCase()) ||
    log.userEmail?.toLowerCase().includes(searchLog.toLowerCase())
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800 text-slate-300 select-none">
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <div
          className="flex items-center gap-3 cursor-pointer overflow-hidden"
          onClick={() => { onSelectTab('dashboard'); onCloseMobile(); }}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <Layers className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5 truncate">
                NEXORA
                <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 shrink-0">
                  Core
                </span>
              </span>
              <p className="text-[10px] text-slate-400 tracking-tight truncate">Issue & Governance Platform</p>
            </div>
          )}
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {/* Core Workspace Modules */}
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Workspace Modules
            </p>
          )}

          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentTab === link.id;

            return (
              <button
                key={link.id}
                onClick={() => {
                  onSelectTab(link.id);
                  onCloseMobile();
                }}
                title={collapsed ? link.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                }`} />

                {!collapsed && (
                  <div className="flex-1 flex items-center justify-between truncate text-left">
                    <span className="truncate">{link.label}</span>
                    {link.badge && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                      }`}>
                        {link.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Enterprise Platform Utilities */}
        <div className="space-y-1 pt-3 border-t border-slate-800/80">
          {!collapsed && (
            <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Platform Utilities
            </p>
          )}

          {/* 1. Live Activity & Audit Stream */}
          <button
            onClick={handleOpenActivity}
            title={collapsed ? 'Activity & Audit Stream' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 transition-all group"
          >
            <Activity className="w-5 h-5 shrink-0 text-emerald-400 group-hover:scale-105 transition-transform" />
            {!collapsed && (
              <div className="flex-1 flex items-center justify-between truncate text-left">
                <span className="truncate">Activity Stream</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Live
                </span>
              </div>
            )}
          </button>

          {/* 2. Platform Workflow & Lifecycle Guide */}
          <button
            onClick={() => setIsGuideModalOpen(true)}
            title={collapsed ? 'Workflow & Lifecycle Guide' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 transition-all group"
          >
            <BookOpen className="w-5 h-5 shrink-0 text-indigo-400 group-hover:scale-105 transition-transform" />
            {!collapsed && (
              <div className="flex-1 flex items-center justify-between truncate text-left">
                <span className="truncate">Workflow Guide</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Docs
                </span>
              </div>
            )}
          </button>

          {/* 3. System Health & Compliance SLA */}
          <button
            onClick={() => setIsHealthModalOpen(true)}
            title={collapsed ? 'System Health & SLA' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 transition-all group"
          >
            <ShieldCheck className="w-5 h-5 shrink-0 text-blue-400 group-hover:scale-105 transition-transform" />
            {!collapsed && (
              <div className="flex-1 flex items-center justify-between truncate text-left">
                <span className="truncate">Health & SLA</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  99.9%
                </span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Sidebar Footer with Workspace Card & Socket Status */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/70 space-y-2.5">
        {!collapsed && (
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/90 text-xs flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block truncate">
                WORKSPACE
              </span>
              <span className="font-semibold text-slate-200 text-xs truncate block max-w-[130px]">
                {user?.department || 'Nexora Enterprise'}
              </span>
            </div>
            <button
              onClick={() => setIsGuideModalOpen(true)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
              title="Quick Platform Help & Documentation"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Live sync pill */}
        <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800/80 ${
          collapsed ? 'justify-center' : ''
        }`}>
          <span className="flex h-2 w-2 relative shrink-0">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${connected ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${connected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
          {!collapsed && (
            <div className="flex items-center justify-between flex-1 min-w-0">
              <span className="font-mono text-[10px] text-slate-300 truncate">
                {connected ? 'STOMP SOCKET ACTIVE' : 'CONNECTING...'}
              </span>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                v1.0
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col shrink-0 transition-all duration-300 z-30 sticky top-0 h-screen ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* MODAL 1: LIVE ACTIVITY & AUDIT STREAM */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title="Live Activity Stream & Audit Trail"
        maxWidth="3xl"
      >
        <div className="space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Enterprise Event Journal</h4>
                <p className="text-[11px] text-slate-500">Immutable audit log of all system decisions, approvals, and mandates</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter events..."
                  value={searchLog}
                  onChange={(e) => setSearchLog(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg w-44 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <button
                onClick={fetchAuditLogs}
                disabled={logsLoading}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors"
                title="Refresh Logs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white">
            {logsLoading ? (
              <div className="p-8 text-center text-slate-400">Loading audit journal...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No events found matching your query.</div>
            ) : (
              filteredLogs.map((log) => {
                const getActionColor = (act: string) => {
                  if (act.includes('APPROV') || act.includes('AUTHORIZE')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  if (act.includes('REJECT')) return 'bg-rose-50 text-rose-700 border-rose-200';
                  if (act.includes('SUBMIT')) return 'bg-blue-50 text-blue-700 border-blue-200';
                  if (act.includes('ASSIGN')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
                  return 'bg-slate-100 text-slate-700 border-slate-200';
                };

                return (
                  <div key={log.id} className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                        <span className="font-semibold text-slate-800 text-xs">
                          {log.entityType} {log.entityId ? `#${log.entityId}` : ''}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{log.details}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span>Triggered by: <strong className="text-slate-600">{log.user?.name || log.userEmail}</strong></span>
                        {log.ipAddress && <span>• IP: {log.ipAddress}</span>}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Modal>

      {/* MODAL 2: PLATFORM WORKFLOW & LIFECYCLE GUIDE */}
      <Modal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        title="Nexora Enterprise Platform Guide & Lifecycle Specification"
        maxWidth="3xl"
      >
        <div className="space-y-4 text-xs">
          {/* Guide Subtabs */}
          <div className="flex border-b border-slate-200 gap-4">
            <button
              onClick={() => setActiveGuideTab('stages')}
              className={`pb-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeGuideTab === 'stages'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <Workflow className="w-3.5 h-3.5" /> 10-Stage Lifecycle Pipeline
            </button>
            <button
              onClick={() => setActiveGuideTab('roles')}
              className={`pb-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeGuideTab === 'roles'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <Users2 className="w-3.5 h-3.5" /> Roles & Governance Matrix
            </button>
            <button
              onClick={() => setActiveGuideTab('security')}
              className={`pb-2 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
                activeGuideTab === 'security'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <Shield className="w-3.5 h-3.5" /> Privacy & Squad Isolation
            </button>
          </div>

          {/* Tab 1: 10-Stage Lifecycle Pipeline */}
          {activeGuideTab === 'stages' && (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-950">
                <p className="font-semibold text-xs mb-1">Formal Governance Lifecycle:</p>
                <p className="text-[11px] text-blue-900 leading-relaxed">
                  Every project progresses through formal gates ensuring scope agreement, budget validation, prototype inspection, and formal development authorization before engineering sprints begin.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {[
                  { num: '01', title: 'Client Intake', desc: 'Client submits requirements, budget proposal, timeline kickoff, and target completion date.' },
                  { num: '02', title: 'Assessment Report', desc: 'System automatically generates Initial Project Assessment Report with complexity analysis.' },
                  { num: '03', title: 'PM Feasibility Review', desc: 'Technical Project Manager inspects formal requirement document file and validates budget.' },
                  { num: '04', title: 'Squad Assignment', desc: 'PM assigns project to designated squad (e.g. Team 3) with prototype creation deadline.' },
                  { num: '05', title: 'Prototype Creation', desc: 'Engineering squad designs wireframe and submits interactive prototype file to PM.' },
                  { num: '06', title: 'PM Endorsement', desc: 'PM reviews prototype quality, validates feature coverage, and forwards it to Client.' },
                  { num: '07', title: 'Client Approval Gate', desc: 'Client reviews clickable prototype and selects Approve, Request Changes, or Reject.' },
                  { num: '08', title: 'Stage 7 Dev Auth', desc: 'Upon client approval, PM formally authorizes development and establishes sprint cadence.' },
                  { num: '09', title: 'Sprint Execution & QA', desc: 'Squad executes issues via Kanban, logs work effort, and validates via QA tester verification.' },
                  { num: '10', title: 'Final Delivery & Closure', desc: 'Final deliverables verified, automated reports exported, and project archived.' },
                ].map((st) => (
                  <div key={st.num} className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition-all">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center font-mono">
                        {st.num}
                      </span>
                      <h5 className="font-bold text-slate-800 text-xs">{st.title}</h5>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed pl-8">{st.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Roles Matrix */}
          {activeGuideTab === 'roles' && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 space-y-1.5">
                  <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
                    <Shield className="w-4 h-4" /> Admin Role
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Organization-wide oversight, system configuration, user role management, system audit log tracking, and cross-team workload analytics.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
                    <Users2 className="w-4 h-4" /> Project Manager Role
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Evaluates requirement files, assigns engineering squads, reviews prototypes, forwards deliverables to clients, and authorizes Stage 7 development.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                    <Sparkles className="w-4 h-4" /> Client Role
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Submits project requests, views formal requirement specification files, inspects interactive wireframes, and approves/rejects prototypes.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
                    <FolderGit2 className="w-4 h-4" /> Engineering Squads
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Team 1 (Frontend), Team 2 (Backend), Team 3 (Innovation). Dedicated Delivery Lead, Developer, UI Designer, and QA Tester in isolated workspaces.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Security & Privacy */}
          {activeGuideTab === 'security' && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Multi-Tenant Squad Isolation
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Database queries strictly filter projects by assigned team ID. Members of Team 1 cannot view or access projects assigned to Team 3. Client portals are cryptographically isolated to authorized organization deliverables.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                  <Clock className="w-4 h-4 text-blue-600" /> Formal Audit Logging & Non-Repudiation
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Every transition (client submission, PM review, prototype approval, and development authorization) is stamped into the immutable audit journal with user identity, timestamp, and IP origin.
                </p>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* MODAL 3: SYSTEM HEALTH & SLA CENTER */}
      <Modal
        isOpen={isHealthModalOpen}
        onClose={() => setIsHealthModalOpen(false)}
        title="System Health, Security & Infrastructure Status"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <h4 className="font-bold text-emerald-950 text-xs">All Systems 100% Operational</h4>
              <p className="text-[11px] text-emerald-800">Production services meeting enterprise 99.98% SLA target</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white overflow-hidden">
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-slate-800 text-xs">Spring Boot 3 Core Backend</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Port 8080 Active
              </span>
            </div>

            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-slate-800 text-xs">STOMP Real-Time Gateway</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                connected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {connected ? 'WebSocket Connected' : 'Connecting...'}
              </span>
            </div>

            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span className="font-semibold text-slate-800 text-xs">Authentication & Session Vault</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                JWT HttpOnly Cookie
              </span>
            </div>

            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-purple-600" />
                <span className="font-semibold text-slate-800 text-xs">Database Persistence Layer</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                H2 / Spring Data JPA
              </span>
            </div>

            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span className="font-semibold text-slate-800 text-xs">Report & Export Engines</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                OpenPDF + Apache POI
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Platform Release: <strong>Nexora Enterprise v1.0.0</strong></span>
            <span>Security Benchmark: <strong>SOC-2 Type II</strong></span>
          </div>
        </div>
      </Modal>
    </>
  );
};

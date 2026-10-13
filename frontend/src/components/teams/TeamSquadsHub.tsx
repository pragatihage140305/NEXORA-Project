import React, { useState, useEffect } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../../context/AuthContext';
import { teamApi, issueApi, projectApi, prototypeApi } from '../../services/api';
import { Team, TaskIssue, Project, PrototypeVersion, IssueStatus, Priority } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { RequirementDocumentModal } from '../common/RequirementDocumentModal';
import {
  Users2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Code2,
  Palette,
  CheckSquare,
  ShieldAlert,
  FolderGit2,
  PlayCircle,
  FileText,
  Send,
  Plus,
  Search,
  Filter,
  Layers,
  ArrowRight,
  UserCheck,
  Check,
  RotateCcw
} from 'lucide-react';

interface TeamSquadsHubProps {
  onNavigateTab?: (tab: string) => void;
}

export const TeamSquadsHub: React.FC<TeamSquadsHubProps> = ({ onNavigateTab }) => {
  const { user, switchAccount } = useAuth();

  const [teams, setTeams] = useState<Team[]>([]);
  const [issues, setIssues] = useState<TaskIssue[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [prototypes, setPrototypes] = useState<PrototypeVersion[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Selected Tab: 'all' | 'team1' | 'team2' | 'team3'
  const [activeTab, setActiveTab] = useState<'all' | 'team1' | 'team2' | 'team3'>('all');

  // Issue filter inside squad view
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState('');

  // Requirement Modal
  const [reqModalProject, setReqModalProject] = useState<Project | null>(null);

  // Prototype Modal
  const [isProtoModalOpen, setIsProtoModalOpen] = useState(false);
  const [protoProjectId, setProtoProjectId] = useState<number | undefined>();
  const [protoVersion, setProtoVersion] = useState('v1.0');
  const [protoTitle, setProtoTitle] = useState('Interactive Clickable Figma Wireframe');
  const [protoPreviewUrl, setProtoPreviewUrl] = useState('https://preview.figma.com/nexora-squad-prototype');
  const [protoDescription, setProtoDescription] = useState('Complete clickable prototype covering core user journeys and interaction states.');
  const [protoFeatures, setProtoFeatures] = useState('Interactive onboarding, transaction flows, responsive views');
  const [protoSubmitting, setProtoSubmitting] = useState(false);

  // Log Time Modal
  const [logTimeIssue, setLogTimeIssue] = useState<TaskIssue | null>(null);
  const [hoursToLog, setHoursToLog] = useState<number>(2);
  const [logNotes, setLogNotes] = useState('');
  const [logSubmitting, setLogSubmitting] = useState(false);

  // Blocker Modal
  const [blockerIssue, setBlockerIssue] = useState<TaskIssue | null>(null);
  const [blockerReason, setBlockerReason] = useState('');
  const [blockerSubmitting, setBlockerSubmitting] = useState(false);

  // Feedback message
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    try {
      const [tRes, iRes, pRes, protoRes] = await Promise.all([
        teamApi.getAll(),
        issueApi.getAll(),
        projectApi.getAll(),
        prototypeApi.getAll()
      ]);
      setTeams(tRes.data);
      setIssues(iRes.data);
      setProjects(pRes.data);
      setPrototypes(protoRes.data);
      if (pRes.data.length > 0 && !protoProjectId) {
        setProtoProjectId(pRes.data[0].id);
      }
    } catch (e) {
      console.error('Error loading team hub data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Find Team 1, 2, and 3
  const team1 = teams.find(t => t.code === 'TEAM-01' || t.name.toLowerCase().includes('team 1') || t.name.toLowerCase().includes('frontend'));
  const team2 = teams.find(t => t.code === 'TEAM-02' || t.name.toLowerCase().includes('team 2') || t.name.toLowerCase().includes('backend'));
  const team3 = teams.find(t => t.code === 'TEAM-03' || t.name.toLowerCase().includes('team 3') || t.name.toLowerCase().includes('full-stack'));

  const getTeamObj = (tab: 'team1' | 'team2' | 'team3') => {
    if (tab === 'team1') return team1;
    if (tab === 'team2') return team2;
    return team3;
  };

  // Get active squad based on activeTab
  const currentTeam = activeTab !== 'all' ? getTeamObj(activeTab) : null;

  // Filter issues for a given team
  const getIssuesForTeam = (teamId?: number) => {
    if (!teamId) return [];
    return issues.filter(iss => iss.teamId === teamId);
  };

  // Filter projects for a given team
  const getProjectsForTeam = (teamId?: number) => {
    if (!teamId) return [];
    return projects.filter(p => p.primaryTeamId === teamId);
  };

  // Quick switch account
  const handleQuickLogin = async (email: string, pass: string) => {
    try {
      setStatusMessage({ text: `Switching session to ${email}...`, type: 'success' });
      await switchAccount(email, pass);
      await loadData();
      setStatusMessage({ text: `Successfully logged in as ${email}`, type: 'success' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage({ text: err.message || 'Login failed', type: 'error' });
    }
  };

  // Update Issue Status
  const handleUpdateIssueStatus = async (issue: TaskIssue, targetStatus: IssueStatus) => {
    if (targetStatus === 'BLOCKED') {
      setBlockerIssue(issue);
      setBlockerReason('');
      return;
    }
    try {
      await issueApi.updateStatus(issue.id, { status: targetStatus });
      loadData();
      setStatusMessage({ text: `Task ${issue.issueKey} updated to ${targetStatus}`, type: 'success' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  };

  // Submit Blocker
  const handleSubmitBlocker = async () => {
    if (!blockerIssue || !blockerReason.trim()) return;
    setBlockerSubmitting(true);
    try {
      await issueApi.updateStatus(blockerIssue.id, {
        status: 'BLOCKED',
        blockerReason
      });
      setBlockerIssue(null);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setBlockerSubmitting(false);
    }
  };

  // Handle Log Time
  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTimeIssue || hoursToLog <= 0) return;
    setLogSubmitting(true);
    try {
      await issueApi.logTime(logTimeIssue.id, {
        hoursLogged: hoursToLog,
        workDate: new Date().toISOString().split('T')[0],
        description: logNotes || 'Sprint task progress'
      });
      setLogTimeIssue(null);
      setLogNotes('');
      loadData();
      setStatusMessage({ text: `Logged ${hoursToLog}h for ${logTimeIssue.issueKey}`, type: 'success' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setLogSubmitting(false);
    }
  };

  // Submit Prototype
  const handleSubmitPrototype = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!protoProjectId) return;
    setProtoSubmitting(true);
    try {
      await prototypeApi.submit({
        projectId: protoProjectId,
        versionNumber: protoVersion,
        title: protoTitle,
        previewUrl: protoPreviewUrl || undefined,
        description: protoDescription,
        featuresCovered: protoFeatures
      });
      setIsProtoModalOpen(false);
      loadData();
      alert('Prototype submitted successfully to Project Manager for evaluation!');
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setProtoSubmitting(false);
    }
  };

  // Squad member role helpers
  const getRoleIcon = (roleName: string) => {
    const r = roleName.toLowerCase();
    if (r.includes('lead')) return <Users2 className="w-4 h-4 text-blue-500" />;
    if (r.includes('design') || r.includes('ui') || r.includes('ux')) return <Palette className="w-4 h-4 text-pink-500" />;
    if (r.includes('dev') || r.includes('engineer') || r.includes('code')) return <Code2 className="w-4 h-4 text-indigo-500" />;
    if (r.includes('test') || r.includes('qa')) return <CheckSquare className="w-4 h-4 text-emerald-500" />;
    return <Users2 className="w-4 h-4 text-slate-500" />;
  };

  const getRoleBadgeColor = (roleName: string) => {
    const r = roleName.toLowerCase();
    if (r.includes('lead')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (r.includes('design') || r.includes('ui') || r.includes('ux')) return 'bg-pink-100 text-pink-800 border-pink-200';
    if (r.includes('dev') || r.includes('engineer')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    if (r.includes('test') || r.includes('qa')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  // Specific role extraction for Team 1, 2, 3
  const getSquadRoster = (team: Team | undefined) => {
    if (!team) return [];
    // Ensure we have roles for Lead, Developer, UI Designer, Tester
    return team.members || [];
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
              <Users2 className="w-3.5 h-3.5" />
              Teams & Squads Hub
            </span>
            <span className="text-xs text-slate-400">Team 1, Team 2 & Team 3 Workload & Governance</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">Cross-Functional Engineering Squads</h1>
          <p className="text-sm text-slate-300 max-w-2xl mt-1">
            Dedicated consoles for Team 1, Team 2, and Team 3 leads. Track squad availability (Available vs Occupied), dedicated roles (Developer, UI Designer, Tester), and task progress.
          </p>
        </div>

        {/* Current User Pill */}
        <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/15 flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="text-xs">
            <div className="font-bold text-white">{user?.name}</div>
            <div className="text-slate-300 text-[11px]">{user?.jobTitle || user?.role}</div>
          </div>
        </div>
      </div>

      {/* Status Feedback Toast */}
      {statusMessage && (
        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
          statusMessage.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-rose-50 border-rose-300 text-rose-800'
        }`}>
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* 2. SQUAD LOGIN & ROLE SWITCHER BAR (Requirement: "टीम 1 लॉगिन, टीम 2 लॉगिन, टीम 3 लॉगिन उसके अंदर होना चाहिए") */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              Squad Quick Login & Lead Switcher
            </h2>
            <p className="text-[11px] text-slate-500">
              Click any squad lead to switch session immediately and view their dedicated workspace, projects, and sprint tasks.
            </p>
          </div>
          <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
            Real Authentication Switcher
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {/* Team 1 Login Button */}
          <button
            onClick={() => {
              handleQuickLogin('team1@nexora.com', 'team123');
              setActiveTab('team1');
            }}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
              user?.email === 'team1@nexora.com'
                ? 'bg-blue-50/80 border-blue-500 shadow-sm ring-2 ring-blue-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                TEAM 1 LEAD
              </span>
              {user?.email === 'team1@nexora.com' && (
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              )}
            </div>
            <div className="mt-2">
              <div className="text-xs font-bold text-slate-900">Vikram Rao</div>
              <div className="text-[10px] text-slate-500">Frontend UI/UX Squad</div>
            </div>
            <div className="mt-2 text-[10px] font-mono text-blue-600 font-semibold flex items-center gap-1">
              Login to Team 1 →
            </div>
          </button>

          {/* Team 2 Login Button */}
          <button
            onClick={() => {
              handleQuickLogin('team2@nexora.com', 'team123');
              setActiveTab('team2');
            }}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
              user?.email === 'team2@nexora.com'
                ? 'bg-indigo-50/80 border-indigo-500 shadow-sm ring-2 ring-indigo-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                TEAM 2 LEAD
              </span>
              {user?.email === 'team2@nexora.com' && (
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              )}
            </div>
            <div className="mt-2">
              <div className="text-xs font-bold text-slate-900">Siddharth Roy</div>
              <div className="text-[10px] text-slate-500">Core Backend Squad</div>
            </div>
            <div className="mt-2 text-[10px] font-mono text-indigo-600 font-semibold flex items-center gap-1">
              Login to Team 2 →
            </div>
          </button>

          {/* Team 3 Login Button */}
          <button
            onClick={() => {
              handleQuickLogin('team3@nexora.com', 'team123');
              setActiveTab('team3');
            }}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
              user?.email === 'team3@nexora.com'
                ? 'bg-purple-50/80 border-purple-500 shadow-sm ring-2 ring-purple-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                TEAM 3 LEAD
              </span>
              {user?.email === 'team3@nexora.com' && (
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
              )}
            </div>
            <div className="mt-2">
              <div className="text-xs font-bold text-slate-900">Aarav Mehta</div>
              <div className="text-[10px] text-slate-500">Full-Stack Innovation</div>
            </div>
            <div className="mt-2 text-[10px] font-mono text-purple-600 font-semibold flex items-center gap-1">
              Login to Team 3 →
            </div>
          </button>

          {/* Project Manager Login */}
          <button
            onClick={() => handleQuickLogin('pm@nexora.com', 'pm123')}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
              user?.email === 'pm@nexora.com'
                ? 'bg-emerald-50/80 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                PROJECT MANAGER
              </span>
              {user?.email === 'pm@nexora.com' && (
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              )}
            </div>
            <div className="mt-2">
              <div className="text-xs font-bold text-slate-900">Alex Vance</div>
              <div className="text-[10px] text-slate-500">PM Governance Hub</div>
            </div>
            <div className="mt-2 text-[10px] font-mono text-emerald-600 font-semibold flex items-center gap-1">
              Switch to PM →
            </div>
          </button>

          {/* Client Login */}
          <button
            onClick={() => handleQuickLogin('client@nexora.com', 'client123')}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
              user?.email === 'client@nexora.com'
                ? 'bg-amber-50/80 border-amber-500 shadow-sm ring-2 ring-amber-500/20'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                CLIENT PORTAL
              </span>
              {user?.email === 'client@nexora.com' && (
                <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
              )}
            </div>
            <div className="mt-2">
              <div className="text-xs font-bold text-slate-900">Elena Rostova</div>
              <div className="text-[10px] text-slate-500">Client Approvals</div>
            </div>
            <div className="mt-2 text-[10px] font-mono text-amber-600 font-semibold flex items-center gap-1">
              Switch to Client →
            </div>
          </button>
        </div>
      </div>

      {/* 3. SQUAD NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          All Squads Live Comparison ({teams.length})
        </button>

        <button
          onClick={() => setActiveTab('team1')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'team1'
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Code2 className="w-4 h-4" />
          Team 1 — Frontend UI/UX Squad
          {team1 && (
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
              team1.availabilityStatus === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {team1.availabilityStatus === 'Available' ? '🟢 Khaali' : '🔵 Active'}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('team2')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'team2'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          Team 2 — Core Backend Squad
          {team2 && (
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
              team2.availabilityStatus === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
            }`}>
              {team2.availabilityStatus === 'Available' ? '🟢 Khaali' : '🔵 Active'}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('team3')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'team3'
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Team 3 — Full-Stack & Innovation
          {team3 && (
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
              team3.availabilityStatus === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
            }`}>
              {team3.availabilityStatus === 'Available' ? '🟢 Khaali' : '🔵 Active'}
            </span>
          )}
        </button>
      </div>

      {/* 4. TAB CONTENT: ALL SQUADS COMPARISON VIEW */}
      {activeTab === 'all' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              { t: team1, tabKey: 'team1' as const, color: 'blue', title: 'Team 1 — Frontend UI/UX' },
              { t: team2, tabKey: 'team2' as const, color: 'indigo', title: 'Team 2 — Core Backend' },
              { t: team3, tabKey: 'team3' as const, color: 'purple', title: 'Team 3 — Full-Stack & Innovation' },
            ].map(({ t, tabKey, color, title }) => {
              if (!t) return null;
              const isAvailable = t.availabilityStatus === 'Available' || t.workloadPercentage === 0;
              const assignedProjs = getProjectsForTeam(t.id);
              const teamTaskList = getIssuesForTeam(t.id);

              return (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {t.code}
                      </span>
                      {isAvailable ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-emerald-600" />
                          🟢 Available (Khaali)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                          🔵 Occupied ({t.workloadPercentage}%)
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{t.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{t.description}</p>

                    {/* Team Lead */}
                    <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                        {t.teamLeadName?.charAt(0) || 'L'}
                      </div>
                      <div className="text-xs">
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">Team Lead</span>
                        <span className="font-bold text-slate-800">{t.teamLeadName}</span>
                      </div>
                    </div>

                    {/* Workload Progress Bar */}
                    <div className="mt-4 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Squad Workload</span>
                        <span className="font-bold text-slate-900">{t.workloadPercentage}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            t.workloadPercentage > 85 ? 'bg-rose-500' : t.workloadPercentage > 50 ? 'bg-blue-600' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(t.workloadPercentage, 100)}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
                        <span>Capacity: {t.weeklyCapacityHours}h/week</span>
                        <span>Assigned: {t.activeAssignedHours}h</span>
                      </div>
                    </div>

                    {/* Assigned Projects */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-700 block mb-2">
                        Assigned Projects ({assignedProjs.length})
                      </span>
                      {assignedProjs.length === 0 ? (
                        <div className="p-2.5 bg-emerald-50/50 border border-dashed border-emerald-200 rounded-xl text-center text-xs text-emerald-800">
                          ✨ No active projects currently. Squad is free / available for assignment!
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {assignedProjs.map(p => (
                            <div key={p.id} className="p-2 bg-slate-50 rounded-lg border border-slate-200/80 text-xs flex items-center justify-between">
                              <span className="font-bold text-slate-800 truncate">{p.title}</span>
                              <Badge variant="stage" value={p.stage} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Squad Members Roster */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-700 block mb-2">
                        Squad Roles & Roster ({t.members?.length || 4} Members)
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                        {t.members?.map(m => (
                          <div key={m.id} className="p-1.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-1.5">
                            {getRoleIcon(m.teamRole)}
                            <div className="truncate">
                              <span className="font-semibold text-slate-800 block truncate">{m.userName}</span>
                              <span className="text-[10px] text-slate-500">{m.teamRole}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Open Dedicated Squad View */}
                  <div className="pt-3 border-t border-slate-100">
                    <button
                      onClick={() => setActiveTab(tabKey)}
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      Open {t.code} Tasks & Work Hub <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT: DEDICATED SQUAD DETAIL VIEW (Team 1, Team 2, or Team 3) */}
      {activeTab !== 'all' && currentTeam && (
        <div className="space-y-6">
          {/* Squad Header & Availability Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {currentTeam.code}
                  </span>
                  {currentTeam.availabilityStatus === 'Available' || currentTeam.workloadPercentage === 0 ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      🟢 AVAILABLE (KHAALI) — Ready for Assignment
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      🔵 OCCUPIED ({currentTeam.workloadPercentage}% Workload)
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">{currentTeam.name}</h2>
                <p className="text-xs text-slate-500 max-w-3xl mt-0.5">{currentTeam.description}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Submit Prototype Button */}
                <button
                  onClick={() => setIsProtoModalOpen(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  Submit Prototype to PM
                </button>

                {/* If user is not yet logged in as this lead, offer 1-click login */}
                <button
                  onClick={() => {
                    const email = activeTab === 'team1' ? 'team1@nexora.com' : activeTab === 'team2' ? 'team2@nexora.com' : 'team3@nexora.com';
                    handleQuickLogin(email, 'team123');
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  Login as {currentTeam.code} Lead
                </button>
              </div>
            </div>

            {/* Squad Metrics & Capacity Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Weekly Capacity</span>
                <span className="text-base font-extrabold text-slate-900">{currentTeam.weeklyCapacityHours} Hours</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Assigned Workload</span>
                <span className="text-base font-extrabold text-blue-600">{currentTeam.activeAssignedHours} Hours ({currentTeam.workloadPercentage}%)</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Active Tasks</span>
                <span className="text-base font-extrabold text-slate-900">{getIssuesForTeam(currentTeam.id).length} Issues</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Assigned Projects</span>
                <span className="text-base font-extrabold text-purple-700">{getProjectsForTeam(currentTeam.id).length} Projects</span>
              </div>
            </div>
          </div>

          {/* 6. DEDICATED SQUAD ROLES & MEMBERS (Requirement: "टीम के अंदर UI डिज़ाइनर, डेवलपर, टेस्टर और टीम लीड") */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users2 className="w-4 h-4 text-blue-600" />
                  Squad Role Assignments (Team Lead, UI/UX Designer, Developer, QA Tester)
                </h3>
                <p className="text-xs text-slate-500">
                  Dedicated cross-functional members assigned to {currentTeam.name}.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {currentTeam.members?.length || 4} Core Squad Members
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {currentTeam.members?.map((m) => {
                const memberTasks = issues.filter(iss => iss.assigneeId === m.userId);
                const activeMemberTasks = memberTasks.filter(iss => iss.status !== 'RESOLVED' && iss.status !== 'CLOSED');

                return (
                  <div
                    key={m.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getRoleBadgeColor(m.teamRole)}`}>
                          {m.teamRole}
                        </span>
                        {getRoleIcon(m.teamRole)}
                      </div>

                      <div className="flex items-center gap-2.5 mt-2">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {m.userName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-xs truncate">{m.userName}</h4>
                          <span className="text-[10px] text-slate-400 block truncate">{m.userEmail}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Weekly Hours</span>
                          <span className="font-semibold text-slate-800">{m.allocatedHoursPerWeek || 40}h / week</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Active Tasks</span>
                          <span className="font-bold text-blue-600">{activeMemberTasks.length} in progress</span>
                        </div>
                      </div>
                    </div>

                    {/* Member Tasks Preview */}
                    <div className="mt-3 pt-2 border-t border-slate-100">
                      {activeMemberTasks.length === 0 ? (
                        <div className="text-[10px] text-slate-400 italic">No pending tasks assigned</div>
                      ) : (
                        <div className="space-y-1">
                          {activeMemberTasks.slice(0, 2).map(t => (
                            <div key={t.id} className="text-[10px] text-slate-700 bg-slate-50 p-1.5 rounded border border-slate-100 truncate">
                              <span className="font-mono font-bold text-blue-600 mr-1">{t.issueKey}:</span>
                              {t.title}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 7. ASSIGNED PROJECTS & PROTOTYPES CONSOLE */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FolderGit2 className="w-4 h-4 text-purple-600" />
                  Assigned Squad Projects & Prototypes
                </h3>
                <p className="text-xs text-slate-500">
                  Projects assigned by the Project Manager to {currentTeam.name}.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {getProjectsForTeam(currentTeam.id).length} Active Projects
              </span>
            </div>

            {getProjectsForTeam(currentTeam.id).length === 0 ? (
              <div className="p-8 text-center bg-emerald-50/40 rounded-xl border border-dashed border-emerald-200">
                <Sparkles className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-emerald-950">Squad is Available (Khaali)</h4>
                <p className="text-xs text-emerald-700 mt-1 max-w-md mx-auto">
                  This squad has no active projects assigned. When the Project Manager evaluates new client requests, they can assign them to this team.
                </p>
                {user?.role === 'ROLE_PM' || user?.role === 'ROLE_ADMIN' ? (
                  <button
                    onClick={() => onNavigateTab && onNavigateTab('dashboard')}
                    className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                  >
                    Assign a Pending Project in PM Dashboard →
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getProjectsForTeam(currentTeam.id).map((p) => {
                  const projProtos = prototypes.filter(pr => pr.projectId === p.id);

                  return (
                    <div key={p.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {p.projectCode}
                          </span>
                          <Badge variant="stage" value={p.stage} />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{p.title}</h4>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{p.description}</p>

                        {/* Progress */}
                        <div className="mt-3 space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>Development Progress</span>
                            <span className="font-bold text-slate-800">{p.progressPercentage}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${p.progressPercentage}%` }} />
                          </div>
                        </div>

                        {/* Prototype Preview if any */}
                        {projProtos.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-200/80">
                            <div className="flex items-center justify-between text-[11px] font-bold text-purple-900 mb-1">
                              <span className="flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                Submitted Prototype ({projProtos[0].versionNumber})
                              </span>
                              <Badge variant="stage" value={projProtos[0].status as any} />
                            </div>
                            <p className="text-[11px] text-slate-600">{projProtos[0].title}</p>
                            {projProtos[0].previewUrl && (
                              <a
                                href={projProtos[0].previewUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 mt-1"
                              >
                                View Interactive Figma Wireframe <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setReqModalProject(p)}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          View Requirements File
                        </button>

                        <button
                          onClick={() => {
                            setProtoProjectId(p.id);
                            setIsProtoModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Submit Prototype
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 8. WORK & PROGRESS TRACKER ("कौन क्या काम कर रहा है और काम कहां तक पहुंचा है") */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-blue-600" />
                  Live Task & Sprint Progress Tracker ("कौन क्या काम कर रहा है, काम कहां तक पहुंचा है")
                </h3>
                <p className="text-xs text-slate-500">
                  Track every issue, its assignee (Developer, UI Designer, Tester), hours logged, and completion stage.
                </p>
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs w-40 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="p-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="IN_REVIEW">Ready for QA</option>
                  <option value="RESOLVED">Resolved / Done</option>
                </select>
              </div>
            </div>

            {/* Task Table */}
            {(() => {
              const teamIssues = getIssuesForTeam(currentTeam.id).filter(iss => {
                const matchStatus = statusFilter === 'ALL' || iss.status === statusFilter;
                const matchSearch = !searchFilter ||
                  iss.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
                  iss.issueKey.toLowerCase().includes(searchFilter.toLowerCase()) ||
                  (iss.assigneeName && iss.assigneeName.toLowerCase().includes(searchFilter.toLowerCase()));
                return matchStatus && matchSearch;
              });

              if (teamIssues.length === 0) {
                return (
                  <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No tasks matching criteria for {currentTeam.name}.
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                        <th className="py-3 px-3">Task Key</th>
                        <th className="py-3 px-3">Title & Scope</th>
                        <th className="py-3 px-3">Assignee & Role</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Hours (Logged / Est)</th>
                        <th className="py-3 px-3">Progress</th>
                        <th className="py-3 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {teamIssues.map((iss) => {
                        const progressPct = iss.estimatedHours > 0
                          ? Math.min(Math.round(((iss.loggedHours || 0) / iss.estimatedHours) * 100), 100)
                          : iss.status === 'RESOLVED' || iss.status === 'CLOSED' ? 100 : 0;

                        return (
                          <tr key={iss.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-3 font-mono font-bold text-blue-600 whitespace-nowrap">
                              {iss.issueKey}
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900">{iss.title}</div>
                              <div className="text-[11px] text-slate-500 line-clamp-1">{iss.description}</div>
                              {iss.blockerReason && (
                                <div className="mt-1 text-[10px] text-rose-700 bg-rose-50 p-1 rounded border border-rose-200">
                                  <strong>Blocker:</strong> {iss.blockerReason}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="font-semibold text-slate-800 block">{iss.assigneeName || 'Unassigned'}</span>
                              <span className="text-[10px] text-slate-400">Squad Member</span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <Badge variant="stage" value={iss.status as any} />
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="font-mono font-bold text-slate-800">{iss.loggedHours || 0}h</span>
                              <span className="text-slate-400"> / {iss.estimatedHours || 0}h</span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden mb-1">
                                <div
                                  className={`h-2 rounded-full ${
                                    iss.status === 'RESOLVED' ? 'bg-emerald-500' : iss.status === 'BLOCKED' ? 'bg-rose-500' : 'bg-blue-600'
                                  }`}
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono font-bold text-slate-600">{progressPct}%</span>
                            </td>
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {iss.status === 'TODO' && (
                                  <button
                                    onClick={() => handleUpdateIssueStatus(iss, 'IN_PROGRESS')}
                                    className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-bold"
                                  >
                                    Start Work
                                  </button>
                                )}
                                {iss.status === 'IN_PROGRESS' && (
                                  <>
                                    <button
                                      onClick={() => handleUpdateIssueStatus(iss, 'IN_REVIEW')}
                                      className="px-2 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded text-[11px] font-bold"
                                    >
                                      Ready for QA
                                    </button>
                                    <button
                                      onClick={() => handleUpdateIssueStatus(iss, 'BLOCKED')}
                                      className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-[11px] font-bold"
                                    >
                                      Blocker
                                    </button>
                                  </>
                                )}
                                {iss.status === 'IN_REVIEW' && (
                                  <button
                                    onClick={() => handleUpdateIssueStatus(iss, 'RESOLVED')}
                                    className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-bold"
                                  >
                                    Mark Resolved
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setLogTimeIssue(iss);
                                    setHoursToLog(2);
                                  }}
                                  className="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-[11px] font-semibold"
                                >
                                  Log Time
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Requirement Document Modal */}
      {reqModalProject && (
        <RequirementDocumentModal
          project={reqModalProject}
          isOpen={!!reqModalProject}
          onClose={() => setReqModalProject(null)}
        />
      )}

      {/* Submit Prototype Modal */}
      <Modal
        isOpen={isProtoModalOpen}
        onClose={() => setIsProtoModalOpen(false)}
        title="Submit Interactive Prototype to Project Manager"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitPrototype} className="space-y-4 text-xs">
          <p className="text-slate-500">
            Submit your squad's interactive prototype and Figma flow specifications. The Project Manager will evaluate it before sending to the client.
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Project *</label>
            <select
              value={protoProjectId}
              onChange={(e) => setProtoProjectId(Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              required
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.projectCode} — {p.title} ({p.stage})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Version Number *</label>
              <input
                type="text"
                required
                value={protoVersion}
                onChange={(e) => setProtoVersion(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                placeholder="v1.0"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Prototype Title *</label>
              <input
                type="text"
                required
                value={protoTitle}
                onChange={(e) => setProtoTitle(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                placeholder="Interactive Wireframe Flow"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Figma / Preview Wireframe URL</label>
            <input
              type="url"
              value={protoPreviewUrl}
              onChange={(e) => setProtoPreviewUrl(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
              placeholder="https://preview.figma.com/nexora-prototype"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Prototype Description & Scope *</label>
            <textarea
              required
              rows={3}
              value={protoDescription}
              onChange={(e) => setProtoDescription(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              placeholder="Detailed description of features and clickable user journeys..."
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Features Covered</label>
            <input
              type="text"
              value={protoFeatures}
              onChange={(e) => setProtoFeatures(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              placeholder="Onboarding, transfer flows, responsive viewports"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsProtoModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={protoSubmitting}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 shadow"
            >
              <Send className="w-3.5 h-3.5" />
              {protoSubmitting ? 'Submitting...' : 'Submit to Project Manager'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Log Time Modal */}
      {logTimeIssue && (
        <Modal
          isOpen={!!logTimeIssue}
          onClose={() => setLogTimeIssue(null)}
          title={`Log Sprint Time for ${logTimeIssue.issueKey}`}
          maxWidth="sm"
        >
          <form onSubmit={handleLogTime} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hours Logged *</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                required
                value={hoursToLog}
                onChange={(e) => setHoursToLog(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Work Description</label>
              <textarea
                rows={2}
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)}
                placeholder="What did you work on?"
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setLogTimeIssue(null)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={logSubmitting}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
              >
                {logSubmitting ? 'Saving...' : 'Save Logged Hours'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Report Blocker Modal */}
      {blockerIssue && (
        <Modal
          isOpen={!!blockerIssue}
          onClose={() => setBlockerIssue(null)}
          title={`Flag Task ${blockerIssue.issueKey} as BLOCKED`}
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              Describe the blocking impediment. This will alert the Team Lead and Project Manager immediately.
            </p>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Blocker Reason / Impediment *</label>
              <textarea
                rows={3}
                required
                value={blockerReason}
                onChange={(e) => setBlockerReason(e.target.value)}
                placeholder="e.g. Awaiting API credentials renewal, third-party outage..."
                className="w-full p-2 border border-rose-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBlockerIssue(null)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitBlocker}
                disabled={blockerSubmitting || !blockerReason.trim()}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold disabled:opacity-50"
              >
                {blockerSubmitting ? 'Flagging...' : 'Confirm Blocker'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

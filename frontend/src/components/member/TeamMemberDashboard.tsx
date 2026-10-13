import React, { useState, useEffect } from 'react';
import { issueApi, dashboardApi, projectApi, prototypeApi } from '../../services/api';
import { TaskIssue, IssueStatus, Project } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { StatCard } from '../common/StatCard';
import { RequirementDocumentModal } from '../common/RequirementDocumentModal';
import {
  ListTodo,
  Clock,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ChevronRight,
  FileText,
  Users2,
  Code2,
  Palette,
  CheckSquare,
  ShieldAlert,
  Send,
  Calendar
} from 'lucide-react';

export const TeamMemberDashboard: React.FC = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState<TaskIssue[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Requirement Document Modal State
  const [reqModalProject, setReqModalProject] = useState<Project | null>(null);

  // Status Change / Blocker Modal State
  const [blockerIssue, setBlockerIssue] = useState<TaskIssue | null>(null);
  const [blockerReason, setBlockerReason] = useState('');
  const [blockerSubmitting, setBlockerSubmitting] = useState(false);

  // Log Time Modal State
  const [logTimeIssue, setLogTimeIssue] = useState<TaskIssue | null>(null);
  const [hoursToLog, setHoursToLog] = useState<number>(2);
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [logNotes, setLogNotes] = useState('');
  const [logSubmitting, setLogSubmitting] = useState(false);

  // Prototype Submission Modal State (Stage 4)
  const [isProtoModalOpen, setIsProtoModalOpen] = useState(false);
  const [protoProjectId, setProtoProjectId] = useState<number | undefined>();
  const [protoVersion, setProtoVersion] = useState('v1.0');
  const [protoTitle, setProtoTitle] = useState('Interactive Figma Prototype & UI Flow Specification');
  const [protoPreviewUrl, setProtoPreviewUrl] = useState('https://preview.figma.com/nexora-team3-flow');
  const [protoDescription, setProtoDescription] = useState('Clickable high-fidelity wireframe covering onboarding, user portfolio, and analytics dashboard.');
  const [protoFeatures, setProtoFeatures] = useState('Interactive onboarding, real-time risk allocation cards, budget projection simulator');
  const [protoLimitations, setProtoLimitations] = useState('Sandbox data feed; live bank gateway integration in Phase 8');
  const [protoSubmitting, setProtoSubmitting] = useState(false);

  // Final Delivery Submission Modal State (Requirement 5)
  const [finalModalProject, setFinalModalProject] = useState<Project | null>(null);
  const [finalDeliverableNotes, setFinalDeliverableNotes] = useState('');
  const [finalDeploymentUrl, setFinalDeploymentUrl] = useState('');
  const [finalSubmitting, setFinalSubmitting] = useState(false);

  // Error alert
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    try {
      const [iRes, mRes, pRes] = await Promise.all([
        issueApi.getAll({ assigneeId: user.id }),
        dashboardApi.getMember(),
        projectApi.getAll()
      ]);
      setIssues(iRes.data);
      setMetrics(mRes.data);
      setProjects(pRes.data);
      if (pRes.data.length > 0 && !protoProjectId) {
        setProtoProjectId(pRes.data[0].id);
      }
    } catch (e) {
      console.error('Error loading member dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle Status Update with Stage 7 Gate Protection
  const handleUpdateStatus = async (issue: TaskIssue, targetStatus: IssueStatus) => {
    setActionError(null);

    if (targetStatus === 'BLOCKED') {
      setBlockerIssue(issue);
      setBlockerReason('');
      return;
    }

    try {
      await issueApi.updateStatus(issue.id, { status: targetStatus });
      loadData();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message;
      setActionError(errMsg);
    }
  };

  // Submit Blocker Reason
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

  // Handle Time Logging
  const handleLogTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTimeIssue || hoursToLog <= 0) return;
    setLogSubmitting(true);
    try {
      await issueApi.logTime(logTimeIssue.id, {
        hoursLogged: hoursToLog,
        workDate,
        description: logNotes || 'Sprint task progress'
      });
      setLogTimeIssue(null);
      setLogNotes('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setLogSubmitting(false);
    }
  };

  // Handle Prototype Submission to Project Manager
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
        featuresCovered: protoFeatures,
        knownLimitations: protoLimitations
      });
      setIsProtoModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setProtoSubmitting(false);
    }
  };

  // Handle Final Delivery Submission to Project Manager (Requirement 5)
  const handleSubmitFinalDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalModalProject) return;
    setFinalSubmitting(true);
    try {
      await projectApi.submitFinal(finalModalProject.id, {
        deliverableNotes: finalDeliverableNotes,
        deploymentUrl: finalDeploymentUrl.trim() ? finalDeploymentUrl.trim() : undefined
      });
      setFinalModalProject(null);
      setFinalDeliverableNotes('');
      setFinalDeploymentUrl('');
      loadData();
      alert('Finished project deliverables successfully submitted to Project Manager for final review!');
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setFinalSubmitting(false);
    }
  };

  // Columns for Member Kanban
  const kanbanColumns: { status: IssueStatus; label: string; color: string }[] = [
    { status: 'TODO', label: 'To Do', color: 'bg-slate-100 text-slate-700' },
    { status: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    { status: 'BLOCKED', label: 'Blocked', color: 'bg-rose-100 text-rose-800' },
    { status: 'IN_REVIEW', label: 'Ready for QA', color: 'bg-purple-100 text-purple-800' },
    { status: 'RESOLVED', label: 'Resolved / Done', color: 'bg-emerald-100 text-emerald-800' },
  ];

  // Determine current squad details based on logged-in user
  const isTeam1 = user?.email?.includes('team1') || user?.department?.includes('Team 1');
  const isTeam2 = user?.email?.includes('team2') || user?.department?.includes('Team 2');

  const squadInfo = isTeam1
    ? {
        name: 'Team 1 — Frontend UI/UX Squad',
        badge: 'Frontend Engineering Console',
        title: 'Team 1 Delivery & Client Interface Execution',
        description: 'Client-side applications, design systems, responsive viewports, and Figma prototypes.',
        members: [
          { initials: 'VR', name: 'Vikram Rao', role: 'Lead Frontend Engineer', color: 'bg-blue-100 text-blue-700' },
          { initials: 'AJ', name: 'Ananya Joshi', role: 'Senior React Developer', color: 'bg-indigo-100 text-indigo-700' },
          { initials: 'KN', name: 'Karthik Nair', role: 'UI/UX Motion Designer', color: 'bg-pink-100 text-pink-700' },
          { initials: 'SP', name: 'Sneha Patel', role: 'Lead QA Web Automation', color: 'bg-emerald-100 text-emerald-700' }
        ]
      }
    : isTeam2
    ? {
        name: 'Team 2 — Core Backend & Microservices Squad',
        badge: 'Backend Architecture Console',
        title: 'Team 2 APIs & Database Persistence Execution',
        description: 'Distributed services, REST & WebSocket pipelines, database models, and cloud security.',
        members: [
          { initials: 'SR', name: 'Siddharth Roy', role: 'Lead Backend Architect', color: 'bg-blue-100 text-blue-700' },
          { initials: 'NG', name: 'Neha Gupta', role: 'Senior Spring Boot Engineer', color: 'bg-indigo-100 text-indigo-700' },
          { initials: 'RV', name: 'Rahul Verma', role: 'Database & Cloud Specialist', color: 'bg-purple-100 text-purple-700' },
          { initials: 'RS', name: 'Riya Sen', role: 'Security & API QA Tester', color: 'bg-emerald-100 text-emerald-700' }
        ]
      }
    : {
        name: 'Team 3 — Full-Stack & Innovation Squad',
        badge: 'Full-Stack Delivery Console',
        title: 'Team 3 Delivery & Sprint Execution',
        description: 'Cross-functional delivery squad with dedicated Developer, UI Designer, and QA Tester.',
        members: [
          { initials: 'AM', name: 'Aarav Mehta', role: 'Delivery Manager / Lead', color: 'bg-blue-100 text-blue-700' },
          { initials: 'MR', name: 'Marcus Reed', role: 'Senior Full-Stack Developer', color: 'bg-indigo-100 text-indigo-700' },
          { initials: 'CB', name: 'Chloe Bennett', role: 'UI/UX Prototype Designer', color: 'bg-pink-100 text-pink-700' },
          { initials: 'DK', name: 'David Kim', role: 'Lead QA Automation Engineer', color: 'bg-emerald-100 text-emerald-700' }
        ]
      };

  return (
    <div className="space-y-6">
      {/* Header Banner with Team Context */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {squadInfo.badge}
            </span>
            <span className="text-xs text-slate-300">{user?.name} ({user?.jobTitle || 'Engineer'})</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">
            {squadInfo.title}
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl mt-1">
            {squadInfo.description}
          </p>
        </div>

        <button
          onClick={() => setIsProtoModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 shrink-0 transform active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          + Build & Submit Prototype File
        </button>
      </div>

      {/* Dedicated Squad Composition Spotlight */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">
              {squadInfo.name} Members (Dedicated Roles)
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            Active Squad Ready
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {squadInfo.members.map((m, idx) => (
            <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${m.color}`}>
                {m.initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{m.name}</p>
                <p className="text-[10px] text-slate-500 font-medium truncate">{m.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION: ASSIGNED PROJECTS & PROTOTYPE MANDATES */}
      {projects.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Assigned Projects & Prototype Mandates (Scoped to {squadInfo.name})
              </h2>
              <p className="text-xs text-slate-500">
                Strict privacy active: projects from other squads are completely isolated; you only see projects assigned to your squad.
              </p>
            </div>
            <span className="text-xs font-bold text-blue-600">
              {projects.length} Project{projects.length > 1 ? 's' : ''} Assigned
            </span>
          </div>

          <div className="space-y-4">
            {projects.map((proj) => {
              const isProtoInProgress = proj.stage === 'PROTOTYPE_IN_PROGRESS';
              const isSubmittedToPm = proj.stage === 'PROTOTYPE_SUBMITTED_TO_MANAGER';
              const isAwaitingClient = proj.stage === 'AWAITING_CLIENT_APPROVAL';
              const isApproved = proj.stage === 'PROTOTYPE_APPROVED';
              const isInDev = proj.stage === 'IN_DEVELOPMENT';

              return (
                <div
                  key={proj.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {proj.projectCode}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900">{proj.title}</h3>
                      <Badge variant="stage" value={proj.stage} />
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-500">
                        Proposed Budget: <strong className="text-emerald-700">${proj.proposedBudget?.toLocaleString() || '85,000'}</strong>
                      </span>
                      <span className="text-slate-500">
                        Deadline: <strong className="text-rose-700">{proj.plannedEndDate ? new Date(proj.plannedEndDate).toLocaleDateString() : '90 Days'}</strong>
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {proj.description || 'Deliverables and scope defined by client.'}
                  </p>

                  {/* Mandate Status Alert */}
                  {isProtoInProgress && (
                    <div className="p-3 bg-blue-50/80 border border-blue-200 text-blue-900 rounded-xl text-xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>
                          <strong>Prototype Mandate Active:</strong> Technical PM Alex Vance has assigned this project to your squad. Build clickable prototype file and submit to PM.
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setProtoProjectId(proj.id);
                          setIsProtoModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shrink-0 shadow-sm transition-all"
                      >
                        Submit Prototype File
                      </button>
                    </div>
                  )}

                  {isSubmittedToPm && (
                    <div className="p-3 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl text-xs flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>
                        <strong>Prototype Submitted to PM:</strong> Waiting for Project Manager Alex Vance to review and forward to Client Elena.
                      </span>
                    </div>
                  )}

                  {isAwaitingClient && (
                    <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>Awaiting Client Approval:</strong> PM forwarded prototype to Client Elena Rostova. Client review is in progress.
                      </span>
                    </div>
                  )}

                  {isApproved && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>Client Approved Prototype!</strong> Waiting for Project Manager to click Stage 7 Formal Development Authorization Gate.
                      </span>
                    </div>
                  )}

                  {(proj.stage === 'IN_DEVELOPMENT' || proj.stage === 'TESTING_QA') && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          <strong>🚀 Development Officially Authorized!</strong> Sprints active. When development & testing are complete, submit final delivery to PM.
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setFinalModalProject(proj);
                          setFinalDeliverableNotes(`Completed all core features for ${proj.title}.\n- Automated regression test suite passing.\n- Acceptance criteria verified.\n- Ready for PM final verification and client delivery.`);
                          setFinalDeploymentUrl(proj.deploymentUrl || '');
                        }}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shrink-0 shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        Submit Final Delivery to PM
                      </button>
                    </div>
                  )}

                  {proj.stage === 'FINAL_REVIEW_PENDING' && (
                    <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>
                          <strong>Final Delivery Submitted to PM:</strong> Project Manager is reviewing deliverables and verifying deployment.
                        </span>
                      </div>
                      <span className="font-bold text-[11px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200">
                        Awaiting PM Sign-Off
                      </span>
                    </div>
                  )}

                  {proj.stage === 'COMPLETED' && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          <strong>🎉 Project Formally Completed & Delivered!</strong> PM has approved final deliverables and client handover is complete.
                        </span>
                      </div>
                      {proj.deploymentUrl && (
                        <a
                          href={proj.deploymentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Launch Live Deployment
                        </a>
                      )}
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                    <button
                      onClick={() => setReqModalProject(proj)}
                      className="text-blue-600 hover:underline font-bold flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      📄 View Full Requirement & Budget File
                    </button>

                    <span className="text-[11px] text-slate-400">
                      Client: {proj.clientName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Tasks"
          value={metrics?.totalAssignedTasks || issues.length}
          subtitle={`${metrics?.inProgressTasks || 0} in progress`}
          icon={ListTodo}
          color="blue"
        />
        <StatCard
          title="Logged Hours"
          value={`${metrics?.totalLoggedHours || 0} hrs`}
          subtitle={`of ${metrics?.totalEstimatedHours || 0} estimated`}
          icon={Clock}
          color="purple"
        />
        <StatCard
          title="Blocked Tasks"
          value={metrics?.blockedTasks || 0}
          subtitle={metrics?.blockedTasks > 0 ? 'Requires attention' : 'No blockers'}
          icon={AlertTriangle}
          color={metrics?.blockedTasks > 0 ? 'rose' : 'emerald'}
        />
        <StatCard
          title="Resolved Tasks"
          value={metrics?.resolvedTasks || 0}
          subtitle="Ready for QA pass"
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* Error Alert (e.g. Stage 7 Development Authorization Block) */}
      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <span className="font-bold block text-sm">Action Blocked by Platform Governance Gate</span>
            <p className="mt-0.5 leading-relaxed">{actionError}</p>
          </div>
        </div>
      )}

      {/* Kanban Board Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Sprint Kanban Board</h2>
            <p className="text-xs text-slate-500">Update task status across delivery columns</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {issues.length} assigned tasks
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {kanbanColumns.map(col => {
            const colIssues = issues.filter(i => {
              if (col.status === 'TODO') return i.status === 'TODO' || i.status === 'OPEN';
              if (col.status === 'IN_REVIEW') return i.status === 'IN_REVIEW' || i.status === 'READY_FOR_QA';
              return i.status === col.status;
            });

            return (
              <div key={col.status} className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/80 flex flex-col min-h-[420px]">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.color}`}>
                    {col.label}
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-500">
                    {colIssues.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto pr-0.5">
                  {colIssues.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-lg">
                      No tasks
                    </div>
                  ) : (
                    colIssues.map(issue => (
                      <div
                        key={issue.id}
                        className="bg-white rounded-lg p-3 border border-slate-200 shadow-xs hover:shadow-md transition-all text-xs"
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-mono font-bold text-[11px] text-blue-600">
                            {issue.issueKey}
                          </span>
                          <Badge variant="priority" value={issue.priority} />
                        </div>

                        <h4 className="font-bold text-slate-900 line-clamp-2 leading-snug">
                          {issue.title}
                        </h4>

                        <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
                          <span>{issue.projectCode}</span>
                          <span>{issue.loggedHours || 0} / {issue.estimatedHours || 0}h</span>
                        </div>

                        {/* Blocker reason if blocked */}
                        {issue.status === 'BLOCKED' && issue.blockerReason && (
                          <div className="mt-2 p-1.5 bg-rose-50 text-rose-700 rounded text-[10px] leading-tight border border-rose-100">
                            <strong>Blocker:</strong> {issue.blockerReason}
                          </div>
                        )}

                        {/* Card actions */}
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                          <button
                            onClick={() => {
                              setLogTimeIssue(issue);
                              setHoursToLog(2);
                            }}
                            className="text-[10px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-0.5"
                          >
                            <Clock className="w-3 h-3" /> Log Time
                          </button>

                          {/* Quick status transition dropdown */}
                          <select
                            value={issue.status}
                            onChange={(e) => handleUpdateStatus(issue, e.target.value as IssueStatus)}
                            className="text-[10px] font-semibold bg-slate-50 border border-slate-200 rounded p-1 text-slate-700"
                          >
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="BLOCKED">Blocked</option>
                            <option value="IN_REVIEW">Ready for QA</option>
                            <option value="RESOLVED">Resolved</option>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Requirement Document Modal */}
      <RequirementDocumentModal
        isOpen={!!reqModalProject}
        onClose={() => setReqModalProject(null)}
        project={reqModalProject}
      />

      {/* Blocker Reason Modal */}
      <Modal
        isOpen={!!blockerIssue}
        onClose={() => setBlockerIssue(null)}
        title={`Report Blocker on ${blockerIssue?.issueKey}`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            A valid blocker explanation is required to notify the Project Manager and update team workload risk calculations.
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Blocker Reason *</label>
            <textarea
              rows={3}
              required
              value={blockerReason}
              onChange={(e) => setBlockerReason(e.target.value)}
              placeholder="e.g. Dependent third-party authentication API credentials expired; waiting for DevOps."
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setBlockerIssue(null)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitBlocker}
              disabled={blockerSubmitting || !blockerReason.trim()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold"
            >
              {blockerSubmitting ? 'Reporting...' : 'Flag as Blocked'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Log Time Modal */}
      <Modal
        isOpen={!!logTimeIssue}
        onClose={() => setLogTimeIssue(null)}
        title={`Log Effort Hours: ${logTimeIssue?.issueKey}`}
        maxWidth="md"
      >
        <form onSubmit={handleLogTime} className="space-y-4 text-xs">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-blue-900">
            <span className="font-bold">{logTimeIssue?.title}</span>
            <div className="mt-1 text-[11px] text-blue-700">
              Logged to date: {logTimeIssue?.loggedHours || 0} / {logTimeIssue?.estimatedHours || 0} hours
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Hours Worked *</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                required
                value={hoursToLog}
                onChange={(e) => setHoursToLog(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Work Date</label>
              <input
                type="date"
                required
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Work Description / Progress Notes</label>
            <textarea
              rows={2}
              value={logNotes}
              onChange={(e) => setLogNotes(e.target.value)}
              placeholder="Completed unit test suites, fixed login cookie serialization..."
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setLogTimeIssue(null)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={logSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold"
            >
              {logSubmitting ? 'Saving...' : 'Save Time Entry'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Submit Prototype Modal (Stage 4) */}
      <Modal
        isOpen={isProtoModalOpen}
        onClose={() => setIsProtoModalOpen(false)}
        title="Submit Prototype File to Project Manager (Stage 4)"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitPrototype} className="space-y-4 text-xs">
          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-950">
            <span className="font-bold">Prototype Submission:</span> Submit your interactive Figma flow or prototype file to Project Manager Alex Vance. Once endorsed, PM will forward it to Client for formal approval.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Project *</label>
              <select
                value={protoProjectId || ''}
                onChange={(e) => setProtoProjectId(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs font-semibold"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.projectCode} — {p.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Version Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. v1.0, v1.1"
                value={protoVersion}
                onChange={(e) => setProtoVersion(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Prototype Document / Specification Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Interactive Clickable Figma Prototype & Wireframe Spec"
              value={protoTitle}
              onChange={(e) => setProtoTitle(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Interactive Preview URL (Figma, Staging Link, InVision) *</label>
            <input
              type="url"
              required
              placeholder="https://preview.figma.com/..."
              value={protoPreviewUrl}
              onChange={(e) => setProtoPreviewUrl(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Detailed Description & Architecture Notes *</label>
            <textarea
              rows={2}
              required
              placeholder="Summary of layout, user interactions, responsive breakdown..."
              value={protoDescription}
              onChange={(e) => setProtoDescription(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Features Covered in Prototype</label>
              <textarea
                rows={2}
                placeholder="Authentication flow, dashboard metrics..."
                value={protoFeatures}
                onChange={(e) => setProtoFeatures(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Known Limitations / Future Sprint Items</label>
              <textarea
                rows={2}
                placeholder="Mock data fed into chart widgets; live API in Phase 8..."
                value={protoLimitations}
                onChange={(e) => setProtoLimitations(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsProtoModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={protoSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center gap-1.5 shadow"
            >
              <Send className="w-3.5 h-3.5" />
              {protoSubmitting ? 'Sending...' : '📤 Send Prototype to Project Manager'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Submit Final Project Delivery Modal (Requirement 5) */}
      <Modal
        isOpen={!!finalModalProject}
        onClose={() => setFinalModalProject(null)}
        title={`Submit Final Project Delivery: ${finalModalProject?.title} (${finalModalProject?.projectCode})`}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitFinalDelivery} className="space-y-4 text-xs">
          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-indigo-950">
            <span className="font-bold">Final Project Delivery Submission:</span> Submit finished project deliverables, QA sign-off notes, and live deployment URL (if configured) to Project Manager Alex Vance for final review and handover.
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Final Deliverable Notes & QA Sign-off *
            </label>
            <textarea
              rows={4}
              required
              value={finalDeliverableNotes}
              onChange={(e) => setFinalDeliverableNotes(e.target.value)}
              placeholder="e.g. All requirements implemented. Full regression tests completed with 100% pass rate. User manual and API swagger documentation included."
              className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Real Deployment URL (Optional — Only provide real URL if configured; leave empty otherwise)
            </label>
            <input
              type="url"
              value={finalDeploymentUrl}
              onChange={(e) => setFinalDeploymentUrl(e.target.value)}
              placeholder="https://app.nexora-production.com or https://staging.clientdomain.com"
              className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Never invent a mock URL. Leave blank if deployment is on-premise or managed separately.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setFinalModalProject(null)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={finalSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center gap-1.5 shadow"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              {finalSubmitting ? 'Submitting...' : '🚀 Submit Final Delivery to PM'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

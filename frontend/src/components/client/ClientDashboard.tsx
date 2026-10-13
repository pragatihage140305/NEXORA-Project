import React, { useState, useEffect } from 'react';
import { projectApi, dashboardApi, prototypeApi, reportApi } from '../../services/api';
import { Project, PrototypeVersion, ProjectReport } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { StatCard } from '../common/StatCard';
import { RequirementDocumentModal } from '../common/RequirementDocumentModal';
import {
  FolderGit2,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  ExternalLink,
  ThumbsUp,
  RotateCcw,
  XCircle,
  FileText,
  DollarSign,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface ClientDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ onNavigateTab }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [prototypes, setPrototypes] = useState<PrototypeVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [reqModalProject, setReqModalProject] = useState<Project | null>(null);

  // Submit Project Modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [businessObjective, setBusinessObjective] = useState('');
  const [expectedFeatures, setExpectedFeatures] = useState('');
  const [requirements, setRequirements] = useState('');
  const [proposedBudget, setProposedBudget] = useState<number | undefined>();
  const [currency, setCurrency] = useState('USD');
  const [plannedStartDate, setPlannedStartDate] = useState('');
  const [plannedEndDate, setPlannedEndDate] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Prototype Review Modal
  const [activeProto, setActiveProto] = useState<PrototypeVersion | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'APPROVE' | 'REQUEST_CHANGES' | 'REJECT'>('APPROVE');
  const [reviewComments, setReviewComments] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [pRes, mRes, protoRes] = await Promise.all([
        projectApi.getAll(),
        dashboardApi.getClient(),
        prototypeApi.getAll()
      ]);
      setProjects(pRes.data);
      setMetrics(mRes.data);
      setPrototypes(protoRes.data);
    } catch (e) {
      console.error('Error loading client dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await projectApi.submit({
        title,
        description,
        businessObjective,
        expectedFeatures,
        requirements,
        proposedBudget: proposedBudget || undefined,
        currency,
        plannedStartDate: plannedStartDate || undefined,
        plannedEndDate: plannedEndDate || undefined,
        priority
      });
      setIsSubmitModalOpen(false);
      // Reset form
      setTitle('');
      setDescription('');
      setBusinessObjective('');
      setExpectedFeatures('');
      setRequirements('');
      setProposedBudget(undefined);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReviewPrototype = async () => {
    if (!activeProto) return;
    setReviewSubmitting(true);
    try {
      await prototypeApi.clientReview(activeProto.id, {
        decision: reviewDecision,
        comments: reviewComments || `Client decision: ${reviewDecision}`
      });
      setActiveProto(null);
      setReviewComments('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDirectAcceptPrototype = async (proto: PrototypeVersion) => {
    try {
      setLoading(true);
      await prototypeApi.clientReview(proto.id, {
        decision: 'APPROVE',
        comments: `Client Elena Rostova reviewed and approved prototype ${proto.versionNumber}. Wireframe and interactive journeys validated.`
      });
      alert(`✓ Prototype ${proto.versionNumber} for "${proto.projectTitle}" APPROVED!\n\nProject Manager has been notified to formally authorize development start.`);
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const pendingPrototypes = prototypes.filter(p => p.status === 'AWAITING_CLIENT_APPROVAL' || p.status === 'MANAGER_APPROVED');
  const approvedPrototypes = prototypes.filter(p => p.status === 'CLIENT_APPROVED');

  return (
    <div className="space-y-6">
      {/* Client Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Client Portal
            </span>
            <span className="text-xs text-slate-400">Strict Project Privacy Active</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">My Projects & Governance</h1>
          <p className="text-sm text-slate-300 max-w-2xl mt-1">
            Submit requirements, inspect wireframe prototypes, approve designs before development authorization, and download verification reports.
          </p>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 shrink-0 transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          + Submit New Project Request
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="My Projects"
          value={metrics?.myProjectsCount || projects.length}
          subtitle="Portfolio under management"
          icon={FolderGit2}
          color="blue"
        />
        <StatCard
          title="Prototypes Needing Approval"
          value={pendingPrototypes.length}
          subtitle={pendingPrototypes.length > 0 ? 'Action requested from you' : 'All prototypes up to date'}
          icon={Sparkles}
          color={pendingPrototypes.length > 0 ? 'amber' : 'emerald'}
        />
        <StatCard
          title="Active in Development"
          value={metrics?.activeProjectsCount || 0}
          subtitle="Under active engineering execution"
          icon={Clock}
          color="purple"
        />
        <StatCard
          title="Completed Deliverables"
          value={metrics?.completedProjectsCount || 0}
          subtitle="Finalized & verified"
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* PERMANENT INTERACTIVE PROTOTYPE REVIEW & CLIENT APPROVAL CONSOLE */}
      <div className="bg-white rounded-2xl border-2 border-indigo-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Interactive Prototype Review & Client Sign-Off Console ({prototypes.length} Available)
              </h2>
              <p className="text-xs text-slate-500">
                Engineering squads build clickable wireframes for your review. Accept prototypes to notify the Project Manager to authorize development start.
              </p>
            </div>
          </div>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border self-start sm:self-auto ${
            pendingPrototypes.length > 0
              ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
          }`}>
            {pendingPrototypes.length > 0 ? `⚡ ${pendingPrototypes.length} Awaiting Your Approval` : '✓ All Prototypes Reviewed'}
          </span>
        </div>

        {prototypes.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Sparkles className="w-6 h-6 text-slate-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No prototypes submitted yet for your projects.</p>
            <p className="text-slate-400 mt-0.5">When the assigned engineering squad and PM submit a wireframe, it will appear here for your approval.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prototypes.map((proto) => {
              const isPending = proto.status === 'AWAITING_CLIENT_APPROVAL' || proto.status === 'MANAGER_APPROVED';
              const isApproved = proto.status === 'CLIENT_APPROVED';
              const isChanges = proto.status === 'CLIENT_CHANGES_REQUESTED';
              const isRejected = proto.status === 'CLIENT_REJECTED';

              return (
                <div
                  key={proto.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                    isPending
                      ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-400/20 shadow-sm'
                      : isApproved
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                          {proto.projectCode}
                        </span>
                        <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {proto.versionNumber}
                        </span>
                      </div>
                      <Badge variant="stage" value={proto.status as any} />
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm">{proto.projectTitle}</h3>
                    <h4 className="text-xs font-semibold text-blue-600 mt-0.5">{proto.title}</h4>

                    <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                      {proto.description || 'No description provided.'}
                    </p>

                    {proto.featuresCovered && (
                      <div className="mt-2 text-[11px] text-slate-600 bg-white/70 p-2 rounded-lg border border-slate-100">
                        <strong className="text-slate-800">Features Included:</strong> {proto.featuresCovered}
                      </div>
                    )}

                    {proto.managerReviewComments && (
                      <div className="mt-2 text-[11px] text-blue-900 bg-blue-50/80 p-2 rounded-lg border border-blue-200">
                        <strong>Project Manager Note:</strong> {proto.managerReviewComments}
                      </div>
                    )}

                    {proto.clientReviewComments && (
                      <div className="mt-2 text-[11px] text-emerald-900 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200">
                        <strong>Your Decision / Feedback:</strong> {proto.clientReviewComments}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-200/80 space-y-2">
                    {/* Clickable wireframe link */}
                    <div className="flex items-center justify-between text-xs">
                      {proto.previewUrl ? (
                        <a
                          href={proto.previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Launch Interactive Wireframe / Figma Flow
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400">Interactive wireframe link ready</span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        {proto.submittedAt ? new Date(proto.submittedAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>

                    {/* Direct Working Client Decision Buttons */}
                    {isPending && (
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <button
                          onClick={() => handleDirectAcceptPrototype(proto)}
                          className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1 transform active:scale-95"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          ACCEPT PROTOTYPE
                        </button>

                        <button
                          onClick={() => {
                            setActiveProto(proto);
                            setReviewDecision('REQUEST_CHANGES');
                            setReviewComments('');
                          }}
                          className="py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          REQUEST REVISIONS
                        </button>

                        <button
                          onClick={() => {
                            setActiveProto(proto);
                            setReviewDecision('REJECT');
                            setReviewComments('');
                          }}
                          className="py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          REJECT
                        </button>
                      </div>
                    )}

                    {isApproved && (
                      <div className="p-2 bg-emerald-100/70 text-emerald-900 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1.5 border border-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ✓ Prototype Approved by You! Waiting for PM to authorize development start.
                      </div>
                    )}

                    {isChanges && (
                      <div className="p-2 bg-amber-100/70 text-amber-900 rounded-lg text-xs font-semibold text-center border border-amber-300">
                        Revisions Requested by You. Squad is updating wireframe.
                      </div>
                    )}

                    {isRejected && (
                      <div className="p-2 bg-rose-100/70 text-rose-900 rounded-lg text-xs font-semibold text-center border border-rose-300">
                        Prototype Rejected by You.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Projects Portfolio */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">My Project Portfolio</h2>
            <p className="text-xs text-slate-500">Scoped strictly to projects authorized under your organization</p>
          </div>
          <button
            onClick={() => onNavigateTab('reports')}
            className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5" /> Reports & Deliverables
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {projects.map((p) => (
            <div key={p.id} className="p-5 hover:bg-slate-50/50 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {p.projectCode}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{p.title}</h3>
                    <Badge variant="stage" value={p.stage} />
                  </div>
                  <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">{p.description}</p>
                </div>

                <div className="flex items-center gap-4 text-xs shrink-0">
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">Project Manager</span>
                    <span className="font-semibold text-slate-800">{p.projectManagerName || 'Unassigned'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px]">Budget</span>
                    <span className="font-mono font-bold text-slate-900">
                      ${Number(p.approvedBudget || p.proposedBudget || 0).toLocaleString()} {p.currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Specific Alerts & Decisions */}
              {p.stage === 'NEEDS_INFORMATION' && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Project Manager Alex Vance requested revisions:</strong>
                    <p className="mt-0.5">{p.delayReason || 'Please review requirements or provide additional scope details.'}</p>
                  </div>
                </div>
              )}

              {p.stage === 'REJECTED' && (
                <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Project Proposal Rejected by PM:</strong>
                    <p className="mt-0.5">{p.delayReason || 'Project proposal could not be accepted with current scope/timeline constraints.'}</p>
                  </div>
                </div>
              )}

              {p.stage === 'SUBMITTED' && (
                <div className="mt-3 p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Proposal successfully submitted. Awaiting Project Manager evaluation and engineering squad assignment.</span>
                </div>
              )}

              {p.stage === 'PROTOTYPE_IN_PROGRESS' && (
                <div className="mt-3 p-2.5 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-purple-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>Interactive prototype is being crafted by <strong>{p.primaryTeamName || 'Assigned Squad'}</strong>.</span>
                </div>
              )}

              {p.stage === 'PROTOTYPE_APPROVED' && (
                <div className="mt-3 p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Prototype approved by you! Waiting for Project Manager to formally authorize development start.</span>
                </div>
              )}

              {p.stage === 'FINAL_REVIEW_PENDING' && (
                <div className="mt-3 p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Final deliverables submitted by squad. Project Manager Alex Vance is conducting release verification.</span>
                </div>
              )}

              {p.stage === 'COMPLETED' && (
                <div className="mt-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-950 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Final Project Deliverable Verified & Approved by Project Manager</span>
                  </div>
                  {p.finalDeliverableNotes && (
                    <div className="bg-white p-3 rounded-lg border border-emerald-100 text-slate-700">
                      <strong className="text-slate-800 block text-[10px] uppercase font-bold text-slate-500 mb-0.5">Final Deliverable Notes</strong>
                      <p className="whitespace-pre-wrap">{p.finalDeliverableNotes}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                    <div>
                      <strong className="text-[10px] uppercase font-bold text-slate-500 block">Production Deployment URL</strong>
                      {p.deploymentUrl ? (
                        <a
                          href={p.deploymentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          {p.deploymentUrl}
                        </a>
                      ) : (
                        <span className="text-slate-500 italic">Deployment URL: Not configured</span>
                      )}
                    </div>
                    {p.finalReviewedByName && (
                      <span className="text-[11px] text-slate-500">
                        Signed off by: <strong className="text-slate-800">{p.finalReviewedByName}</strong>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Progress & Milestones preview */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs items-center">
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                    <span>Overall Project Progress</span>
                    <span className="font-bold text-slate-800">{p.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${p.progressPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 flex-wrap">
                  <button
                    onClick={() => setReqModalProject(p)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    📄 View Requirement & Budget File
                  </button>
                  <button
                    onClick={() => onNavigateTab('timeline')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-colors"
                  >
                    View Timeline
                  </button>
                  <button
                    onClick={() => onNavigateTab('reports')}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold text-xs transition-colors"
                  >
                    View Reports
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Project Request Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit New Project Request"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmitProject} className="space-y-4 text-xs">
          <p className="text-slate-500">
            Submit your project requirements. An Initial Project Assessment Report will be automatically generated upon submission.
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Project Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Mobile Wealth Management App"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description *</label>
            <textarea
              rows={2}
              required
              placeholder="Summary of business needs and system overview..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Business Objective</label>
              <input
                type="text"
                placeholder="Target ROI, revenue growth, or KPI..."
                value={businessObjective}
                onChange={(e) => setBusinessObjective(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Proposed Budget ($)</label>
              <input
                type="number"
                placeholder="e.g. 50000"
                value={proposedBudget || ''}
                onChange={(e) => setProposedBudget(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Completion Date</label>
              <input
                type="date"
                value={plannedEndDate}
                onChange={(e) => setPlannedEndDate(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Expected Features & Deliverables</label>
            <textarea
              rows={2}
              placeholder="List expected core capabilities..."
              value={expectedFeatures}
              onChange={(e) => setExpectedFeatures(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Technical & Security Requirements</label>
            <textarea
              rows={2}
              placeholder="Compliance standards, integrations, performance requirements..."
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow"
            >
              {submitLoading ? 'Submitting...' : 'Submit Project Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Prototype Review & Approval Decision Modal */}
      {activeProto && (
        <Modal
          isOpen={!!activeProto}
          onClose={() => setActiveProto(null)}
          title={`Prototype Review: ${activeProto.projectTitle} (${activeProto.versionNumber})`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 mb-1">{activeProto.title}</h4>
              <p className="text-slate-600 leading-relaxed">{activeProto.description}</p>
              {activeProto.previewUrl && (
                <div className="mt-2.5">
                  <a
                    href={activeProto.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold text-xs shadow-sm hover:bg-blue-500"
                  >
                    Launch Interactive Prototype <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Your Decision</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setReviewDecision('APPROVE')}
                  className={`py-2.5 rounded-xl font-bold flex flex-col items-center gap-1 border transition-all ${
                    reviewDecision === 'APPROVE'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Approve Prototype</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewDecision('REQUEST_CHANGES')}
                  className={`py-2.5 rounded-xl font-bold flex flex-col items-center gap-1 border transition-all ${
                    reviewDecision === 'REQUEST_CHANGES'
                      ? 'bg-amber-600 text-white border-amber-600 shadow'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Request Revisions</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewDecision('REJECT')}
                  className={`py-2.5 rounded-xl font-bold flex flex-col items-center gap-1 border transition-all ${
                    reviewDecision === 'REJECT'
                      ? 'bg-rose-600 text-white border-rose-600 shadow'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Review Comments / Revision Requests</label>
              <textarea
                rows={3}
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder="Provide feedback on the UX flow, missing controls, or approval confirmation..."
                className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveProto(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReviewPrototype}
                disabled={reviewSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow"
              >
                {reviewSubmitting ? 'Recording Decision...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Requirement & Budget Specification Document File Modal */}
      <RequirementDocumentModal
        isOpen={!!reqModalProject}
        onClose={() => setReqModalProject(null)}
        project={reqModalProject}
      />
    </div>
  );
};

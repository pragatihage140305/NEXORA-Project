import React, { useState, useEffect } from 'react';
import { projectApi, authApi, teamApi } from '../../services/api';
import { Project, PrototypeVersion, Milestone, Team, User } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  FolderGit2,
  Search,
  Filter,
  Plus,
  PlayCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Calendar,
  Sparkles,
  Users2,
  FileText,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface ProjectsPageProps {
  onNavigateTab: (tab: string) => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ onNavigateTab }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState('ALL');

  // Selected Project Details Modal
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectMilestones, setProjectMilestones] = useState<Milestone[]>([]);
  const [projectPrototypes, setProjectPrototypes] = useState<PrototypeVersion[]>([]);

  const loadData = async () => {
    try {
      const res = await projectApi.getAll();
      setProjects(res.data);
    } catch (e) {
      console.error('Error loading projects:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenDetails = async (project: Project) => {
    setSelectedProject(project);
    try {
      const [mRes, pRes] = await Promise.all([
        projectApi.getMilestones(project.id),
        projectApi.getPrototypes(project.id)
      ]);
      setProjectMilestones(mRes.data);
      setProjectPrototypes(pRes.data);
    } catch {
      // Ignore
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.projectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.clientName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = selectedStage === 'ALL' || p.stage === selectedStage;
    return matchesSearch && matchesStage;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Enterprise Project Management
            </span>
            <span className="text-xs text-slate-400">10-Stage Lifecycle Registry</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">Projects Portfolio</h1>
          <p className="text-sm text-slate-300 max-w-2xl mt-1">
            Track client requests, prototype validation status, sprint authorizations, and deliverable handoffs.
          </p>
        </div>
      </div>

      {/* Search and Stage Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by code, title, or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-semibold">Stage:</span>
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="p-2 border border-slate-300 rounded-lg font-medium bg-slate-50 text-slate-700"
          >
            <option value="ALL">All Stages ({projects.length})</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="PLANNING">Planning</option>
            <option value="PROTOTYPE_IN_PROGRESS">Prototype In Progress</option>
            <option value="AWAITING_CLIENT_APPROVAL">Awaiting Client Approval</option>
            <option value="PROTOTYPE_APPROVED">Prototype Approved (Stage 7 Ready)</option>
            <option value="IN_DEVELOPMENT">In Development</option>
            <option value="TESTING_QA">Testing & QA</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {p.projectCode}
                </span>
                <Badge variant="stage" value={p.stage} />
              </div>

              <h2 className="text-base font-bold text-slate-900 line-clamp-1">{p.title}</h2>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {p.description || 'No description entered.'}
              </p>

              {/* Attributes */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span>Client:</span>
                  <span className="font-semibold text-slate-800">{p.clientName}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Project Manager:</span>
                  <span className="font-semibold text-slate-800">{p.projectManagerName || 'Unassigned'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Primary Team:</span>
                  <span className="font-semibold text-slate-800">{p.primaryTeamName || 'Unassigned'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Approved Budget:</span>
                  <span className="font-mono font-bold text-slate-900">
                    ${Number(p.approvedBudget || p.proposedBudget || 0).toLocaleString()} {p.currency}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span>Progress</span>
                  <span className="font-bold text-slate-800">{p.progressPercentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${p.progressPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">
                {p.openIssuesCount} active issues
              </span>
              <button
                onClick={() => handleOpenDetails(p)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
              >
                Inspect Details <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Project Details Modal */}
      {selectedProject && (
        <Modal
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          title={`Project Profile: ${selectedProject.title} [${selectedProject.projectCode}]`}
          maxWidth="3xl"
        >
          <div className="space-y-5 text-xs">
            {/* Header Attributes */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Stage</span>
                <div className="mt-1"><Badge variant="stage" value={selectedProject.stage} /></div>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Client</span>
                <span className="font-bold text-slate-900 block mt-1">{selectedProject.clientName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Project Manager</span>
                <span className="font-bold text-slate-900 block mt-1">{selectedProject.projectManagerName || 'Unassigned'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Approved Budget</span>
                <span className="font-mono font-bold text-emerald-700 block mt-1">
                  ${Number(selectedProject.approvedBudget || selectedProject.proposedBudget || 0).toLocaleString()} {selectedProject.currency}
                </span>
              </div>
            </div>

            {/* Scope & Business Objectives */}
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Scope & Business Objective</h4>
                <p className="text-slate-600 mt-1 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                  {selectedProject.businessObjective || selectedProject.description}
                </p>
              </div>

              {selectedProject.expectedFeatures && (
                <div>
                  <h4 className="font-bold text-slate-900">Expected Features</h4>
                  <p className="text-slate-600 mt-1 bg-white p-3 rounded-lg border border-slate-200">
                    {selectedProject.expectedFeatures}
                  </p>
                </div>
              )}

              {selectedProject.requirements && (
                <div>
                  <h4 className="font-bold text-slate-900">Requirements & Compliance Standards</h4>
                  <p className="text-slate-600 mt-1 bg-white p-3 rounded-lg border border-slate-200">
                    {selectedProject.requirements}
                  </p>
                </div>
              )}
            </div>

            {/* Stage 7 Authorization Record if available */}
            {selectedProject.developmentAuthorizedAt && (
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                <span className="font-bold block text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Formally Authorized for Development
                </span>
                <p className="mt-1 text-xs">
                  Authorized on <strong>{new Date(selectedProject.developmentAuthorizedAt).toLocaleString()}</strong> by{' '}
                  <strong>{selectedProject.developmentAuthorizedByName}</strong>.
                </p>
                {selectedProject.developmentNotes && (
                  <p className="mt-1 text-[11px] text-emerald-800 italic">
                    Notes: "{selectedProject.developmentNotes}"
                  </p>
                )}
              </div>
            )}

            {/* Milestones list */}
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-2">Milestones ({projectMilestones.length})</h4>
              {projectMilestones.length === 0 ? (
                <p className="text-slate-400 text-xs">No milestones defined yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {projectMilestones.map((m) => (
                    <div key={m.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                      <span className="font-bold text-slate-800">{m.sequenceOrder}. {m.title}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-mono text-slate-500">{m.targetDate}</span>
                        <Badge variant="status" value={m.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prototypes history */}
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-2">Prototypes History ({projectPrototypes.length})</h4>
              {projectPrototypes.length === 0 ? (
                <p className="text-slate-400 text-xs">No prototype versions submitted yet.</p>
              ) : (
                <div className="space-y-2">
                  {projectPrototypes.map((proto) => (
                    <div key={proto.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{proto.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                            {proto.versionNumber}
                          </span>
                        </div>
                        <Badge variant="stage" value={proto.status} />
                      </div>
                      <p className="text-slate-600 mt-1 text-[11px]">{proto.description}</p>
                      {proto.clientReviewComments && (
                        <p className="mt-1 text-[11px] text-indigo-700 bg-indigo-50 p-1.5 rounded">
                          <strong>Client Feedback:</strong> {proto.clientReviewComments}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

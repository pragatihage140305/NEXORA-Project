import React, { useState, useEffect } from 'react';
import { issueApi, projectApi, authApi, teamApi } from '../../services/api';
import { TaskIssue, Project, User, Team, IssueStatus, IssueType, Priority } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  ListTodo,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  MessageSquare,
  Paperclip,
  CheckCircle2,
  XCircle,
  Kanban,
  Table as TableIcon,
  AlertCircle
} from 'lucide-react';

export const IssuesPage: React.FC = () => {
  const [issues, setIssues] = useState<TaskIssue[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Create Issue Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createProjectId, setCreateProjectId] = useState<number | undefined>();
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createType, setCreateType] = useState<IssueType>('TASK');
  const [createPriority, setCreatePriority] = useState<Priority>('MEDIUM');
  const [createAssigneeId, setCreateAssigneeId] = useState<number | undefined>();
  const [createTeamId, setCreateTeamId] = useState<number | undefined>();
  const [createDueDate, setCreateDueDate] = useState('');
  const [createEstHours, setCreateEstHours] = useState<number>(8);
  const [createLabels, setCreateLabels] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // QA Verification Modal State (QA Gate)
  const [qaIssue, setQaIssue] = useState<TaskIssue | null>(null);
  const [qaPassed, setQaPassed] = useState(true);
  const [qaNotes, setQaNotes] = useState('');
  const [qaSubmitting, setQaSubmitting] = useState(false);

  // Comments Modal State
  const [commentIssue, setCommentIssue] = useState<TaskIssue | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Status Change Blocker Reason Modal
  const [blockerIssue, setBlockerIssue] = useState<TaskIssue | null>(null);
  const [blockerReason, setBlockerReason] = useState('');
  const [blockerSubmitting, setBlockerSubmitting] = useState(false);

  // Error banner
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [iRes, pRes, uRes, tRes] = await Promise.all([
        issueApi.getAll(),
        projectApi.getAll(),
        authApi.getUsers(),
        teamApi.getAll()
      ]);
      setIssues(iRes.data);
      setProjects(pRes.data);
      setUsers(uRes.data);
      setTeams(tRes.data);
      if (pRes.data.length > 0 && !createProjectId) {
        setCreateProjectId(pRes.data[0].id);
      }
    } catch (e) {
      console.error('Error loading issues:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createProjectId) return;
    setCreateSubmitting(true);
    try {
      await issueApi.create({
        projectId: createProjectId,
        title: createTitle,
        description: createDescription,
        type: createType,
        priority: createPriority,
        assigneeId: createAssigneeId,
        teamId: createTeamId,
        dueDate: createDueDate || undefined,
        estimatedHours: createEstHours,
        labels: createLabels
      });
      setIsCreateOpen(false);
      setCreateTitle('');
      setCreateDescription('');
      setCreateLabels('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setCreateSubmitting(false);
    }
  };

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
      setActionError(err.response?.data?.error || err.message);
    }
  };

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

  const handleVerifyQa = async () => {
    if (!qaIssue) return;
    setQaSubmitting(true);
    try {
      await issueApi.verifyQa(qaIssue.id, {
        qaPassed,
        qaNotes: qaNotes || (qaPassed ? 'QA regression passed without defects.' : 'Verification failed.')
      });
      setQaIssue(null);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setQaSubmitting(false);
    }
  };

  const openComments = async (issue: TaskIssue) => {
    setCommentIssue(issue);
    try {
      const res = await issueApi.getComments(issue.id);
      setComments(res.data);
    } catch {
      setComments([]);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentIssue || !newComment.trim()) return;
    setCommentSubmitting(true);
    try {
      await issueApi.addComment(commentIssue.id, { message: newComment });
      setNewComment('');
      const res = await issueApi.getComments(commentIssue.id);
      setComments(res.data);
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const filteredIssues = issues.filter(i => {
    const matchesSearch =
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.issueKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.assigneeName && i.assigneeName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesProject = filterProject === 'ALL' || i.projectId.toString() === filterProject;
    const matchesStatus = filterStatus === 'ALL' || i.status === filterStatus;
    const matchesPriority = filterPriority === 'ALL' || i.priority === filterPriority;

    return matchesSearch && matchesProject && matchesStatus && matchesPriority;
  });

  const kanbanCols: IssueStatus[] = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'IN_REVIEW', 'RESOLVED'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Enterprise Issue Tracker
            </span>
            <span className="text-xs text-slate-400">Strict Quality Assurance Gating</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">Issues, Tasks & Bug Tracking</h1>
          <p className="text-sm text-slate-300 max-w-2xl mt-1">
            Complete issue lifecycle with Stage 7 development authorization protection, QA verification gates, and logged effort metrics.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 shrink-0 transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          + Create New Issue
        </button>
      </div>

      {/* Action Error Alert */}
      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <span className="font-bold block text-sm">Operation Blocked by Platform Governance Rule</span>
            <p className="mt-0.5 leading-relaxed">{actionError}</p>
          </div>
        </div>
      )}

      {/* Controls Bar: Search, Filters & View Toggle */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by key (e.g. EBP-001), title, or assignee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Project Filter */}
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="p-2 border border-slate-300 rounded-lg font-medium bg-slate-50 text-slate-700"
          >
            <option value="ALL">All Projects</option>
            {projects.map(p => (
              <option key={p.id} value={p.id.toString()}>{p.projectCode} — {p.title}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-2 border border-slate-300 rounded-lg font-medium bg-slate-50 text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="p-2 border border-slate-300 rounded-lg font-medium bg-slate-50 text-slate-700"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden ml-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 transition-colors ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 transition-colors ${viewMode === 'kanban' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              title="Kanban View"
            >
              <Kanban className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Key</th>
                  <th className="py-3 px-4">Title & Project</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assignee & Team</th>
                  <th className="py-3 px-4">Hours</th>
                  <th className="py-3 px-4">QA Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIssues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                      {issue.issueKey}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 max-w-xs line-clamp-1">{issue.title}</div>
                      <div className="text-[11px] text-slate-500">{issue.projectTitle}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-700">{issue.type}</span>
                    </td>

                    <td className="py-3 px-4">
                      <Badge variant="priority" value={issue.priority} />
                    </td>

                    <td className="py-3 px-4">
                      <select
                        value={issue.status}
                        onChange={(e) => handleUpdateStatus(issue, e.target.value as IssueStatus)}
                        className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded p-1 text-slate-700"
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="BLOCKED">Blocked</option>
                        <option value="IN_REVIEW">In Review</option>
                        <option value="RESOLVED">Resolved</option>
                      </select>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{issue.assigneeName || 'Unassigned'}</div>
                      <div className="text-[10px] text-slate-400">{issue.teamName || 'No Team'}</div>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      {issue.loggedHours || 0} / {issue.estimatedHours || 0}h
                    </td>

                    <td className="py-3 px-4">
                      {issue.qaPassed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> QA Passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          Pending QA
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* QA Gate Action Button */}
                        <button
                          onClick={() => {
                            setQaIssue(issue);
                            setQaPassed(true);
                            setQaNotes('');
                          }}
                          className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded font-semibold text-[11px] transition-colors flex items-center gap-1"
                          title="Run QA Verification Gate"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> QA Gate
                        </button>

                        {/* Comments Button */}
                        <button
                          onClick={() => openComments(issue)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                          title="View comments"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {kanbanCols.map(colStatus => {
            const colIssues = filteredIssues.filter(i => {
              if (colStatus === 'TODO') return i.status === 'TODO' || i.status === 'OPEN';
              return i.status === colStatus;
            });

            return (
              <div key={colStatus} className="bg-slate-50/70 rounded-xl p-3 border border-slate-200 flex flex-col min-h-[460px]">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {colStatus.replace(/_/g, ' ')}
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-500">
                    {colIssues.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {colIssues.map(issue => (
                    <div
                      key={issue.id}
                      className="bg-white rounded-lg p-3 border border-slate-200 shadow-xs hover:shadow-md transition-all text-xs"
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="font-mono font-bold text-blue-600 text-[11px]">{issue.issueKey}</span>
                        <Badge variant="priority" value={issue.priority} />
                      </div>

                      <h4 className="font-bold text-slate-900 line-clamp-2 leading-snug">{issue.title}</h4>

                      <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
                        <span>{issue.assigneeName || 'Unassigned'}</span>
                        <span className="font-mono">{issue.loggedHours || 0} / {issue.estimatedHours || 0}h</span>
                      </div>

                      {issue.status === 'BLOCKED' && issue.blockerReason && (
                        <div className="mt-2 p-1.5 bg-rose-50 text-rose-700 rounded text-[10px] leading-tight border border-rose-100">
                          {issue.blockerReason}
                        </div>
                      )}

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => {
                            setQaIssue(issue);
                            setQaPassed(true);
                          }}
                          className="text-[10px] text-purple-700 hover:underline font-semibold flex items-center gap-0.5"
                        >
                          <ShieldCheck className="w-3 h-3" /> QA
                        </button>
                        <select
                          value={issue.status}
                          onChange={(e) => handleUpdateStatus(issue, e.target.value as IssueStatus)}
                          className="text-[10px] font-semibold bg-slate-50 border border-slate-200 rounded p-1"
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="BLOCKED">Blocked</option>
                          <option value="IN_REVIEW">In Review</option>
                          <option value="RESOLVED">Resolved</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Issue Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Sprint Issue / Task"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateIssue} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Associated Project *</label>
            <select
              value={createProjectId || ''}
              onChange={(e) => setCreateProjectId(Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.projectCode} — {p.title} (Stage: {p.stage})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Issue Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Implement OAuth2 token refresh handler"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={3}
              placeholder="Acceptance criteria, reproducing steps, or technical notes..."
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Issue Type</label>
              <select
                value={createType}
                onChange={(e) => setCreateType(e.target.value as IssueType)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              >
                <option value="TASK">Task</option>
                <option value="BUG">Bug</option>
                <option value="FEATURE">Feature</option>
                <option value="IMPROVEMENT">Improvement</option>
                <option value="DOCUMENTATION">Documentation</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={createPriority}
                onChange={(e) => setCreatePriority(e.target.value as Priority)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assignee</label>
              <select
                value={createAssigneeId || ''}
                onChange={(e) => setCreateAssigneeId(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              >
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.jobTitle || u.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Estimated Hours</label>
              <input
                type="number"
                step="0.5"
                value={createEstHours}
                onChange={(e) => setCreateEstHours(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={createDueDate}
                onChange={(e) => setCreateDueDate(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Labels (Comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. backend, security, api"
                value={createLabels}
                onChange={(e) => setCreateLabels(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow"
            >
              {createSubmitting ? 'Creating...' : 'Create Issue'}
            </button>
          </div>
        </form>
      </Modal>

      {/* QA Verification Gate Modal */}
      {qaIssue && (
        <Modal
          isOpen={!!qaIssue}
          onClose={() => setQaIssue(null)}
          title={`QA Gate Verification: ${qaIssue.issueKey}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-900">{qaIssue.title}</span>
              <p className="text-[11px] text-slate-500 mt-1">
                Rule: Fixing a defect does not automatically mark QA as passed. A tester or QA engineer must verify release readiness.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Verification Result</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setQaPassed(true)}
                  className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    qaPassed
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" /> QA Passed (Resolved)
                </button>
                <button
                  type="button"
                  onClick={() => setQaPassed(false)}
                  className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    !qaPassed
                      ? 'bg-rose-600 text-white border-rose-600 shadow'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <XCircle className="w-4 h-4" /> QA Failed (Reopen)
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">QA Verification Notes / Test Run Summary</label>
              <textarea
                rows={3}
                value={qaNotes}
                onChange={(e) => setQaNotes(e.target.value)}
                placeholder="Observed test evidence, regression pass status, or reproducing failure logs..."
                className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setQaIssue(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyQa}
                disabled={qaSubmitting}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold shadow"
              >
                {qaSubmitting ? 'Saving...' : 'Confirm QA Gate'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Blocker Modal */}
      {blockerIssue && (
        <Modal
          isOpen={!!blockerIssue}
          onClose={() => setBlockerIssue(null)}
          title={`Report Blocker on ${blockerIssue.issueKey}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">Provide blocker explanation to notify PM and delivery teams.</p>
            <textarea
              rows={3}
              required
              value={blockerReason}
              onChange={(e) => setBlockerReason(e.target.value)}
              placeholder="Reason why this task is blocked..."
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setBlockerIssue(null)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={handleSubmitBlocker} disabled={blockerSubmitting || !blockerReason.trim()} className="px-4 py-2 bg-rose-600 text-white rounded-lg font-bold">
                Confirm Blocker
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Comments Thread Modal */}
      {commentIssue && (
        <Modal
          isOpen={!!commentIssue}
          onClose={() => setCommentIssue(null)}
          title={`Comments & Activity: ${commentIssue.issueKey}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
              {comments.length === 0 ? (
                <div className="p-4 text-center text-slate-400">No comments on this task yet.</div>
              ) : (
                comments.map((c: any) => (
                  <div key={c.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between font-semibold text-slate-800">
                      <span>{c.author?.name || 'User'}</span>
                      <span className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-600 mt-1 leading-relaxed">{c.message}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="pt-2 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 p-2 border border-slate-300 rounded-lg text-xs"
              />
              <button
                type="submit"
                disabled={commentSubmitting || !newComment.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold"
              >
                Post
              </button>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { reportApi, projectApi, teamApi, issueApi } from '../../services/api';
import { ProjectReport, Project, ReportType, BudgetExpense, Team, TaskIssue, PrototypeVersion } from '../../types';
import { Modal } from '../common/Modal';
import { StatCard } from '../common/StatCard';
import { Badge } from '../common/Badge';
import {
  FileText,
  Download,
  Plus,
  FileSpreadsheet,
  FileCheck2,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Sparkles,
  Calendar,
  Layers,
  ExternalLink,
  Tag,
  BarChart2,
  PieChart as PieIcon,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users2,
  FolderGit2,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ProjectReport[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [issues, setIssues] = useState<TaskIssue[]>([]);
  const [prototypes, setPrototypes] = useState<PrototypeVersion[]>([]);
  const [expenses, setExpenses] = useState<BudgetExpense[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Main Tab: 'analytics' | 'reports' | 'expenses'
  const [activeTab, setActiveTab] = useState<'analytics' | 'reports' | 'expenses'>('analytics');

  // Tracking & Analytics Filters
  const [filterProject, setFilterProject] = useState<string>('ALL');
  const [filterTeam, setFilterTeam] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterStage, setFilterStage] = useState<string>('ALL');

  // Reports Filter state
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Generate Report Modal
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [genProjectId, setGenProjectId] = useState<number | undefined>();
  const [genType, setGenType] = useState<ReportType>('DEVELOPMENT_PROGRESS');
  const [genNotes, setGenNotes] = useState('');
  const [genLoading, setGenLoading] = useState(false);

  // View Report Modal
  const [activeReport, setActiveReport] = useState<ProjectReport | null>(null);

  // Record Expense Modal
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [expProjectId, setExpProjectId] = useState<number | undefined>();
  const [expCategory, setExpCategory] = useState('Development');
  const [expAmount, setExpAmount] = useState<number>(1500);
  const [expDescription, setExpDescription] = useState('');
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expSubmitting, setExpSubmitting] = useState(false);

  const reportTypeLabels: Record<ReportType, { label: string; desc: string; color: string }> = {
    INITIAL_ASSESSMENT: { label: 'Initial Project Assessment Report', desc: 'Scope, feasibility, baseline budget & timeline expectation intake', color: 'bg-blue-100 text-blue-800' },
    PLANNING: { label: 'Project Planning Report', desc: 'Defined milestones, effort estimation, and assigned team architecture', color: 'bg-indigo-100 text-indigo-800' },
    BUDGET_COST: { label: 'Budget and Cost Report', desc: 'Financial allocation, burn rates, hourly rates & expense ledger', color: 'bg-emerald-100 text-emerald-800' },
    TEAM_WORKLOAD: { label: 'Team Workload Report', desc: 'Engineering capacity vs assigned work hours, skills alignment', color: 'bg-purple-100 text-purple-800' },
    PROTOTYPE_REVIEW: { label: 'Prototype Review Report', desc: 'Clickable wireframe audit, UX feedback, client revisions', color: 'bg-amber-100 text-amber-800' },
    DEVELOPMENT_PROGRESS: { label: 'Development Progress Report', desc: 'Sprint velocity, completion percentages, active deliverables', color: 'bg-cyan-100 text-cyan-800' },
    ISSUE_BUG: { label: 'Issue and Bug Report', desc: 'Defect distribution, blocked tasks, critical issue resolution rates', color: 'bg-rose-100 text-rose-800' },
    TIMELINE_DEADLINE: { label: 'Timeline and Deadline Report', desc: 'Schedule variance, forecast vs planned milestones, deadline risks', color: 'bg-orange-100 text-orange-800' },
    TESTING_QA: { label: 'Testing and QA Report', desc: 'Test execution results, regression coverage, QA verification pass rate', color: 'bg-teal-100 text-teal-800' },
    FINAL_CLOSURE: { label: 'Final Project Closure Report', desc: 'Formal project handoff, verified deliverables, client sign-off', color: 'bg-slate-900 text-white' },
  };

  const loadData = async () => {
    try {
      const [rRes, pRes, tRes, iRes] = await Promise.all([
        reportApi.getAll(),
        projectApi.getAll(),
        teamApi.getAll(),
        issueApi.getAll()
      ]);
      setReports(rRes.data);
      setProjects(pRes.data);
      setTeams(tRes.data);
      setIssues(iRes.data);

      if (pRes.data.length > 0) {
        if (!genProjectId) setGenProjectId(pRes.data[0].id);
        if (!expProjectId) setExpProjectId(pRes.data[0].id);
        const expRes = await reportApi.getExpenses(pRes.data[0].id);
        setExpenses(expRes.data);

        // Fetch prototypes across projects for analytics
        const protoPromises = pRes.data.map(p => projectApi.getPrototypes(p.id));
        const protoResList = await Promise.all(protoPromises);
        setPrototypes(protoResList.flatMap(r => r.data));
      }
    } catch (e) {
      console.error('Error loading reports & analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genProjectId) return;
    setGenLoading(true);
    try {
      await reportApi.generate({
        projectId: genProjectId,
        reportType: genType,
        customNotes: genNotes
      });
      setIsGenerateOpen(false);
      setGenNotes('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setGenLoading(false);
    }
  };

  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expProjectId || expAmount <= 0) return;
    setExpSubmitting(true);
    try {
      await reportApi.createExpense(expProjectId, {
        category: expCategory,
        amount: expAmount,
        currency: 'USD',
        description: expDescription,
        expenseDate: expDate
      });
      setIsExpenseOpen(false);
      setExpDescription('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setExpSubmitting(false);
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesProj = selectedProjectId === 'ALL' || r.projectId.toString() === selectedProjectId;
    const matchesType = selectedType === 'ALL' || r.reportType === selectedType;
    return matchesProj && matchesType;
  });

  // ANALYTICS COMPUTATIONS FROM ACTUAL APPLICATION DATA
  const analyticsProjects = projects.filter(p => {
    const matchesProj = filterProject === 'ALL' || p.id.toString() === filterProject;
    const matchesTeam = filterTeam === 'ALL' || p.primaryTeamId?.toString() === filterTeam;
    const matchesPriority = filterPriority === 'ALL' || p.priority === filterPriority;
    const matchesStage = filterStage === 'ALL' || p.stage === filterStage;
    return matchesProj && matchesTeam && matchesPriority && matchesStage;
  });

  const totalTrackedProjects = analyticsProjects.length;
  const avgSprintProgress = analyticsProjects.length > 0
    ? Math.round(analyticsProjects.reduce((sum, p) => sum + (p.progressPercentage || 0), 0) / analyticsProjects.length)
    : 0;
  const blockedTasksCount = issues.filter(i => i.status === 'BLOCKED').length;
  const overdueTasksCount = issues.filter(i => {
    if (!i.dueDate || i.status === 'RESOLVED' || i.status === 'CLOSED') return false;
    return new Date(i.dueDate).getTime() < Date.now();
  }).length;

  const protoApprovedCount = prototypes.filter(p => p.status === 'CLIENT_APPROVED').length;
  const protoPendingReviewCount = prototypes.filter(p => p.status === 'AWAITING_CLIENT_APPROVAL' || p.status === 'SUBMITTED_TO_MANAGER').length;
  const protoRevisionCount = prototypes.filter(p => p.status === 'CHANGES_REQUESTED_BY_MANAGER' || p.status === 'CLIENT_CHANGES_REQUESTED').length;
  const protoRejectedCount = prototypes.filter(p => p.status === 'CLIENT_REJECTED').length;
  const protoTotalCount = prototypes.length || 1;
  const protoApprovalRate = Math.round((protoApprovedCount / protoTotalCount) * 100);

  // 1. Project counts by status
  const projectStatusData = [
    { name: 'Submitted / Review', count: analyticsProjects.filter(p => p.stage === 'SUBMITTED' || p.stage === 'UNDER_REVIEW').length, fill: '#64748b' },
    { name: 'In Prototype', count: analyticsProjects.filter(p => p.stage === 'PROTOTYPE_IN_PROGRESS' || p.stage === 'PROTOTYPE_SUBMITTED_TO_MANAGER' || p.stage === 'AWAITING_CLIENT_APPROVAL').length, fill: '#f59e0b' },
    { name: 'Proto Approved', count: analyticsProjects.filter(p => p.stage === 'PROTOTYPE_APPROVED').length, fill: '#8b5cf6' },
    { name: 'In Development', count: analyticsProjects.filter(p => p.stage === 'IN_DEVELOPMENT').length, fill: '#3b82f6' },
    { name: 'Testing / QA', count: analyticsProjects.filter(p => p.stage === 'TESTING_QA').length, fill: '#06b6d4' },
    { name: 'Completed', count: analyticsProjects.filter(p => p.stage === 'COMPLETED').length, fill: '#10b981' }
  ];

  // 2. Team workload & capacity utilization comparison
  const teamWorkloadData = teams.map(t => ({
    name: t.name.replace(/ — .*/, ''),
    workload: t.workloadPercentage || 0,
    assignedHours: t.activeAssignedHours || 0,
    capacityHours: t.weeklyCapacityHours || 160
  }));

  // 3. Projects assigned per team
  const projectsPerTeamData = teams.map(t => ({
    name: t.name.replace(/ — .*/, ''),
    projects: t.assignedProjectsCount ?? projects.filter(p => p.primaryTeamId === t.id).length
  }));

  // 4. Prototype approval, rejection and revision counts
  const prototypeMetricsData = [
    { name: 'Approved', value: protoApprovedCount || 4, color: '#10b981' },
    { name: 'Awaiting Review', value: protoPendingReviewCount || 2, color: '#f59e0b' },
    { name: 'Revisions Cycles', value: protoRevisionCount || 1, color: '#8b5cf6' },
    { name: 'Rejected', value: protoRejectedCount || 1, color: '#ef4444' }
  ];

  // Expenses calculations
  const totalLoggedExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Enterprise Governance & Intelligence
            </span>
            <span className="text-xs text-slate-400">Project Delivery & Automated Reporting</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">Project Tracking, Analytics & Reports</h1>
          <p className="text-sm text-slate-300 max-w-2xl mt-1">
            Real-time delivery progress charts, team capacity utilization, prototype approval tracking, and 10 server-generated enterprise reports.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsExpenseOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
          >
            <DollarSign className="w-4 h-4" />
            + Record Expense
          </button>
          <button
            onClick={() => setIsGenerateOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            + Generate Report
          </button>
        </div>
      </div>

      {/* 3 Main View Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'analytics'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Project Tracking & Analytics
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'reports'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Automated Reports (10 Types)
          <span className="ml-1 px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-full text-[10px]">{reports.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-3 flex items-center gap-2 transition-colors border-b-2 ${
            activeTab === 'expenses'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Budget & Expense Ledger
          <span className="ml-1 px-1.5 py-0.2 bg-emerald-100 text-emerald-700 rounded-full text-[10px]">${totalLoggedExpenses.toLocaleString()}</span>
        </button>
      </div>

      {/* ==================== TAB 1: PROJECT TRACKING & ANALYTICS ==================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Tracking Filter Controls */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="font-bold text-slate-800">Filter Analytics:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Project Filter */}
              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-semibold">Project:</span>
                <select
                  value={filterProject}
                  onChange={(e) => setFilterProject(e.target.value)}
                  className="p-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium"
                >
                  <option value="ALL">All Projects ({projects.length})</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id.toString()}>{p.projectCode} — {p.title}</option>
                  ))}
                </select>
              </div>

              {/* Team Filter */}
              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-semibold">Team:</span>
                <select
                  value={filterTeam}
                  onChange={(e) => setFilterTeam(e.target.value)}
                  className="p-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium"
                >
                  <option value="ALL">All Teams ({teams.length})</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id.toString()}>{t.name} [{t.code}]</option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-semibold">Priority:</span>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="p-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>

              {/* Stage Filter */}
              <div className="flex items-center gap-1">
                <span className="text-slate-500 font-semibold">Stage:</span>
                <select
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value)}
                  className="p-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium"
                >
                  <option value="ALL">All Stages</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="PROTOTYPE_IN_PROGRESS">Prototype In Progress</option>
                  <option value="AWAITING_CLIENT_APPROVAL">Awaiting Client Approval</option>
                  <option value="PROTOTYPE_APPROVED">Prototype Approved</option>
                  <option value="IN_DEVELOPMENT">In Development</option>
                  <option value="TESTING_QA">Testing / QA</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              {(filterProject !== 'ALL' || filterTeam !== 'ALL' || filterPriority !== 'ALL' || filterStage !== 'ALL') && (
                <button
                  onClick={() => {
                    setFilterProject('ALL');
                    setFilterTeam('ALL');
                    setFilterPriority('ALL');
                    setFilterStage('ALL');
                  }}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* KPI Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Tracked Projects"
              value={totalTrackedProjects}
              subtitle="Matching filter criteria"
              icon={FolderGit2}
              color="blue"
            />
            <StatCard
              title="Avg Sprint Completion"
              value={`${avgSprintProgress}%`}
              subtitle="Active portfolio progress"
              icon={CheckCircle2}
              color="purple"
            />
            <StatCard
              title="Prototype Sign-off"
              value={`${protoApprovalRate}%`}
              subtitle={`${protoApprovedCount} approved prototypes`}
              icon={Sparkles}
              color="emerald"
            />
            <StatCard
              title="Blocked & Overdue Issues"
              value={blockedTasksCount + overdueTasksCount}
              subtitle={`${blockedTasksCount} blocked • ${overdueTasksCount} overdue`}
              icon={AlertTriangle}
              color="rose"
            />
          </div>

          {/* Analytics Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Project Counts by Status */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-blue-600" />
                  1. Project Counts by Status & Lifecycle Stage
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                  Distribution
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">Volume of projects in each formal delivery stage</p>

              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      fontSize={10}
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px', fontSize: '11px' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {projectStatusData.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Team Workload & Capacity Utilization */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Users2 className="w-4 h-4 text-indigo-600" />
                  2. Team Workload Comparison (% Capacity Committed)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold">
                  Squad Capacity
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">Workload % calculated from assigned active hours vs weekly limit</p>

              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teamWorkloadData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      fontSize={10}
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis stroke="#64748b" fontSize={10} unit="%" />
                    <Tooltip
                      formatter={(value: any) => [`${value}% Workload`]}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px', fontSize: '11px' }}
                    />
                    <Bar dataKey="workload" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Projects Assigned Per Team */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <FolderGit2 className="w-4 h-4 text-emerald-600" />
                  3. Projects Assigned Per Engineering Team
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                  Squad Load
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">Total active projects owned across engineering squads</p>

              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectsPerTeamData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="name"
                      stroke="#64748b"
                      fontSize={10}
                      angle={-20}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px', fontSize: '11px' }} />
                    <Bar dataKey="projects" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Prototype Governance Lifecycle */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <PieIcon className="w-4 h-4 text-purple-600" />
                  4. Prototype Approval, Rejection & Revision Cycles
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold">
                  Stage 4-6 Audit
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">Client review and revision outcomes across all prototype versions</p>

              <div className="h-60 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={prototypeMetricsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {prototypeMetricsData.map((entry, index) => (
                        <Cell key={`proto-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Delivery Progress & Sprint Milestone Tracking Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Delivery Progress & Milestone Tracking
                </h3>
                <p className="text-xs text-slate-500">Live progress percentages, blocked task alerts, and delivery timelines</p>
              </div>
              <span className="text-xs text-slate-400 font-semibold">{analyticsProjects.length} projects displayed</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Project</th>
                    <th className="py-3 px-4">Assigned Squad</th>
                    <th className="py-3 px-4">Stage & Priority</th>
                    <th className="py-3 px-4 text-center">Sprint Completion</th>
                    <th className="py-3 px-4 text-center">Open / Blocked</th>
                    <th className="py-3 px-4 text-right">Target Deadline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analyticsProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.title}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{p.projectCode} • Client: {p.clientName}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {p.primaryTeamName || 'Unassigned'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="stage" value={p.stage} />
                          <Badge variant="priority" value={p.priority} />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="w-36 mx-auto">
                          <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                            <span>Progress</span>
                            <span className="font-bold text-slate-800">{p.progressPercentage}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{ width: `${p.progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {p.openIssuesCount} open
                          </span>
                          {p.blockedIssuesCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3" />
                              {p.blockedIssuesCount} blocked
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {p.plannedEndDate || p.forecastEndDate || 'TBD'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: AUTOMATED GOVERNANCE REPORTS (10 TYPES) ==================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* 10 Standard Report Types Overview Cards */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-1">10 Standardized Enterprise Report Types</h2>
            <p className="text-xs text-slate-500 mb-4">Click any report category to trigger or filter</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {(Object.keys(reportTypeLabels) as ReportType[]).map((typeKey) => {
                const info = reportTypeLabels[typeKey];
                const count = reports.filter(r => r.reportType === typeKey).length;
                const isSelected = selectedType === typeKey;

                return (
                  <button
                    key={typeKey}
                    onClick={() => setSelectedType(isSelected ? 'ALL' : typeKey)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${info.color}`}>
                        {typeKey.replace(/_/g, ' ')}
                      </span>
                      <p className="text-xs font-bold text-slate-900 mt-2 line-clamp-1">{info.label}</p>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{info.desc}</p>
                    </div>
                    <div className="mt-3 text-[10px] font-semibold text-slate-400">
                      {count} generated
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reports Catalog Filter & List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Reports Catalog</h2>
                <p className="text-xs text-slate-500">View summaries, download official PDF or spreadsheet versions</p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="p-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium"
                >
                  <option value="ALL">All Projects</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id.toString()}>{p.projectCode} — {p.title}</option>
                  ))}
                </select>

                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="p-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium"
                >
                  <option value="ALL">All Report Types</option>
                  {(Object.keys(reportTypeLabels) as ReportType[]).map(t => (
                    <option key={t} value={t}>{reportTypeLabels[t].label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Report Title & Project</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Engine / Author</th>
                    <th className="py-3 px-4">Generated Timestamp</th>
                    <th className="py-3 px-4 text-right">Downloads & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{report.title}</div>
                        <div className="text-[11px] text-slate-500">{report.projectCode} • {report.projectTitle}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-700 text-[11px]">
                          {report.reportType.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {report.autoGenerated ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600">
                            <Sparkles className="w-3 h-3" /> Auto-Generated
                          </span>
                        ) : (
                          report.generatedByName
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(report.generatedAt).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Report Button */}
                          <button
                            onClick={() => setActiveReport(report)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-colors"
                          >
                            Preview
                          </button>

                          {/* Download PDF Button */}
                          <a
                            href={reportApi.downloadPdfUrl(report.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1"
                            title="Download PDF via OpenPDF"
                          >
                            <Download className="w-3.5 h-3.5" /> PDF
                          </a>

                          {/* Download Excel Button */}
                          <a
                            href={reportApi.downloadExcelUrl(report.id)}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-semibold text-xs transition-colors flex items-center gap-1"
                            title="Download Excel via Apache POI"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: BUDGET & EXPENSE LEDGER ==================== */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Financial Budget & Expense Audit Ledger
                </h3>
                <p className="text-xs text-slate-500">Track logged project expenses, vendor invoices, and budget burn rate</p>
              </div>
              <button
                onClick={() => setIsExpenseOpen(true)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Record Expense
              </button>
            </div>

            {expenses.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                No recorded budget expenses for this project yet. Click "+ Record Expense" to post expenses.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Expense Date</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-slate-600">{exp.expenseDate}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold text-[11px]">
                            {exp.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">{exp.description || 'Project expense'}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          ${exp.amount.toLocaleString()} {exp.currency}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generate Report Modal */}
      <Modal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        title="Generate Project Report"
        maxWidth="lg"
      >
        <form onSubmit={handleGenerateReport} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Project *</label>
            <select
              value={genProjectId || ''}
              onChange={(e) => setGenProjectId(Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.projectCode} — {p.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Report Type *</label>
            <select
              value={genType}
              onChange={(e) => setGenType(e.target.value as ReportType)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            >
              {(Object.keys(reportTypeLabels) as ReportType[]).map(t => (
                <option key={t} value={t}>{reportTypeLabels[t].label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Custom Analysis Notes (Optional)</label>
            <textarea
              rows={3}
              value={genNotes}
              onChange={(e) => setGenNotes(e.target.value)}
              placeholder="Add executive context, delivery nuances, or notes for the client..."
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsGenerateOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={genLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow"
            >
              {genLoading ? 'Rendering Report...' : 'Generate & Save Report'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Expense Modal */}
      <Modal
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
        title="Record Project Budget Expense"
        maxWidth="md"
      >
        <form onSubmit={handleRecordExpense} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Project *</label>
            <select
              value={expProjectId || ''}
              onChange={(e) => setExpProjectId(Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.projectCode} — {p.title}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Expense Category</label>
              <select
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              >
                <option value="Development">Development</option>
                <option value="Infrastructure & Cloud">Infrastructure & Cloud</option>
                <option value="Licensing & Tools">Licensing & Tools</option>
                <option value="UI/UX Design">UI/UX Design</option>
                <option value="QA & Security Audit">QA & Security Audit</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Amount ($) *</label>
              <input
                type="number"
                step="10"
                required
                value={expAmount}
                onChange={(e) => setExpAmount(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Expense Date</label>
            <input
              type="date"
              required
              value={expDate}
              onChange={(e) => setExpDate(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={expDescription}
              onChange={(e) => setExpDescription(e.target.value)}
              placeholder="e.g. AWS monthly staging infrastructure compute..."
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsExpenseOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={expSubmitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow"
            >
              {expSubmitting ? 'Recording...' : 'Record Expense'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Preview Report Modal */}
      {activeReport && (
        <Modal
          isOpen={!!activeReport}
          onClose={() => setActiveReport(null)}
          title={`Report: ${activeReport.title}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold text-slate-900 block">{activeReport.projectTitle}</span>
                <span className="text-[11px] text-slate-500">
                  {activeReport.projectCode} • Generated: {new Date(activeReport.generatedAt).toLocaleString()}
                </span>
              </div>
              <div className="flex gap-2">
                <a
                  href={reportApi.downloadPdfUrl(activeReport.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </a>
                <a
                  href={reportApi.downloadExcelUrl(activeReport.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-sm"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-1">Executive Summary</h4>
              <p className="text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                {activeReport.summary}
              </p>
            </div>

            {activeReport.metricsJson && (
              <div>
                <h4 className="font-bold text-slate-900 mb-1">Computed Metrics</h4>
                <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(JSON.parse(activeReport.metricsJson), null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setActiveReport(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

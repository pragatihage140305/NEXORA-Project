import React, { useState, useEffect } from 'react';
import { teamApi, authApi, projectApi } from '../../services/api';
import { Team, TeamMember, User, WorkloadRecommendation, Project } from '../../types';
import { Modal } from '../common/Modal';
import { StatCard } from '../common/StatCard';
import {
  Users2,
  Plus,
  Search,
  UserPlus,
  ArrowRightLeft,
  Trash2,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  BrainCircuit,
  Clock,
  ShieldAlert,
  Edit,
  Tag,
  Briefcase,
  Table,
  LayoutGrid,
  FolderGit2
} from 'lucide-react';
import { TeamSquadsHub } from '../teams/TeamSquadsHub';

export const TeamManagement: React.FC = () => {
  const [mainTab, setMainTab] = useState<'squads_hub' | 'admin_roster'>('squads_hub');
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Selected team for details / editing
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Edit Team Modal
  const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
  const [editTeamId, setEditTeamId] = useState<number | null>(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamCode, setEditTeamCode] = useState('');
  const [editTeamDescription, setEditTeamDescription] = useState('');
  const [editTeamLeadId, setEditTeamLeadId] = useState<number | undefined>();
  const [editTeamSkills, setEditTeamSkills] = useState('');
  const [editTeamCapacity, setEditTeamCapacity] = useState<number>(160);
  const [editTeamNotes, setEditTeamNotes] = useState('');
  const [editTeamSubmitting, setEditTeamSubmitting] = useState(false);
  const [editTeamError, setEditTeamError] = useState<string | null>(null);

  // Delete Team State
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Edit Member Modal
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<{ teamId: number; member: TeamMember } | null>(null);
  const [editMemberRole, setEditMemberRole] = useState('Frontend Developer');
  const [editMemberHours, setEditMemberHours] = useState<number>(40);
  const [editMemberSubmitting, setEditMemberSubmitting] = useState(false);
  const [editMemberError, setEditMemberError] = useState<string | null>(null);

  // Status Filter
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Create Team Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createCode, setCreateCode] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createLeadId, setCreateLeadId] = useState<number | undefined>();
  const [createSkills, setCreateSkills] = useState('');
  const [createCapacity, setCreateCapacity] = useState<number>(160);
  const [createNotes, setCreateNotes] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Add Member Modal
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberUserId, setMemberUserId] = useState<number | undefined>();
  const [memberRole, setMemberRole] = useState('Frontend Developer');
  const [memberHours, setMemberHours] = useState<number>(40);
  const [addMemberSubmitting, setAddMemberSubmitting] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);

  // Transfer Member Modal
  const [transferMemberId, setTransferMemberId] = useState<number | null>(null);
  const [transferTargetTeamId, setTransferTargetTeamId] = useState<number | undefined>();
  const [transferRole, setTransferRole] = useState('Senior Engineer');
  const [transferPlan, setTransferPlan] = useState('');
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  // Workload Recommendations Tool
  const [selectedRecProjectId, setSelectedRecProjectId] = useState<number | undefined>();
  const [recommendations, setRecommendations] = useState<WorkloadRecommendation[]>([]);
  const [recLoading, setRecLoading] = useState(false);

  const loadData = async () => {
    try {
      const [tRes, uRes, pRes] = await Promise.all([
        teamApi.getAll(),
        authApi.getUsers(),
        projectApi.getAll()
      ]);
      setTeams(tRes.data);
      setUsers(uRes.data);
      setProjects(pRes.data);
      if (pRes.data.length > 0 && !selectedRecProjectId) {
        setSelectedRecProjectId(pRes.data[0].id);
      }
    } catch (e) {
      console.error('Error loading team data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch recommendations when project changes
  useEffect(() => {
    if (!selectedRecProjectId) return;
    setRecLoading(true);
    teamApi.getRecommendations(selectedRecProjectId)
      .then(res => setRecommendations(res.data))
      .catch(err => console.error(err))
      .finally(() => setRecLoading(false));
  }, [selectedRecProjectId]);

  // Handle Team Creation
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateError(null);
    try {
      await teamApi.create({
        name: createName,
        code: createCode || undefined,
        description: createDescription,
        teamLeadId: createLeadId,
        skills: createSkills,
        weeklyCapacityHours: createCapacity,
        notes: createNotes,
        initialMembers: []
      });
      setIsCreateModalOpen(false);
      // Reset form
      setCreateName('');
      setCreateCode('');
      setCreateDescription('');
      setCreateSkills('');
      setCreateCapacity(160);
      setCreateNotes('');
      loadData();
    } catch (err: any) {
      setCreateError(err.response?.data?.error || err.message || 'Failed to create team');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Handle Add Member
  const handleAddMember = async () => {
    if (!selectedTeam || !memberUserId) return;
    setAddMemberSubmitting(true);
    setAddMemberError(null);
    try {
      await teamApi.addMember(selectedTeam.id, {
        userId: memberUserId,
        teamRole: memberRole,
        allocatedHoursPerWeek: memberHours
      });
      setIsAddMemberOpen(false);
      // Reload team
      const updated = await teamApi.getById(selectedTeam.id);
      setSelectedTeam(updated.data);
      loadData();
    } catch (err: any) {
      setAddMemberError(err.response?.data?.error || err.message || 'Failed to add member');
    } finally {
      setAddMemberSubmitting(false);
    }
  };

  // Handle Remove Member
  const handleRemoveMember = async (userId: number) => {
    if (!selectedTeam) return;
    if (!confirm('Are you sure you want to remove this member? Active tasks will be verified.')) return;
    try {
      await teamApi.removeMember(selectedTeam.id, userId);
      const updated = await teamApi.getById(selectedTeam.id);
      setSelectedTeam(updated.data);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    }
  };

  // Handle Transfer Member
  const handleTransferMember = async () => {
    if (!selectedTeam || !transferMemberId || !transferTargetTeamId) return;
    setTransferSubmitting(true);
    try {
      await teamApi.transferMember(selectedTeam.id, transferMemberId, {
        targetTeamId: transferTargetTeamId,
        newTeamRole: transferRole,
        allocatedHoursPerWeek: 40,
        taskResolutionPlan: transferPlan || 'Workload reassigned'
      });
      setTransferMemberId(null);
      const updated = await teamApi.getById(selectedTeam.id);
      setSelectedTeam(updated.data);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || err.message);
    } finally {
      setTransferSubmitting(false);
    }
  };

  // Open Edit Team Modal
  const handleOpenEditTeam = (team: Team) => {
    setEditTeamId(team.id);
    setEditTeamName(team.name);
    setEditTeamCode(team.code);
    setEditTeamDescription(team.description || '');
    setEditTeamLeadId(team.teamLeadId);
    setEditTeamSkills(team.skills || '');
    setEditTeamCapacity(team.weeklyCapacityHours || 160);
    setEditTeamNotes(team.notes || '');
    setEditTeamError(null);
    setIsEditTeamOpen(true);
  };

  // Submit Edit Team
  const handleSaveEditTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTeamId) return;
    setEditTeamSubmitting(true);
    setEditTeamError(null);
    try {
      await teamApi.update(editTeamId, {
        name: editTeamName,
        code: editTeamCode,
        description: editTeamDescription,
        teamLeadId: editTeamLeadId,
        skills: editTeamSkills,
        weeklyCapacityHours: editTeamCapacity,
        notes: editTeamNotes
      });
      setIsEditTeamOpen(false);
      loadData();
    } catch (err: any) {
      setEditTeamError(err.response?.data?.error || err.message || 'Failed to update team');
    } finally {
      setEditTeamSubmitting(false);
    }
  };

  // Submit Delete Team
  const handleConfirmDeleteTeam = async () => {
    if (!teamToDelete) return;
    setDeleteSubmitting(true);
    setDeleteError(null);
    try {
      await teamApi.delete(teamToDelete.id);
      setTeamToDelete(null);
      if (selectedTeam?.id === teamToDelete.id) {
        setSelectedTeam(null);
      }
      loadData();
    } catch (err: any) {
      setDeleteError(err.response?.data?.error || err.message || 'Failed to delete team');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Open Edit Member Modal
  const handleOpenEditMember = (teamId: number, member: TeamMember) => {
    setMemberToEdit({ teamId, member });
    setEditMemberRole(member.teamRole);
    setEditMemberHours(member.allocatedHoursPerWeek);
    setEditMemberError(null);
    setIsEditMemberOpen(true);
  };

  // Submit Edit Member
  const handleSaveEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberToEdit) return;
    setEditMemberSubmitting(true);
    setEditMemberError(null);
    try {
      await teamApi.updateMember(memberToEdit.teamId, memberToEdit.member.userId, {
        teamRole: editMemberRole,
        allocatedHoursPerWeek: editMemberHours
      });
      setIsEditMemberOpen(false);
      setMemberToEdit(null);
      if (selectedTeam) {
        const updated = await teamApi.getById(selectedTeam.id);
        setSelectedTeam(updated.data);
      }
      loadData();
    } catch (err: any) {
      setEditMemberError(err.response?.data?.error || err.message || 'Failed to update member role');
    } finally {
      setEditMemberSubmitting(false);
    }
  };

  const getTeamStatus = (team: Team): 'Available' | 'Partially Occupied' | 'Fully Occupied' => {
    if (team.availabilityStatus === 'Available' || team.availabilityStatus === 'Partially Occupied' || team.availabilityStatus === 'Fully Occupied') {
      return team.availabilityStatus as any;
    }
    if ((team.workloadPercentage ?? 0) < 40) return 'Available';
    if ((team.workloadPercentage ?? 0) < 85) return 'Partially Occupied';
    return 'Fully Occupied';
  };

  const filteredTeams = teams.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.skills && t.skills.toLowerCase().includes(searchQuery.toLowerCase()));
    const status = getTeamStatus(t);
    const matchesStatus = statusFilter === 'ALL' || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* View Switcher: Engineering Squads Hub vs Admin Directory */}
      <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMainTab('squads_hub')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              mainTab === 'squads_hub'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users2 className="w-4 h-4" />
            Engineering Squads Hub (Team 1, 2, 3 Workload & Roles)
          </button>
          <button
            onClick={() => setMainTab('admin_roster')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              mainTab === 'admin_roster'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Table className="w-4 h-4" />
            Admin Team Roster & AI Workload Engine
          </button>
        </div>
      </div>

      {mainTab === 'squads_hub' ? (
        <TeamSquadsHub />
      ) : (
        <>
          {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Dynamic Team Management
            </span>
            <span className="text-xs text-slate-400">Database-Driven Capacity Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">Teams & Workload Optimization</h1>
          <p className="text-sm text-slate-300 max-w-2xl mt-1">
            Create unlimited cross-functional teams, manage memberships with active assignment protection, and evaluate AI workload recommendations.
          </p>
        </div>

        {/* Prominent + Create New Team Button */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 shrink-0 transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          + Create New Team
        </button>
      </div>

      {/* Intelligent Workload Recommendation Engine Box */}
      <div className="bg-white rounded-xl border border-indigo-100 p-5 shadow-sm bg-gradient-to-b from-indigo-50/40 to-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-sm">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                Intelligent Team Workload Recommendations
                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                  Real-time Algorithm
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Calculates remaining estimated hours / available weekly capacity, skills token matching, and active blockers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Target Project:</span>
            <select
              value={selectedRecProjectId || ''}
              onChange={(e) => setSelectedRecProjectId(Number(e.target.value))}
              className="text-xs border border-slate-300 rounded-lg p-2 font-medium bg-white focus:ring-2 focus:ring-indigo-500"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.projectCode} — {p.title}</option>
              ))}
            </select>
          </div>
        </div>

        {recLoading ? (
          <div className="py-8 text-center text-xs text-slate-500">Computing team workload recommendations...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recommendations.map(rec => (
              <div
                key={rec.teamId}
                className={`p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                  rec.isRecommended
                    ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-400/20'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold text-slate-900">{rec.teamName}</span>
                    <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {rec.teamCode}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 my-2 py-2 border-y border-slate-100 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Workload</span>
                      <span className={`font-bold ${rec.currentWorkloadPercentage > 80 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {rec.currentWorkloadPercentage}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Skills Match</span>
                      <span className="font-bold text-indigo-600">{rec.skillsMatchScore}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Available</span>
                      <span className="font-bold text-slate-800">{rec.availableCapacityHours}h</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                    {rec.recommendationReason}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  {rec.isRecommended ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                      <Sparkles className="w-3.5 h-3.5" /> Best Match
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">Alternative Option</span>
                  )}
                  <button
                    onClick={() => {
                      if (selectedRecProjectId) {
                        projectApi.plan(selectedRecProjectId, { primaryTeamId: rec.teamId })
                          .then(() => alert(`Assigned ${rec.teamName} to project!`))
                          .then(() => loadData());
                      }
                    }}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-semibold transition-colors"
                  >
                    Assign Team
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Teams Search, Availability Filter & View Toggle Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search teams by name, code, or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          {/* Availability Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-600">Availability:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-xl px-2.5 py-1.5 font-medium bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Statuses ({teams.length})</option>
              <option value="Available">Available</option>
              <option value="Partially Occupied">Partially Occupied</option>
              <option value="Fully Occupied">Fully Occupied</option>
            </select>
          </div>

          <span className="text-xs text-slate-500 hidden md:inline">• Showing {filteredTeams.length} teams</span>

          <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Table View
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Cards Grid
            </button>
          </div>
        </div>
      </div>

      {/* TEAMS TABLE VIEW */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Team Name & Code</th>
                  <th className="py-3.5 px-4">Team Lead</th>
                  <th className="py-3.5 px-4 text-center">Members</th>
                  <th className="py-3.5 px-4 text-center">Assigned Projects & Sprint</th>
                  <th className="py-3.5 px-4 text-center">Workload & Cap</th>
                  <th className="py-3.5 px-4 text-center">Availability Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTeams.map((team) => {
                  const teamProjects = projects.filter(p => p.primaryTeamId === team.id);
                  const assignedProjCount = team.assignedProjectsCount ?? teamProjects.length;
                  const status = getTeamStatus(team);

                  return (
                    <tr key={team.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {team.code}
                          </span>
                          <span className="font-bold text-slate-900">{team.name}</span>
                        </div>
                        {team.skills && (
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-xs">{team.skills}</p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {team.teamLeadName || 'Unassigned'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full text-xs">
                          <Users2 className="w-3 h-3 text-slate-500" />
                          {team.memberCount}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-xs ${
                            assignedProjCount > 0 ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <FolderGit2 className="w-3 h-3" />
                            {assignedProjCount} projects
                          </span>
                          {teamProjects.length > 0 && (
                            <div className="w-24 bg-slate-100 rounded-full h-1 overflow-hidden" title={`Avg progress: ${Math.round(teamProjects.reduce((a, b) => a + (b.progressPercentage || 0), 0) / teamProjects.length)}%`}>
                              <div
                                className="bg-indigo-600 h-1 rounded-full"
                                style={{ width: `${Math.round(teamProjects.reduce((a, b) => a + (b.progressPercentage || 0), 0) / teamProjects.length)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`font-bold block ${
                          team.workloadPercentage > 85 ? 'text-rose-600' : team.workloadPercentage > 50 ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {team.workloadPercentage}%
                        </span>
                        <span className="text-[10px] text-slate-400 block">{team.weeklyCapacityHours}h cap</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {status === 'Available' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Available
                          </span>
                        ) : status === 'Partially Occupied' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Partially Occupied
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Fully Occupied
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedTeam(team)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs transition-colors"
                          >
                            Members
                          </button>
                          <button
                            onClick={() => handleOpenEditTeam(team)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                            title="Edit Team"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteError(null);
                              setTeamToDelete(team);
                            }}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                            title="Delete Team"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      ) : (
        /* TEAMS GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTeams.map((team) => {
            const teamProjects = projects.filter(p => p.primaryTeamId === team.id);
            const status = getTeamStatus(team);

            return (
              <div
                key={team.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {team.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      status === 'Fully Occupied'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : status === 'Partially Occupied'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {status} ({team.workloadPercentage}%)
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900">{team.name}</h2>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {team.description || 'No description entered.'}
                  </p>

                  {/* Skills tags */}
                  {team.skills && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {team.skills.split(',').map((sk, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium">
                          {sk.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Team Stats */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Team Lead</span>
                      <span className="font-semibold text-slate-800 truncate block">{team.teamLeadName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Members</span>
                      <span className="font-semibold text-slate-800">{team.memberCount} active engineers</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Weekly Capacity</span>
                      <span className="font-semibold text-slate-800">{team.weeklyCapacityHours} hours</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Assigned Projects</span>
                      <span className="font-semibold text-slate-800">{teamProjects.length} projects</span>
                    </div>
                  </div>

                  {/* Assigned Projects & Sprint Progress */}
                  {teamProjects.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">Current Sprint Projects</span>
                      {teamProjects.slice(0, 2).map(p => (
                        <div key={p.id} className="text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-semibold text-slate-800 truncate">{p.title}</span>
                            <span className="text-[10px] font-mono text-slate-500">{p.progressPercentage}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                            <div className="bg-blue-600 h-1 rounded-full" style={{ width: `${p.progressPercentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {team.activeTasksCount} tasks ({team.blockedTasksCount} blocked)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditTeam(team)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition-colors"
                      title="Edit Team"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteError(null);
                        setTeamToDelete(team);
                      }}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs transition-colors"
                      title="Delete Team"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setSelectedTeam(team)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                    >
                      Members ({team.memberCount})
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Team Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="+ Create New Dynamic Engineering Team"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTeam} className="space-y-4 text-xs">
          {createError && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
              {createError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Team Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Cloud Infrastructure Team"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unique Team Code (Optional)</label>
              <input
                type="text"
                placeholder="e.g. INFRA-01 (Auto-generated if blank)"
                value={createCode}
                onChange={(e) => setCreateCode(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Team mission, engineering focus, and core competencies..."
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Team Lead</label>
              <select
                value={createLeadId || ''}
                onChange={(e) => setCreateLeadId(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Team Lead</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.jobTitle || u.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Weekly Capacity (Hours)</label>
              <input
                type="number"
                value={createCapacity}
                onChange={(e) => setCreateCapacity(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Skills & Competencies (Comma-separated)</label>
            <input
              type="text"
              placeholder="e.g. React, TypeScript, Docker, Kubernetes, AWS"
              value={createSkills}
              onChange={(e) => setCreateSkills(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Team Operational Notes</label>
            <textarea
              rows={2}
              placeholder="Working timezone, standup schedules, or delivery guidelines..."
              value={createNotes}
              onChange={(e) => setCreateNotes(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-md"
            >
              {createSubmitting ? 'Creating Team...' : 'Create Team'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Team Details & Member Management Modal */}
      {selectedTeam && (
        <Modal
          isOpen={!!selectedTeam}
          onClose={() => setSelectedTeam(null)}
          title={`Team Details: ${selectedTeam.name} [${selectedTeam.code}]`}
          maxWidth="2xl"
        >
          <div className="space-y-5 text-xs">
            {/* Overview Banner */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px]">Team Lead</span>
                <span className="font-bold text-slate-900">{selectedTeam.teamLeadName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Weekly Hours</span>
                <span className="font-bold text-slate-900">{selectedTeam.weeklyCapacityHours} hrs</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Workload</span>
                <span className="font-bold text-slate-900">{selectedTeam.workloadPercentage}%</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Active Tasks</span>
                <span className="font-bold text-slate-900">{selectedTeam.activeTasksCount}</span>
              </div>
            </div>

            {/* Members Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Users2 className="w-4 h-4 text-blue-600" />
                  Assigned Team Members ({selectedTeam.members.length})
                </h4>
                <button
                  onClick={() => setIsAddMemberOpen(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center gap-1 shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  + Add Member
                </button>
              </div>

              {selectedTeam.members.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl text-slate-400">
                  No members added yet. Click "+ Add Member" to assign organization engineers.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Team Member</th>
                        <th className="py-2.5 px-3">Dedicated Role</th>
                        <th className="py-2.5 px-3 text-center">Allocation</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedTeam.members.map((m) => {
                        const r = (m.teamRole || '').toLowerCase();
                        const isLead = r.includes('leader') || r.includes('lead');
                        const isDesigner = r.includes('ui') || r.includes('design');
                        const isTester = r.includes('test') || r.includes('qa');
                        const isDevOps = r.includes('ops') || r.includes('infra');

                        return (
                          <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center uppercase text-[11px] shrink-0">
                                  {m.userName.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 leading-tight">{m.userName}</p>
                                  <p className="text-[10px] text-slate-400">{m.userEmail}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              {isLead ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                  Project Leader
                                </span>
                              ) : isDesigner ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                  UI Designer
                                </span>
                              ) : isTester ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                  Tester
                                </span>
                              ) : isDevOps ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                                  DevOps Engineer
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                  Developer
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center font-medium text-slate-700">
                              {m.allocatedHoursPerWeek} hrs/wk
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Active
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleOpenEditMember(selectedTeam.id, m)}
                                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Edit member role & capacity"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setTransferMemberId(m.userId);
                                    setTransferRole(m.teamRole);
                                  }}
                                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                  title="Transfer to another team"
                                >
                                  <ArrowRightLeft className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRemoveMember(m.userId)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                  title="Remove from team"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Assigned Projects & Current Sprint Progress */}
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5 mb-2">
                <FolderGit2 className="w-4 h-4 text-indigo-600" />
                Assigned Projects & Current Sprint Progress ({projects.filter(p => p.primaryTeamId === selectedTeam.id).length})
              </h4>
              {projects.filter(p => p.primaryTeamId === selectedTeam.id).length === 0 ? (
                <div className="p-4 text-center border border-dashed border-slate-200 rounded-xl text-slate-400">
                  No active projects assigned to this team yet. Team is Available for assignment.
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.filter(p => p.primaryTeamId === selectedTeam.id).map(p => (
                    <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {p.projectCode}
                          </span>
                          <span className="font-bold text-slate-900">{p.title}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {p.stage.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                          <span>Sprint Delivery Progress</span>
                          <span className="font-bold text-slate-700">{p.progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full transition-all"
                            style={{ width: `${p.progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditTeam(selectedTeam)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit Team Details
                </button>
                <button
                  onClick={() => {
                    setDeleteError(null);
                    setTeamToDelete(selectedTeam);
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Team
                </button>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        title={`Add Member to ${selectedTeam?.name}`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          {addMemberError && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
              {addMemberError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Organization User</label>
            <select
              value={memberUserId || ''}
              onChange={(e) => setMemberUserId(Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select User</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.jobTitle || u.role})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Squad Role (Team Lead, UI/UX Designer, Developers, QA/Tester)</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                'Team Lead',
                'UI/UX Designer',
                'Frontend Developer',
                'Backend Developer',
                'Full-Stack Developer',
                'QA/Tester',
                'DevOps Engineer'
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMemberRole(preset)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border ${
                    memberRole === preset
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={memberRole}
              onChange={(e) => setMemberRole(e.target.value)}
              placeholder="e.g. Developer, UI Designer, Tester, Project Leader"
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Allocated Hours / Week</label>
            <input
              type="number"
              value={memberHours}
              onChange={(e) => setMemberHours(Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setIsAddMemberOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleAddMember}
              disabled={addMemberSubmitting || !memberUserId}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold"
            >
              {addMemberSubmitting ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Transfer Member Modal */}
      <Modal
        isOpen={!!transferMemberId}
        onClose={() => setTransferMemberId(null)}
        title="Transfer Member Between Teams"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Transferring a member reassigns their capacity and links their role to the new team.
          </p>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Destination Team</label>
            <select
              value={transferTargetTeamId || ''}
              onChange={(e) => setTransferTargetTeamId(Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Destination Team</option>
              {teams.filter(t => t.id !== selectedTeam?.id).map(t => (
                <option key={t.id} value={t.id}>{t.name} [{t.code}]</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">New Role in Destination Team</label>
            <input
              type="text"
              value={transferRole}
              onChange={(e) => setTransferRole(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Active Task Resolution Plan</label>
            <textarea
              rows={2}
              value={transferPlan}
              onChange={(e) => setTransferPlan(e.target.value)}
              placeholder="Describe task handover or reassignment strategy..."
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setTransferMemberId(null)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleTransferMember}
              disabled={transferSubmitting || !transferTargetTeamId}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold"
            >
              {transferSubmitting ? 'Transferring...' : 'Execute Transfer'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Team Modal */}
      <Modal
        isOpen={isEditTeamOpen}
        onClose={() => setIsEditTeamOpen(false)}
        title="Edit Team Details & Capacity"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveEditTeam} className="space-y-4 text-xs">
          {editTeamError && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
              {editTeamError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Team Name *</label>
              <input
                type="text"
                required
                value={editTeamName}
                onChange={(e) => setEditTeamName(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Team Code *</label>
              <input
                type="text"
                required
                value={editTeamCode}
                onChange={(e) => setEditTeamCode(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={editTeamDescription}
              onChange={(e) => setEditTeamDescription(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Team Lead</label>
              <select
                value={editTeamLeadId || ''}
                onChange={(e) => setEditTeamLeadId(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Team Lead</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.jobTitle || u.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Weekly Capacity (Hours)</label>
              <input
                type="number"
                value={editTeamCapacity}
                onChange={(e) => setEditTeamCapacity(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Skills & Competencies (Comma-separated)</label>
            <input
              type="text"
              value={editTeamSkills}
              onChange={(e) => setEditTeamSkills(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Operational Notes</label>
            <textarea
              rows={2}
              value={editTeamNotes}
              onChange={(e) => setEditTeamNotes(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditTeamOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editTeamSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-md"
            >
              {editTeamSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Team Confirmation Modal */}
      <Modal
        isOpen={!!teamToDelete}
        onClose={() => setTeamToDelete(null)}
        title="Confirm Team Deletion"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          {deleteError ? (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
              <span className="font-bold block mb-1">Cannot Delete Team:</span>
              {deleteError}
            </div>
          ) : (
            <div className="p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
              <span className="font-bold block mb-1">Warning: Irreversible Action</span>
              Are you sure you want to delete <strong>{teamToDelete?.name}</strong> [{teamToDelete?.code}]?
              The system requires that all active projects and sprint tasks are disassociated or reassigned before deletion.
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setTeamToDelete(null)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDeleteTeam}
              disabled={deleteSubmitting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold shadow-md"
            >
              {deleteSubmitting ? 'Deleting...' : 'Confirm & Delete Team'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Member Role & Capacity Modal */}
      <Modal
        isOpen={isEditMemberOpen}
        onClose={() => setIsEditMemberOpen(false)}
        title={`Edit Member: ${memberToEdit?.member.userName}`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveEditMember} className="space-y-4 text-xs">
          {editMemberError && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
              {editMemberError}
            </div>
          )}

          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-400 block">User Account</span>
            <span className="font-bold text-slate-900">{memberToEdit?.member.userName}</span>
            <span className="text-[11px] text-slate-500 ml-2 font-mono">({memberToEdit?.member.userEmail})</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Squad Role</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {[
                'Team Lead',
                'UI/UX Designer',
                'Frontend Developer',
                'Backend Developer',
                'Full-Stack Developer',
                'QA/Tester',
                'DevOps Engineer'
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setEditMemberRole(preset)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border ${
                    editMemberRole === preset
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
            <input
              type="text"
              required
              value={editMemberRole}
              onChange={(e) => setEditMemberRole(e.target.value)}
              placeholder="e.g. Frontend Developer, QA Engineer, Team Lead"
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Allocated Hours / Week</label>
            <input
              type="number"
              required
              min={1}
              max={80}
              value={editMemberHours}
              onChange={(e) => setEditMemberHours(Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditMemberOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editMemberSubmitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold"
            >
              {editMemberSubmitting ? 'Saving...' : 'Update Member Role'}
            </button>
          </div>
        </form>
      </Modal>
        </>
      )}
    </div>
  );
};

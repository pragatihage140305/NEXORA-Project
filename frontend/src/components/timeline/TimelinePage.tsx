import React, { useState, useEffect } from 'react';
import { projectApi, issueApi } from '../../services/api';
import { Project, Milestone, TaskIssue } from '../../types';
import { Badge } from '../common/Badge';
import {
  CalendarDays,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  TrendingDown,
  ArrowRight
} from 'lucide-react';

export const TimelinePage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [issues, setIssues] = useState<TaskIssue[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const res = await projectApi.getAll();
      setProjects(res.data);
      if (res.data.length > 0) {
        const first = res.data[0];
        setSelectedProjectId(first.id);
        const [mRes, iRes] = await Promise.all([
          projectApi.getMilestones(first.id),
          issueApi.getAll({ projectId: first.id })
        ]);
        setMilestones(mRes.data);
        setIssues(iRes.data);
      }
    } catch (e) {
      console.error('Error loading timeline:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectProject = async (projId: number) => {
    setSelectedProjectId(projId);
    try {
      const [mRes, iRes] = await Promise.all([
        projectApi.getMilestones(projId),
        issueApi.getAll({ projectId: projId })
      ]);
      setMilestones(mRes.data);
      setIssues(iRes.data);
    } catch {
      // Ignore
    }
  };

  const currentProject = projects.find(p => p.id === selectedProjectId);

  const overdueIssues = issues.filter(i =>
    i.dueDate && new Date(i.dueDate) < new Date() && !['RESOLVED', 'CLOSED'].includes(i.status)
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Interactive Gantt & Schedule Engine
            </span>
            <span className="text-xs text-slate-400">Milestone Deadlines & Dependencies</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mt-1">Project Timelines & Milestones</h1>
          <p className="text-sm text-slate-300 max-w-2xl mt-1">
            Compare planned vs forecast vs actual delivery dates, track sprint milestones, and monitor overdue schedule risks.
          </p>
        </div>

        {/* Project Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">Active Project:</span>
          <select
            value={selectedProjectId || ''}
            onChange={(e) => handleSelectProject(Number(e.target.value))}
            className="p-2 border border-slate-700 bg-slate-800 text-white rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.projectCode} — {p.title}</option>
            ))}
          </select>
        </div>
      </div>

      {currentProject && (
        <>
          {/* Project Schedule Overview Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {currentProject.projectCode}
                  </span>
                  <h2 className="text-base font-bold text-slate-900">{currentProject.title}</h2>
                  <Badge variant="stage" value={currentProject.stage} />
                </div>
                <p className="text-xs text-slate-500 mt-1">{currentProject.businessObjective}</p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Progress:</span>
                <span className="font-bold text-slate-800">{currentProject.progressPercentage}%</span>
              </div>
            </div>

            {/* Date Milestones Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Planned Start Date</span>
                <span className="font-bold text-slate-800">{currentProject.plannedStartDate || 'Not set'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Actual Start Date</span>
                <span className="font-bold text-indigo-700">{currentProject.actualStartDate || 'Pending auth'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Planned Target Date</span>
                <span className="font-bold text-slate-800">{currentProject.plannedEndDate || 'Not set'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Forecast / Actual End</span>
                <span className="font-bold text-emerald-700">{currentProject.actualEndDate || currentProject.forecastEndDate || 'On schedule'}</span>
              </div>
            </div>
          </div>

          {/* Overdue Alert if any */}
          {overdueIssues.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span>
                  <strong>Schedule Warning:</strong> {overdueIssues.length} assigned task(s) have passed their due dates.
                </span>
              </div>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-1 rounded">
                Action Required
              </span>
            </div>
          )}

          {/* Interactive Gantt / Milestones Sequence */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delivery Milestones & Phase Sequence</h3>
                <p className="text-xs text-slate-500">Ordered phases from prototype validation to final client closure</p>
              </div>
              <span className="text-xs font-mono text-slate-400">{milestones.length} milestones defined</span>
            </div>

            <div className="space-y-4">
              {milestones.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  No milestones configured for this project yet. Use PM Planning to add sprint milestones.
                </div>
              ) : (
                milestones.map((milestone, idx) => {
                  const isCompleted = milestone.status === 'COMPLETED';
                  const isInProgress = milestone.status === 'IN_PROGRESS';

                  return (
                    <div
                      key={milestone.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-all text-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                            isCompleted ? 'bg-emerald-600 text-white' : isInProgress ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{milestone.title}</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">{milestone.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-semibold">Target Date</span>
                            <span className="font-mono font-bold text-slate-800">{milestone.targetDate}</span>
                          </div>
                          <Badge variant="status" value={milestone.status} />
                        </div>
                      </div>

                      {/* Milestone Progress Bar */}
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                          <span>Milestone Execution</span>
                          <span className="font-bold text-slate-800">{milestone.completionPercentage || 0}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              isCompleted ? 'bg-emerald-600' : 'bg-blue-600'
                            }`}
                            style={{ width: `${milestone.completionPercentage || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Task Deadlines Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Task Schedule & Target Deadlines</h3>
              <span className="text-xs text-slate-500">{issues.length} sprint tasks</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Task Key</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Assignee</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Schedule State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {issues.map((i) => {
                    const isOverdue = i.dueDate && new Date(i.dueDate) < new Date() && !['RESOLVED', 'CLOSED'].includes(i.status);

                    return (
                      <tr key={i.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">{i.issueKey}</td>
                        <td className="py-3 px-4 font-medium text-slate-900">{i.title}</td>
                        <td className="py-3 px-4 text-slate-600">{i.assigneeName || 'Unassigned'}</td>
                        <td className="py-3 px-4"><Badge variant="status" value={i.status} /></td>
                        <td className="py-3 px-4 font-mono text-slate-700">{i.dueDate || 'No due date'}</td>
                        <td className="py-3 px-4 text-right">
                          {isOverdue ? (
                            <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-[10px] border border-rose-200">
                              Overdue
                            </span>
                          ) : (
                            <span className="text-slate-500 font-medium text-[10px]">On Track</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

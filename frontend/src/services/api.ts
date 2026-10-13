import axios from 'axios';
import {
  User,
  Project,
  Team,
  WorkloadRecommendation,
  PrototypeVersion,
  Milestone,
  TaskIssue,
  IssueComment,
  ProjectReport,
  BudgetExpense,
  AuditLog,
  NotificationItem
} from '../types';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor to handle auth errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: { name: string; email: string; password: string; role?: string; jobTitle?: string; department?: string }) =>
    api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get<User>('/auth/me'),
  getUsers: () => api.get<User[]>('/auth/users'),
};

// Projects
export const projectApi = {
  getAll: () => api.get<Project[]>('/projects'),
  getById: (id: number) => api.get<Project>(`/projects/${id}`),
  submit: (data: any) => api.post<Project>('/projects', data),
  review: (id: number, decision: { decision: string; reviewComments: string; assignedPmId?: number; assignedTeamId?: number; prototypeDeadline?: string; prototypeInstructions?: string }) =>
    api.post<Project>(`/projects/${id}/review`, decision),
  plan: (id: number, data: any) => api.post<Project>(`/projects/${id}/plan`, data),
  authorizeDevelopment: (id: number, data: { actualStartDate?: string; forecastEndDate?: string; developmentNotes?: string; confirmedTeamId?: number }) =>
    api.post<Project>(`/projects/${id}/authorize-development`, data),
  complete: (id: number) => api.post<Project>(`/projects/${id}/complete`),
  submitFinal: (id: number, data: { deliverableNotes: string; deploymentUrl?: string }) =>
    api.post<Project>(`/projects/${id}/submit-final`, data),
  reviewFinal: (id: number, data: { decision: string; reviewComments: string }) =>
    api.post<Project>(`/projects/${id}/final-review`, data),
  getMilestones: (id: number) => api.get<Milestone[]>(`/projects/${id}/milestones`),
  getPrototypes: (id: number) => api.get<PrototypeVersion[]>(`/projects/${id}/prototypes`),
};

// Teams
export const teamApi = {
  getAll: () => api.get<Team[]>('/teams'),
  getById: (id: number) => api.get<Team>(`/teams/${id}`),
  create: (data: any) => api.post<Team>('/teams', data),
  update: (id: number, data: any) => api.put<Team>(`/teams/${id}`, data),
  delete: (id: number) => api.delete<void>(`/teams/${id}`),
  addMember: (teamId: number, data: { userId: number; teamRole: string; allocatedHoursPerWeek?: number }) =>
    api.post<Team>(`/teams/${teamId}/members`, data),
  updateMember: (teamId: number, userId: number, data: { teamRole: string; allocatedHoursPerWeek?: number }) =>
    api.put<Team>(`/teams/${teamId}/members/${userId}`, data),
  removeMember: (teamId: number, userId: number) =>
    api.delete<Team>(`/teams/${teamId}/members/${userId}`),
  transferMember: (teamId: number, userId: number, data: { targetTeamId: number; newTeamRole: string; allocatedHoursPerWeek?: number; taskResolutionPlan?: string }) =>
    api.post<Team>(`/teams/${teamId}/members/${userId}/transfer`, data),
  getRecommendations: (projectId: number) =>
    api.get<WorkloadRecommendation[]>(`/teams/recommendations/${projectId}`),
};

// Prototypes
export const prototypeApi = {
  getAll: () => api.get<PrototypeVersion[]>('/prototypes'),
  submit: (data: any) => api.post<PrototypeVersion>('/prototypes', data),
  managerReview: (id: number, decision: { decision: string; comments: string }) =>
    api.post<PrototypeVersion>(`/prototypes/${id}/manager-review`, decision),
  clientReview: (id: number, decision: { decision: string; comments: string }) =>
    api.post<PrototypeVersion>(`/prototypes/${id}/client-review`, decision),
};

// Issues
export const issueApi = {
  getAll: (params?: { projectId?: number; assigneeId?: number; teamId?: number }) =>
    api.get<TaskIssue[]>('/issues', { params }),
  create: (data: any) => api.post<TaskIssue>('/issues', data),
  updateStatus: (id: number, data: { status: string; blockerReason?: string }) =>
    api.patch<TaskIssue>(`/issues/${id}/status`, data),
  assign: (id: number, params: { assigneeId?: number; teamId?: number }) =>
    api.patch<TaskIssue>(`/issues/${id}/assign`, null, { params }),
  verifyQa: (id: number, data: { qaPassed: boolean; qaNotes?: string }) =>
    api.post<TaskIssue>(`/issues/${id}/verify-qa`, data),
  logTime: (id: number, data: { hoursLogged: number; workDate?: string; description?: string }) =>
    api.post(`/issues/${id}/time-logs`, data),
  getComments: (id: number) => api.get<IssueComment[]>(`/issues/${id}/comments`),
  addComment: (id: number, data: { message: string; attachmentUrl?: string }) =>
    api.post<IssueComment>(`/issues/${id}/comments`, data),
};

// Reports & Expenses
export const reportApi = {
  getAll: (projectId?: number) =>
    api.get<ProjectReport[]>('/reports', { params: { projectId } }),
  getById: (id: number) => api.get<ProjectReport>(`/reports/${id}`),
  generate: (data: { projectId: number; reportType: string; customNotes?: string }) =>
    api.post<ProjectReport>('/reports', data),
  downloadPdfUrl: (id: number) => `/api/reports/${id}/pdf`,
  downloadExcelUrl: (id: number) => `/api/reports/${id}/excel`,
  getExpenses: (projectId: number) =>
    api.get<BudgetExpense[]>(`/reports/projects/${projectId}/expenses`),
  createExpense: (projectId: number, data: any) =>
    api.post<BudgetExpense>(`/reports/projects/${projectId}/expenses`, data),
};

// Dashboard
export const dashboardApi = {
  getAdmin: () => api.get<any>('/dashboard/admin'),
  getPm: () => api.get<any>('/dashboard/pm'),
  getClient: () => api.get<any>('/dashboard/client'),
  getMember: () => api.get<any>('/dashboard/member'),
  getAuditLogs: () => api.get<AuditLog[]>('/dashboard/audit-logs'),
  getNotifications: () => api.get<NotificationItem[]>('/dashboard/notifications'),
  markNotificationRead: (id: number) => api.patch(`/dashboard/notifications/${id}/read`),
};

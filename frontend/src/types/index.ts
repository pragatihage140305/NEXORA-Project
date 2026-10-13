export type UserRole = 'ROLE_ADMIN' | 'ROLE_PM' | 'ROLE_CLIENT' | 'ROLE_TEAM_MEMBER';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  jobTitle?: string;
  department?: string;
  avatarUrl?: string;
  hourlyRate?: number;
  active?: boolean;
}

export type ProjectStage =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'NEEDS_INFORMATION'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PLANNING'
  | 'PROTOTYPE_IN_PROGRESS'
  | 'PROTOTYPE_SUBMITTED_TO_MANAGER'
  | 'AWAITING_CLIENT_APPROVAL'
  | 'PROTOTYPE_APPROVED'
  | 'IN_DEVELOPMENT'
  | 'TESTING_QA'
  | 'FINAL_REVIEW_PENDING'
  | 'COMPLETED'
  | 'ARCHIVED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Project {
  id: number;
  title: string;
  projectCode: string;
  description: string;
  businessObjective?: string;
  expectedFeatures?: string;
  requirements?: string;
  clientId: number;
  clientName: string;
  clientEmail?: string;
  projectManagerId?: number;
  projectManagerName?: string;
  primaryTeamId?: number;
  primaryTeamName?: string;
  stage: ProjectStage;
  priority: Priority;
  proposedBudget?: number;
  approvedBudget?: number;
  currency: string;
  plannedStartDate?: string;
  actualStartDate?: string;
  plannedEndDate?: string;
  forecastEndDate?: string;
  actualEndDate?: string;
  estimatedHours: number;
  actualLoggedHours: number;
  progressPercentage: number;
  developmentAuthorizedAt?: string;
  developmentAuthorizedByName?: string;
  developmentNotes?: string;
  delayReason?: string;
  referenceDocuments?: string;
  archived: boolean;
  createdAt: string;
  openIssuesCount: number;
  blockedIssuesCount: number;
  hasApprovedPrototype: boolean;
  finalDeliverableNotes?: string;
  deploymentUrl?: string;
  finalReviewStatus?: string;
  finalSubmittedAt?: string;
  finalSubmittedByName?: string;
  finalReviewedAt?: string;
  finalReviewedByName?: string;
  finalReviewComments?: string;
}

export interface TeamMember {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  userJobTitle?: string;
  teamRole: string;
  allocatedHoursPerWeek: number;
  joinedAt: string;
}

export interface Team {
  id: number;
  name: string;
  code: string;
  description?: string;
  teamLeadId?: number;
  teamLeadName?: string;
  skills?: string;
  weeklyCapacityHours: number;
  availabilityStatus: string;
  notes?: string;
  active: boolean;
  memberCount: number;
  members: TeamMember[];
  activeAssignedHours: number;
  workloadPercentage: number;
  activeTasksCount: number;
  overdueTasksCount: number;
  blockedTasksCount: number;
  assignedProjectsCount?: number;
  teamStatus?: string;
}

export interface WorkloadRecommendation {
  teamId: number;
  teamName: string;
  teamCode: string;
  currentWorkloadPercentage: number;
  availableCapacityHours: number;
  skillsMatchScore: number;
  activeTasksCount: number;
  blockedTasksCount: number;
  overdueTasksCount: number;
  isRecommended: boolean;
  recommendationReason: string;
}

export type PrototypeStatus =
  | 'DRAFT'
  | 'SUBMITTED_TO_MANAGER'
  | 'MANAGER_APPROVED'
  | 'MANAGER_REJECTED'
  | 'CHANGES_REQUESTED_BY_MANAGER'
  | 'AWAITING_CLIENT_APPROVAL'
  | 'CLIENT_APPROVED'
  | 'CLIENT_CHANGES_REQUESTED'
  | 'CLIENT_REJECTED';

export interface PrototypeVersion {
  id: number;
  projectId: number;
  projectTitle: string;
  projectCode: string;
  versionNumber: string;
  title: string;
  previewUrl?: string;
  description?: string;
  featuresCovered?: string;
  knownLimitations?: string;
  screenshotsJson?: string;
  status: PrototypeStatus;
  submittedById?: number;
  submittedByName?: string;
  submittedAt?: string;
  managerReviewComments?: string;
  managerReviewedByName?: string;
  managerReviewedAt?: string;
  clientReviewComments?: string;
  clientReviewedByName?: string;
  clientReviewedAt?: string;
}

export interface Milestone {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  targetDate: string;
  actualDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  completionPercentage: number;
  sequenceOrder: number;
}

export type IssueType = 'BUG' | 'TASK' | 'FEATURE' | 'IMPROVEMENT' | 'DOCUMENTATION';

export type IssueStatus =
  | 'OPEN'
  | 'TODO'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'IN_REVIEW'
  | 'READY_FOR_QA'
  | 'IN_TESTING'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED';

export interface TaskIssue {
  id: number;
  issueKey: string;
  projectId: number;
  projectTitle: string;
  projectCode: string;
  milestoneId?: number;
  milestoneTitle?: string;
  title: string;
  description?: string;
  type: IssueType;
  priority: Priority;
  status: IssueStatus;
  reporterId?: number;
  reporterName?: string;
  assigneeId?: number;
  assigneeName?: string;
  teamId?: number;
  teamName?: string;
  dueDate?: string;
  estimatedHours: number;
  loggedHours: number;
  labels?: string;
  blockerReason?: string;
  qaPassed: boolean;
  qaVerifiedByName?: string;
  qaVerifiedAt?: string;
  qaNotes?: string;
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IssueComment {
  id: number;
  issueId: number;
  author: User;
  message: string;
  attachmentUrl?: string;
  createdAt: string;
}

export type ReportType =
  | 'INITIAL_ASSESSMENT'
  | 'PLANNING'
  | 'BUDGET_COST'
  | 'TEAM_WORKLOAD'
  | 'PROTOTYPE_REVIEW'
  | 'DEVELOPMENT_PROGRESS'
  | 'ISSUE_BUG'
  | 'TIMELINE_DEADLINE'
  | 'TESTING_QA'
  | 'FINAL_CLOSURE';

export interface ProjectReport {
  id: number;
  projectId: number;
  projectTitle: string;
  projectCode: string;
  reportType: ReportType;
  title: string;
  summary: string;
  metricsJson?: string;
  contentJson?: string;
  generatedById?: number;
  generatedByName: string;
  autoGenerated: boolean;
  generatedAt: string;
}

export interface BudgetExpense {
  id: number;
  projectId: number;
  projectTitle: string;
  category: string;
  amount: number;
  currency: string;
  description?: string;
  recordedByName: string;
  expenseDate: string;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  user?: User;
  userEmail: string;
  action: string;
  entityType: string;
  entityId?: number;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

import React from 'react';
import { Project } from '../../types';
import { Modal } from './Modal';
import {
  FileText,
  Calendar,
  Clock,
  DollarSign,
  User,
  Building,
  Target,
  CheckCircle2,
  Printer,
  Download,
  Shield,
  Layers,
  ArrowRight
} from 'lucide-react';

interface RequirementDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onAcceptAndAssign?: () => void;
}

export const RequirementDocumentModal: React.FC<RequirementDocumentModalProps> = ({
  isOpen,
  onClose,
  project,
  onAcceptAndAssign
}) => {
  if (!project) return null;

  const calculateDurationDays = () => {
    if (!project.plannedStartDate || !project.plannedEndDate) return null;
    const start = new Date(project.plannedStartDate);
    const end = new Date(project.plannedEndDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const durationDays = calculateDurationDays();

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Project Requirement & Budget Specification Document"
      maxWidth="3xl"
    >
      <div className="space-y-6 text-slate-800 text-xs sm:text-sm">
        {/* Document Header Bar */}
        <div className="bg-slate-900 text-white rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-400">
                  DOC-SPEC-{project.projectCode}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  CONFIDENTIAL INTAKE FILE
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-white mt-0.5">
                {project.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save File
            </button>
          </div>
        </div>

        {/* Client & Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Client Contact
            </span>
            <p className="font-bold text-slate-900 mt-1">{project.clientName || 'Elena Rostova'}</p>
            <p className="text-[11px] text-slate-500 truncate">{project.clientEmail || 'client@nexora.com'}</p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Proposed Budget
            </span>
            <p className="font-bold text-emerald-700 text-base mt-1">
              ${project.proposedBudget?.toLocaleString() || '85,000'} {project.currency || 'USD'}
            </p>
            <p className="text-[10px] text-slate-500">Fixed-Price Cap</p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Timeline Start
            </span>
            <p className="font-bold text-slate-900 mt-1">
              {project.plannedStartDate ? new Date(project.plannedStartDate).toLocaleDateString() : 'Immediate'}
            </p>
            <p className="text-[10px] text-slate-500">Intake / Kickoff</p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Target Deadline
            </span>
            <p className="font-bold text-rose-700 mt-1">
              {project.plannedEndDate ? new Date(project.plannedEndDate).toLocaleDateString() : 'To be confirmed'}
            </p>
            <p className="text-[10px] text-slate-500">
              {durationDays ? `${durationDays} Calendar Days` : 'Approx. 90 Days'}
            </p>
          </div>
        </div>

        {/* Section 1: Business Objective */}
        <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-xl">
          <div className="flex items-center gap-2 mb-1.5 text-blue-900 font-bold">
            <Target className="w-4 h-4 text-blue-600" />
            <span>1. Business Objective & Executive Mandate</span>
          </div>
          <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
            {project.businessObjective || project.description || 'Modernize legacy operations, enhance end-user velocity, and establish automated governance.'}
          </p>
        </div>

        {/* Section 2: Requirements & Scope Specification */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2 text-slate-900 font-bold">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>2. Comprehensive Scope & Requirements Specification</span>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-line">
            {project.requirements || `• Prototype Required: Interactive Figma or wireframe flow must be delivered and approved by Client prior to Stage 7 development authorization.
• Architecture: Enterprise full-stack architecture with sub-200ms API response time.
• Security: Strict session auth with HttpOnly cookies, CSRF protection, and audit logs.
• Scalability: Zero-downtime microservices and automated reporting engine.`}
          </div>
        </div>

        {/* Section 3: Expected Deliverable Features */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2 text-slate-900 font-bold">
            <Layers className="w-4 h-4 text-amber-600" />
            <span>3. Core Expected Features</span>
          </div>
          <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
            {project.expectedFeatures || 'Authentication flow, customizable dashboard widgets, real-time alert broadcasts, downloadable PDF/Excel statements.'}
          </p>
        </div>

        {/* Section 4: Lifecycle Gates & Governance Sign-off */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 font-bold text-slate-800 text-xs">
            4. Governance & Development Authorization Gates
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            <div className="p-3 flex items-center justify-between bg-white">
              <span className="font-semibold text-slate-700">Stage 1: Client Request & Budget Intake</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Complete (Verified File)
              </span>
            </div>
            <div className="p-3 flex items-center justify-between bg-white">
              <span className="font-semibold text-slate-700">Stage 2: PM Review & Team Assignment (e.g. Team 3)</span>
              <span className="text-blue-600 font-bold">
                {project.primaryTeamName ? `Assigned to ${project.primaryTeamName}` : 'In Review by PM'}
              </span>
            </div>
            <div className="p-3 flex items-center justify-between bg-white">
              <span className="font-semibold text-slate-700">Stage 6: Client Prototype Approval Gate</span>
              <span className="text-amber-600 font-bold">
                {project.hasApprovedPrototype ? '✅ Approved by Client' : 'Pending Prototype Creation'}
              </span>
            </div>
            <div className="p-3 flex items-center justify-between bg-white">
              <span className="font-semibold text-slate-700">Stage 7: Formal Development Authorization Gate</span>
              <span className="text-slate-500 font-semibold">
                {project.developmentAuthorizedAt ? '⚡ Formally Authorized' : 'Strictly Locked until Prototype Approved'}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <p className="text-[11px] text-slate-400">
            NEXORA Platform Specification Document • ID: {project.id}
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors"
            >
              Close Document
            </button>

            {onAcceptAndAssign && (
              <button
                onClick={() => {
                  onClose();
                  onAcceptAndAssign();
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all"
              >
                <span>Accept & Assign to Team 3</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

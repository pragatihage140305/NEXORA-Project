import React from 'react';

interface BadgeProps {
  variant?: 'stage' | 'priority' | 'status' | 'custom';
  value: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'custom', value, className = '' }) => {
  let colorStyles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (variant === 'stage') {
    switch (value) {
      case 'SUBMITTED':
        colorStyles = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'UNDER_REVIEW':
      case 'PLANNING':
        colorStyles = 'bg-purple-50 text-purple-700 border-purple-200';
        break;
      case 'PROTOTYPE_IN_PROGRESS':
      case 'PROTOTYPE_SUBMITTED_TO_MANAGER':
        colorStyles = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'AWAITING_CLIENT_APPROVAL':
        colorStyles = 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse';
        break;
      case 'PROTOTYPE_APPROVED':
        colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-400';
        break;
      case 'IN_DEVELOPMENT':
        colorStyles = 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold';
        break;
      case 'TESTING_QA':
        colorStyles = 'bg-cyan-50 text-cyan-700 border-cyan-200';
        break;
      case 'COMPLETED':
        colorStyles = 'bg-teal-50 text-teal-800 border-teal-300 font-bold';
        break;
      case 'REJECTED':
        colorStyles = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
      default:
        colorStyles = 'bg-slate-50 text-slate-600 border-slate-200';
    }
  } else if (variant === 'priority') {
    switch (value) {
      case 'CRITICAL':
        colorStyles = 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
        break;
      case 'HIGH':
        colorStyles = 'bg-orange-50 text-orange-700 border-orange-200';
        break;
      case 'MEDIUM':
        colorStyles = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'LOW':
        colorStyles = 'bg-slate-50 text-slate-600 border-slate-200';
        break;
    }
  } else if (variant === 'status') {
    switch (value) {
      case 'TODO':
      case 'OPEN':
        colorStyles = 'bg-slate-100 text-slate-700 border-slate-300';
        break;
      case 'IN_PROGRESS':
        colorStyles = 'bg-blue-100 text-blue-800 border-blue-300';
        break;
      case 'BLOCKED':
        colorStyles = 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
        break;
      case 'IN_REVIEW':
      case 'READY_FOR_QA':
        colorStyles = 'bg-purple-100 text-purple-800 border-purple-300';
        break;
      case 'RESOLVED':
      case 'CLOSED':
        colorStyles = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold';
        break;
      case 'REOPENED':
        colorStyles = 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
        break;
    }
  }

  const formatText = (txt: string) => {
    return txt.replace(/_/g, ' ');
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorStyles} ${className}`}>
      {formatText(value)}
    </span>
  );
};

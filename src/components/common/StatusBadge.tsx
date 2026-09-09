import React from 'react';
import { QUESTION_STATUS_CONFIG, SOCIAL_STATUS_CONFIG, VIDEO_STATUS_CONFIG } from '../../config/constants';
import { QuestionStatus, SocialPublishStatus, VideoProductionStatus } from '../../types';

interface QuestionStatusBadgeProps {
  status: QuestionStatus;
  size?: 'sm' | 'md';
}

export const QuestionStatusBadge: React.FC<QuestionStatusBadgeProps> = ({ status, size = 'md' }) => {
  const safeStatus = status || 'DRAFT';
  const config = QUESTION_STATUS_CONFIG[status] || {
    label: status || 'DRAFT',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      id={`badge-qstatus-${safeStatus.toString().toLowerCase()}`}
      className={`inline-flex items-center rounded-md border ${config.bg} ${config.text} ${config.border} ${sizeClasses} transition-colors select-none`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-70" />
      {config.label}
    </span>
  );
};

interface VideoStatusBadgeProps {
  status: VideoProductionStatus;
  size?: 'sm' | 'md';
}

export const VideoStatusBadge: React.FC<VideoStatusBadgeProps> = ({ status, size = 'md' }) => {
  const safeStatus = status || 'NOT_STARTED';
  const config = VIDEO_STATUS_CONFIG[status] || {
    label: status || 'NOT_STARTED',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      id={`badge-vstatus-${safeStatus.toString().toLowerCase()}`}
      className={`inline-flex items-center rounded-md border ${config.bg} ${config.text} ${config.border} ${sizeClasses} select-none`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75" />
      {config.label}
    </span>
  );
};

interface SocialStatusBadgeProps {
  status: SocialPublishStatus;
}

export const SocialStatusBadge: React.FC<SocialStatusBadgeProps> = ({ status }) => {
  const config = SOCIAL_STATUS_CONFIG[status] || {
    label: status,
    bg: 'bg-slate-100',
    text: 'text-slate-700',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${config.bg} ${config.text} border-transparent`}>
      {config.label}
    </span>
  );
};

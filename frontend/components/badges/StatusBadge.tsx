import React from 'react';
import { QUESTION_STATUS_CONFIG, SOCIAL_STATUS_CONFIG, VIDEO_STATUS_CONFIG } from '../../../src/config/constants';
import { QuestionStatus, SocialPublishStatus, VideoProductionStatus } from '../../../shared';
import { Badge } from '../../design-system';

export interface QuestionStatusBadgeProps {
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

  return (
    <Badge
      id={`badge-qstatus-${safeStatus.toString().toLowerCase()}`}
      size={size}
      dot
      className={`${config.bg} ${config.text} ${config.border}`}
    >
      {config.label}
    </Badge>
  );
};

export interface VideoStatusBadgeProps {
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

  return (
    <Badge
      id={`badge-vstatus-${safeStatus.toString().toLowerCase()}`}
      size={size}
      dot
      className={`${config.bg} ${config.text} ${config.border}`}
    >
      {config.label}
    </Badge>
  );
};

export interface SocialStatusBadgeProps {
  status: SocialPublishStatus;
}

export const SocialStatusBadge: React.FC<SocialStatusBadgeProps> = ({ status }) => {
  const config = SOCIAL_STATUS_CONFIG[status] || {
    label: status,
    bg: 'bg-slate-100',
    text: 'text-slate-700',
  };

  return (
    <Badge
      size="sm"
      dot={false}
      className={`${config.bg} ${config.text} border-transparent`}
    >
      {config.label}
    </Badge>
  );
};

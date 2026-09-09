import React, { useState, useEffect } from 'react';
import { UserCheck, Users, AlertCircle, Calendar, ShieldCheck, Flag, FileText } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { apiClient } from '../../lib/api-client';
import { Publishing, Assignment, User, PlatformType, PriorityLevel, UserRole } from '../../types';

interface PublishingAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: Publishing | null;
  users: User[];
  currentAssignment?: Assignment | null;
  initialPlatform?: PlatformType;
  onSuccess: (message: string) => void;
}

export const PublishingAssignmentModal: React.FC<PublishingAssignmentModalProps> = ({
  isOpen,
  onClose,
  record,
  users,
  currentAssignment,
  initialPlatform,
  onSuccess,
}) => {
  const isReassignment = Boolean(currentAssignment);

  const [assigneeId, setAssigneeId] = useState<string>('');
  const [platform, setPlatform] = useState<string>(initialPlatform || '');
  const [priority, setPriority] = useState<PriorityLevel>(PriorityLevel.NORMAL);
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter eligible workers: active and role in [ADMIN, CONTENT_MANAGER, PUBLISHING_MANAGER]
  const eligibleWorkers = users.filter((u) => {
    if (u.isActive === false) return false;
    const r = String(u.role || '').toUpperCase();
    return [
      UserRole.ADMIN.toUpperCase(),
      UserRole.CONTENT_MANAGER.toUpperCase(),
      UserRole.PUBLISHING_MANAGER.toUpperCase(),
    ].includes(r);
  });

  useEffect(() => {
    if (isOpen && record) {
      setErrorMessage(null);
      if (currentAssignment) {
        setAssigneeId(currentAssignment.assigneeId || '');
        setPlatform(currentAssignment.platform || '');
        setPriority(currentAssignment.priority || PriorityLevel.NORMAL);
        setDueDate(currentAssignment.dueDate ? currentAssignment.dueDate.slice(0, 10) : '');
        setNotes('');
      } else {
        setAssigneeId(eligibleWorkers[0]?.id || '');
        setPlatform(initialPlatform || '');
        setPriority(PriorityLevel.NORMAL);
        // Default due date: tomorrow
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        setDueDate(tomorrow);
        setNotes('');
      }
    }
  }, [isOpen, record, currentAssignment, initialPlatform]);

  if (!isOpen || !record) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigneeId) {
      setErrorMessage('Please select an authorized publishing assignee.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      if (isReassignment && currentAssignment) {
        // Canonical reassignment workflow
        await apiClient.reassignAssignment(currentAssignment.id, {
          newAssigneeId: assigneeId,
          notes: notes.trim() || undefined,
        });
        const workerName = eligibleWorkers.find((u) => u.id === assigneeId)?.name || assigneeId;
        onSuccess(`Reassigned publishing work for video ${record.videoId} to ${workerName}`);
      } else {
        // Canonical Phase 13.4 publishing assignment creation
        await apiClient.createPublishingAssignment(record.videoId, {
          assigneeId,
          platform: (platform && ['youtube', 'instagram', 'facebook'].includes(platform))
            ? (platform as 'youtube' | 'instagram' | 'facebook')
            : undefined,
          priority,
          dueDate: dueDate || undefined,
          notes: notes.trim() || undefined,
        });
        const workerName = eligibleWorkers.find((u) => u.id === assigneeId)?.name || assigneeId;
        onSuccess(`Assigned publishing work for video ${record.videoId} to ${workerName}`);
      }
      onClose();
    } catch (err: any) {
      // If error has blockers, format nicely
      const blockers = err?.blockers || err?.details?.blockers;
      if (Array.isArray(blockers) && blockers.length > 0) {
        setErrorMessage(
          `Gate D Publish Readiness Blocked:\n• ${blockers.join('\n• ')}`
        );
      } else {
        setErrorMessage(err?.message || 'Failed to update publishing assignment');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      id="modal-publishing-assignment"
      isOpen={isOpen}
      onClose={onClose}
      title={isReassignment ? 'Reassign Publishing Task' : 'Assign Publishing Work'}
      subtitle={`Video: ${record.videoId} • ${record.videoTitle}`}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || !assigneeId}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Saving...' : isReassignment ? 'Confirm Reassignment' : 'Assign Work'}</span>
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isReassignment && currentAssignment && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-700" />
              <span>Current Active Assignment: {currentAssignment.id}</span>
            </div>
            <div className="text-amber-800 text-[11px]">
              Assigned to: <span className="font-semibold">{currentAssignment.assigneeName}</span> (Role: {currentAssignment.assignmentRole})
              {currentAssignment.platform && ` • Platform: ${currentAssignment.platform.toUpperCase()}`}
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="whitespace-pre-line font-mono text-[11px] leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Assignee Selection */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-800">
            {isReassignment ? 'New Assignee (Authorized Worker)' : 'Assignee (Authorized Worker)'}
          </label>
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
            required
          >
            <option value="" disabled>Select authorized team member...</option>
            {eligibleWorkers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role}) • {u.email}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-500">
            Only active users with role ADMIN, CONTENT_MANAGER, or PUBLISHING_MANAGER are authorized.
          </p>
        </div>

        {/* Platform Scope (Only for new assignment) */}
        {!isReassignment && (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800">
              Platform Scope (Optional)
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
            >
              <option value="">All Channels (Global Publishing Responsibility)</option>
              <option value="youtube">YouTube Shorts Only</option>
              <option value="instagram">Instagram Reels Only</option>
              <option value="facebook">Facebook Video Only</option>
            </select>
          </div>
        )}

        {/* Priority and Due Date */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800 flex items-center gap-1">
              <Flag className="w-3.5 h-3.5 text-indigo-600" />
              <span>Priority</span>
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as PriorityLevel)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
            >
              <option value={PriorityLevel.LOW}>Low</option>
              <option value={PriorityLevel.NORMAL}>Normal</option>
              <option value={PriorityLevel.HIGH}>High</option>
              <option value={PriorityLevel.URGENT}>Urgent</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-800 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Target Due Date</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden font-mono"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-800 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Instructions / Reassignment Reason</span>
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Please verify Telugu hashtag set and schedule for peak prime-time engagement"
            className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden"
          />
        </div>
      </form>
    </Modal>
  );
};

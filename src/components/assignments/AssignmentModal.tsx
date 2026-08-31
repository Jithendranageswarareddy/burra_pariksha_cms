import React, { useState, useEffect } from 'react';
import {
  Assignment,
  AssignmentEntityType,
  AssignmentRole,
  AssignmentStatus,
  AssignmentTaskType,
  PriorityLevel,
  User,
} from '../../types';
import { apiClient } from '../../lib/api-client';
import {
  X,
  UserCheck,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
} from 'lucide-react';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (assignment: Assignment) => void;
  entityType?: AssignmentEntityType | string;
  entityId?: string;
  defaultTaskType?: AssignmentTaskType | string;
  existingAssignment?: Assignment | null;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  entityType = 'VIDEO',
  entityId = '',
  defaultTaskType = 'QUESTION_WRITING',
  existingAssignment,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [taskType, setTaskType] = useState<string>(defaultTaskType);
  const [role, setRole] = useState<string>('CONTENT_WRITER');
  const [priority, setPriority] = useState<PriorityLevel>(PriorityLevel.NORMAL);
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Reassign state
  const [isReassigning, setIsReassigning] = useState(false);
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [reassignNotes, setReassignNotes] = useState('');

  // Action states for existing assignment
  const [blockReason, setBlockReason] = useState('');
  const [showBlockInput, setShowBlockInput] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [showCompleteInput, setShowCompleteInput] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      if (existingAssignment) {
        setSelectedUserId(existingAssignment.assigneeId);
        setTaskType(existingAssignment.taskType);
        setRole(existingAssignment.assignmentRole || 'CONTENT_WRITER');
        setPriority((existingAssignment.priority as PriorityLevel) || PriorityLevel.NORMAL);
        setDueDate(existingAssignment.dueDate || '');
        setNotes(existingAssignment.notes || '');
      } else {
        setSelectedUserId('');
        setTaskType(defaultTaskType);
        setRole(inferRoleForTask(defaultTaskType));
        setPriority(PriorityLevel.NORMAL);
        setDueDate('');
        setNotes('');
      }
      setIsReassigning(false);
      setShowBlockInput(false);
      setShowCompleteInput(false);
      setError(null);
    }
  }, [isOpen, existingAssignment, defaultTaskType]);

  const loadUsers = async () => {
    try {
      const data = await apiClient.getUsers();
      setUsers(data.filter((u) => u.isActive));
      if (!existingAssignment && data.length > 0 && !selectedUserId) {
        setSelectedUserId(data[0].id);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load team directory');
    }
  };

  const inferRoleForTask = (task: string): string => {
    switch (task) {
      case 'QUESTION_WRITING':
      case 'QUESTION_REVIEW':
        return 'CONTENT_WRITER';
      case 'RECORDING':
        return 'SPEAKER';
      case 'EDITING':
        return 'VIDEO_EDITOR';
      case 'THUMBNAIL_DESIGN':
        return 'GRAPHIC_DESIGNER';
      case 'PINNED_COMMENT':
      case 'PUBLISHING':
        return 'COMMUNITY_MANAGER';
      case 'QUALITY_REVIEW':
      case 'STRATEGY_PLANNING':
        return 'CONTENT_LEAD';
      default:
        return 'ADMIN';
    }
  };

  const handleTaskTypeChange = (newType: string) => {
    setTaskType(newType);
    setRole(inferRoleForTask(newType));
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      setError('Please select an assignee from the team directory');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (existingAssignment) {
        const updated = await apiClient.updateAssignment(existingAssignment.id, {
          taskType,
          priority,
          dueDate: dueDate || undefined,
          notes: notes || undefined,
        });
        onSuccess(updated);
        onClose();
      } else {
        const created = await apiClient.createAssignment({
          entityType: entityType as any,
          entityId,
          assigneeId: selectedUserId,
          assignmentRole: role as any,
          taskType: taskType as any,
          priority,
          dueDate: dueDate || undefined,
          notes: notes || undefined,
        });
        onSuccess(created);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!existingAssignment) return;
    setLoading(true);
    try {
      const updated = await apiClient.startAssignment(existingAssignment.id);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to start task');
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!existingAssignment) return;
    if (!blockReason.trim()) {
      setError('Please provide a reason for blocking this task');
      return;
    }
    setLoading(true);
    try {
      const updated = await apiClient.blockAssignment(existingAssignment.id, blockReason);
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to mark task as blocked');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!existingAssignment) return;
    setLoading(true);
    try {
      const updated = await apiClient.completeAssignment(existingAssignment.id, {
        notes: completionNotes || undefined,
      });
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to complete task');
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = async () => {
    if (!existingAssignment || !newAssigneeId) {
      setError('Please select a replacement assignee');
      return;
    }
    setLoading(true);
    try {
      const updated = await apiClient.reassignAssignment(existingAssignment.id, {
        newAssigneeId,
        notes: reassignNotes || undefined,
      });
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to reassign task');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold">
              {existingAssignment ? `Manage Assignment: ${existingAssignment.id}` : `Assign Task: ${entityType} ${entityId}`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Existing Assignment Lifecycle Actions */}
        {existingAssignment && !isReassigning && (
          <div className="px-6 pt-4 pb-2 border-b border-slate-100 bg-slate-50/70">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Workflow Status Actions
            </div>
            <div className="flex flex-wrap gap-2">
              {existingAssignment.status === AssignmentStatus.ASSIGNED && (
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium shadow-xs disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Start Task</span>
                </button>
              )}

              {(existingAssignment.status === AssignmentStatus.ASSIGNED ||
                existingAssignment.status === AssignmentStatus.IN_PROGRESS) && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowBlockInput(!showBlockInput)}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-medium shadow-xs disabled:opacity-50"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Block Task</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCompleteInput(!showCompleteInput)}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-xs disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Completed</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsReassigning(true)}
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-medium shadow-xs disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reassign</span>
                  </button>
                </>
              )}
            </div>

            {/* Block Input Section */}
            {showBlockInput && (
              <div className="mt-3 p-3 bg-rose-50/60 border border-rose-200 rounded-lg">
                <label className="block text-xs font-medium text-rose-900 mb-1">
                  Reason for blocking:
                </label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="e.g. Waiting for audio script sign-off"
                  className="w-full text-xs px-2.5 py-1.5 rounded border border-rose-300 bg-white text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-rose-500 mb-2"
                />
                <button
                  type="button"
                  onClick={handleBlock}
                  disabled={loading || !blockReason.trim()}
                  className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium disabled:opacity-50"
                >
                  Confirm Block
                </button>
              </div>
            )}

            {/* Complete Input Section */}
            {showCompleteInput && (
              <div className="mt-3 p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg">
                <label className="block text-xs font-medium text-emerald-900 mb-1">
                  Completion notes (optional):
                </label>
                <input
                  type="text"
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="e.g. Recorded in Telugu studio 2, render uploaded"
                  className="w-full text-xs px-2.5 py-1.5 rounded border border-emerald-300 bg-white text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 mb-2"
                />
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={loading}
                  className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium disabled:opacity-50"
                >
                  Confirm Completed
                </button>
              </div>
            )}
          </div>
        )}

        {/* Reassignment Form */}
        {isReassigning ? (
          <div className="p-6 space-y-4">
            <div className="text-sm font-semibold text-slate-800 flex items-center justify-between">
              <span>Reassign Task to Colleague</span>
              <button
                type="button"
                onClick={() => setIsReassigning(false)}
                className="text-xs text-slate-500 hover:text-slate-700 underline"
              >
                Cancel Reassign
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                New Assignee
              </label>
              <select
                value={newAssigneeId}
                onChange={(e) => setNewAssigneeId(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select new team member...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role}) — {u.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Handover Notes
              </label>
              <textarea
                value={reassignNotes}
                onChange={(e) => setReassignNotes(e.target.value)}
                rows={3}
                placeholder="Details for the new assignee..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsReassigning(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReassign}
                disabled={loading || !newAssigneeId}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs disabled:opacity-50"
              >
                {loading ? 'Reassigning...' : 'Confirm Reassignment'}
              </button>
            </div>
          </div>
        ) : (
          /* Create / Edit Form */
          <form onSubmit={handleCreateOrUpdate} className="p-6 space-y-4">
            {/* Task Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Task Type
              </label>
              <select
                value={taskType}
                onChange={(e) => handleTaskTypeChange(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="QUESTION_WRITING">Question Writing (Telugu / English Aptitude)</option>
                <option value="QUESTION_REVIEW">Question Content Review & Fact-Check</option>
                <option value="RECORDING">Voiceover & Studio Filming</option>
                <option value="EDITING">Video Editing & Motion Graphics</option>
                <option value="THUMBNAIL_DESIGN">Thumbnail Artwork & Visual Design</option>
                <option value="PINNED_COMMENT">Pinned Comment Formulation</option>
                <option value="PUBLISHING">Multi-Platform Publishing (YT, IG, FB)</option>
                <option value="QUALITY_REVIEW">Final Quality Review & Sign-Off</option>
                <option value="STRATEGY_PLANNING">Syllabus & Sprint Batch Planning</option>
              </select>
            </div>

            {/* Assignee */}
            {!existingAssignment && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Assignee
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select team member...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role}) — {u.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Priority & Due Date Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={PriorityLevel.LOW}>Low</option>
                  <option value={PriorityLevel.NORMAL}>Normal</option>
                  <option value={PriorityLevel.HIGH}>High</option>
                  <option value={PriorityLevel.URGENT}>Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Instructions & Context
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Specific guidance, deadlines, or technical notes..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {loading ? 'Saving...' : existingAssignment ? 'Save Changes' : 'Create Assignment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

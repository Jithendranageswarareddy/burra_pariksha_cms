import React, { useState, useEffect } from 'react';
import { Assignment, AssignmentEntityType, AssignmentTaskType } from '../../types';
import { apiClient } from '../../lib/api-client';
import { AssignmentStatusBadge, AssignmentPriorityBadge } from './AssignmentBadge';
import { AssignmentModal } from './AssignmentModal';
import {
  UserCheck,
  Plus,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Play,
  Edit2,
  RefreshCw,
} from 'lucide-react';

interface EntityAssignmentsSectionProps {
  entityType: AssignmentEntityType | string;
  entityId: string;
  title?: string;
  defaultTaskType?: AssignmentTaskType | string;
  compact?: boolean;
}

export const EntityAssignmentsSection: React.FC<EntityAssignmentsSectionProps> = ({
  entityType,
  entityId,
  title = 'Team Task Assignments',
  defaultTaskType = 'QUESTION_WRITING',
  compact = false,
}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  useEffect(() => {
    if (entityId) {
      loadAssignments();
    }
  }, [entityType, entityId]);

  const loadAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getEntityAssignments(entityType, entityId);
      setAssignments(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingAssignment(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (asn: Assignment) => {
    setEditingAssignment(asn);
    setIsModalOpen(true);
  };

  const handleModalSuccess = (saved: Assignment) => {
    loadAssignments();
  };

  const handleQuickStart = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.startAssignment(id);
      loadAssignments();
    } catch (err: any) {
      setError(err?.message || 'Failed to start assignment');
    }
  };

  const handleQuickComplete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.completeAssignment(id);
      loadAssignments();
    } catch (err: any) {
      setError(err?.message || 'Failed to complete assignment');
    }
  };

  return (
    <div className={`rounded-xl border border-slate-200 bg-white ${compact ? 'p-4' : 'p-6'} shadow-xs`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
          {assignments.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
              {assignments.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadAssignments}
            title="Refresh assignments"
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Assign Task</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-2 border border-rose-200">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* List */}
      {assignments.length === 0 ? (
        <div className="py-6 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
          <UserCheck className="w-8 h-8 mx-auto text-slate-300 mb-1" />
          <p className="text-xs text-slate-500 font-medium">No team tasks assigned yet for this {entityType.toLowerCase()}</p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
          >
            Assign team member now
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {assignments.map((asn) => {
            const isAssigned = asn.status === 'ASSIGNED';
            const isInProgress = asn.status === 'IN_PROGRESS';
            const isBlocked = asn.status === 'BLOCKED';
            const isCompleted = asn.status === 'COMPLETED';

            return (
              <div
                key={asn.id}
                onClick={() => handleOpenEdit(asn)}
                className={`p-3 rounded-lg border transition-all cursor-pointer hover:shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isBlocked
                    ? 'border-rose-200 bg-rose-50/30'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : isInProgress
                    ? 'border-amber-200 bg-amber-50/20'
                    : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">{asn.taskType.replace(/_/g, ' ')}</span>
                    <AssignmentStatusBadge status={asn.status} size="sm" />
                    <AssignmentPriorityBadge priority={asn.priority} size="sm" />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">Assignee: {asn.assigneeName}</span>
                    {asn.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Due: {asn.dueDate}</span>
                      </span>
                    )}
                    {asn.notes && <span className="text-slate-400 truncate max-w-xs">{asn.notes}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {isAssigned && (
                    <button
                      type="button"
                      onClick={(e) => handleQuickStart(asn.id, e)}
                      title="Start Task"
                      className="p-1.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {(isAssigned || isInProgress || isBlocked) && (
                    <button
                      type="button"
                      onClick={(e) => handleQuickComplete(asn.id, e)}
                      title="Mark Completed"
                      className="p-1.5 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(asn)}
                    title="Edit Assignment"
                    className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AssignmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        entityType={entityType}
        entityId={entityId}
        defaultTaskType={defaultTaskType}
        existingAssignment={editingAssignment}
      />
    </div>
  );
};

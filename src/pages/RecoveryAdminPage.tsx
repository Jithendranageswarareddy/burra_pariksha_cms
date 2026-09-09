import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Lock,
  Database,
  FileCheck,
  Layers,
  ListOrdered,
  Sparkles,
  Kanban,
  FileText,
  Image,
  MessageSquare,
  Share2,
  UserCheck,
  Eye,
  History,
  Info,
  X,
  Cloud,
  CloudOff,
  HardDrive,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, RecoveryStatusResponse, SnapshotHistoryItem } from '../lib/api-client';
import { UserRole } from '../types';

export const RecoveryAdminPage: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<RecoveryStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Snapshot History State
  const [snapshots, setSnapshots] = useState<SnapshotHistoryItem[]>([]);
  const [isSnapshotsLoading, setIsSnapshotsLoading] = useState(true);
  const [snapshotsError, setSnapshotsError] = useState<string | null>(null);
  const [selectedSnapshotDetail, setSelectedSnapshotDetail] = useState<SnapshotHistoryItem | null>(null);

  // Durable Archive State (Task 3F.4.10D)
  const [isCreatingArchive, setIsCreatingArchive] = useState<boolean>(false);
  const [createArchiveResult, setCreateArchiveResult] = useState<string | null>(null);
  const [createArchiveError, setCreateArchiveError] = useState<string | null>(null);

  // Snapshot Retrieval / Verification State (Task 3F.4.10D)
  const [isRetrievingSnapshot, setIsRetrievingSnapshot] = useState<boolean>(false);
  const [retrievedSnapshotPayload, setRetrievedSnapshotPayload] = useState<any | null>(null);
  const [retrievalError, setRetrievalError] = useState<string | null>(null);
  const [retrievalVerificationStatus, setRetrievalVerificationStatus] = useState<'VERIFIED' | 'CORRUPTED' | 'UNAVAILABLE' | null>(null);

  // Dry Run State (Task 3F.4.9F.3)
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('LIVE_BASELINE');
  const [dryRunResult, setDryRunResult] = useState<any | null>(null);
  const [isDryRunLoading, setIsDryRunLoading] = useState<boolean>(false);
  const [dryRunError, setDryRunError] = useState<string | null>(null);

  // Granular Restore State (Task 3F.4.9F.4)
  const [granularSnapshotId, setGranularSnapshotId] = useState<string>('LIVE_BASELINE');
  const [granularEntityType, setGranularEntityType] = useState<string>('QUESTION');
  const [granularEntityId, setGranularEntityId] = useState<string>('');
  const [granularConfirmationInput, setGranularConfirmationInput] = useState<string>('');
  const [granularValidationResult, setGranularValidationResult] = useState<any | null>(null);
  const [isGranularValidating, setIsGranularValidating] = useState<boolean>(false);
  const [granularValidationError, setGranularValidationError] = useState<string | null>(null);
  const [isGranularRestoring, setIsGranularRestoring] = useState<boolean>(false);
  const [granularRestoreResult, setGranularRestoreResult] = useState<any | null>(null);
  const [granularRestoreError, setGranularRestoreError] = useState<string | null>(null);

  // Full Snapshot Restore State (Task 3F.4.9F.5)
  const [fullSnapshotId, setFullSnapshotId] = useState<string>('LIVE_BASELINE');
  const [fullDryRunResult, setFullDryRunResult] = useState<any | null>(null);
  const [isFullDryRunLoading, setIsFullDryRunLoading] = useState<boolean>(false);
  const [fullDryRunError, setFullDryRunError] = useState<string | null>(null);
  const [fullAckChecked, setFullAckChecked] = useState<boolean>(false);
  const [fullConfirmationInput, setFullConfirmationInput] = useState<string>('');
  const [showFullRestoreConfirmModal, setShowFullRestoreConfirmModal] = useState<boolean>(false);
  const [isFullRestoreExecuting, setIsFullRestoreExecuting] = useState<boolean>(false);
  const [fullRestoreResult, setFullRestoreResult] = useState<any | null>(null);
  const [fullRestoreError, setFullRestoreError] = useState<string | null>(null);

  const CONFIRMATION_PHRASES: Record<string, string> = {
    QUESTION: 'RESTORE QUESTION',
    VIDEO: 'RESTORE VIDEO',
    SCRIPT: 'RESTORE SCRIPT',
    THUMBNAIL: 'RESTORE THUMBNAIL',
    PINNED_COMMENT: 'RESTORE PINNED COMMENT',
    PUBLISHING: 'RESTORE PUBLISHING',
    ASSIGNMENT: 'RESTORE ASSIGNMENT',
  };

  const isAdmin = user?.role === UserRole.ADMIN || user?.role === 'ADMIN';

  const fetchStatus = async () => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getRecoveryStatus();
      setStatus(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve recovery status from system API.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSnapshots = async () => {
    if (!isAdmin) {
      setIsSnapshotsLoading(false);
      return;
    }
    setIsSnapshotsLoading(true);
    setSnapshotsError(null);
    try {
      const res = await apiClient.getSnapshotHistory();
      if (res && res.snapshots) {
        setSnapshots(res.snapshots);
      } else if (Array.isArray(res)) {
        setSnapshots(res);
      } else {
        setSnapshots([]);
      }
    } catch (err: any) {
      setSnapshotsError(err?.message || 'Failed to retrieve snapshot history.');
    } finally {
      setIsSnapshotsLoading(false);
    }
  };

  const handleRefreshAll = () => {
    fetchStatus();
    fetchSnapshots();
  };

  const handleCreateDurableArchive = async () => {
    if (!isAdmin) return;
    setIsCreatingArchive(true);
    setCreateArchiveError(null);
    setCreateArchiveResult(null);
    try {
      const res = await apiClient.createDurableArchive();
      if (res && res.success) {
        setCreateArchiveResult(`Archived snapshot successfully: ${res.snapshot.id}`);
        fetchStatus();
        fetchSnapshots();
      }
    } catch (err: any) {
      setCreateArchiveError(err?.message || 'Failed to create durable archive.');
    } finally {
      setIsCreatingArchive(false);
    }
  };

  const handleVerifyAndRetrieveSnapshot = async (snapshotId: string) => {
    if (!isAdmin) return;
    setIsRetrievingSnapshot(true);
    setRetrievalError(null);
    setRetrievedSnapshotPayload(null);
    setRetrievalVerificationStatus(null);
    try {
      const res = await apiClient.retrieveDurableSnapshot(snapshotId);
      if (res && res.success && res.snapshot) {
        setRetrievedSnapshotPayload(res.snapshot);
        setRetrievalVerificationStatus('VERIFIED');
      } else {
        setRetrievalError('Failed to verify or retrieve durable snapshot payload.');
        setRetrievalVerificationStatus('UNAVAILABLE');
      }
    } catch (err: any) {
      setRetrievalError(err?.message || 'Data Integrity Exception: SHA-256 hash mismatch or storage object corrupted.');
      setRetrievalVerificationStatus('CORRUPTED');
    } finally {
      setIsRetrievingSnapshot(false);
    }
  };

  const handleRunDryRun = async () => {
    if (!isAdmin) return;
    setIsDryRunLoading(true);
    setDryRunError(null);
    try {
      const selectedSnap = snapshots.find(s => s.id === selectedSnapshotId);
      const payload = selectedSnap && selectedSnapshotId !== 'LIVE_BASELINE'
        ? { snapshotId: selectedSnap.id, checksum: selectedSnap.checksum }
        : null;
      const res = await apiClient.runRecoveryDryRun(payload);
      if (res) {
        setDryRunResult(res.plan || res);
      }
    } catch (err: any) {
      setDryRunError(err?.message || 'Dry-run operation failed.');
    } finally {
      setIsDryRunLoading(false);
    }
  };

  const handleValidateGranular = async () => {
    if (!isAdmin) return;
    if (!granularEntityId.trim()) {
      setGranularValidationError('Please enter a target entity ID before running validation.');
      return;
    }
    setIsGranularValidating(true);
    setGranularValidationError(null);
    setGranularValidationResult(null);
    setGranularRestoreResult(null);
    setGranularRestoreError(null);
    setGranularConfirmationInput('');

    try {
      const selectedSnap = snapshots.find(s => s.id === granularSnapshotId);
      const payload = selectedSnap && granularSnapshotId !== 'LIVE_BASELINE'
        ? { snapshotId: selectedSnap.id, checksum: selectedSnap.checksum }
        : null;

      const res = await apiClient.validateGranularRestore(granularEntityType, granularEntityId.trim(), payload);
      if (res) {
        setGranularValidationResult(res);
      }
    } catch (err: any) {
      setGranularValidationError(err?.message || 'Granular validation preflight failed.');
    } finally {
      setIsGranularValidating(false);
    }
  };

  const handleExecuteGranularRestore = async () => {
    if (!isAdmin) return;
    const requiredPhrase = CONFIRMATION_PHRASES[granularEntityType] || `RESTORE ${granularEntityType}`;
    if (granularConfirmationInput !== requiredPhrase) {
      setGranularRestoreError(`Confirmation phrase mismatch. Required: "${requiredPhrase}".`);
      return;
    }

    if (!granularValidationResult || !granularValidationResult.valid || granularValidationResult.proposedOperation === 'REJECTED') {
      setGranularRestoreError('Cannot execute restoration. Preflight validation is either missing, failed, or blocked by conflicts.');
      return;
    }

    setIsGranularRestoring(true);
    setGranularRestoreError(null);

    try {
      const selectedSnap = snapshots.find(s => s.id === granularSnapshotId);
      const payload = selectedSnap && granularSnapshotId !== 'LIVE_BASELINE'
        ? { snapshotId: selectedSnap.id, checksum: selectedSnap.checksum }
        : null;

      const res = await apiClient.restoreGranularRecord(
        granularEntityType,
        granularEntityId.trim(),
        granularConfirmationInput,
        payload
      );

      if (res) {
        setGranularRestoreResult(res);
        // Refresh status and snapshot history safely
        fetchStatus();
        fetchSnapshots();
      }
    } catch (err: any) {
      setGranularRestoreError(err?.message || 'Granular restore execution failed.');
    } finally {
      setIsGranularRestoring(false);
    }
  };

  const handleRunFullPreflight = async () => {
    if (!isAdmin) return;
    setIsFullDryRunLoading(true);
    setFullDryRunError(null);
    setFullDryRunResult(null);
    setFullRestoreResult(null);
    setFullRestoreError(null);
    setFullAckChecked(false);
    setFullConfirmationInput('');

    try {
      const selectedSnap = snapshots.find(s => s.id === fullSnapshotId);
      const payload = selectedSnap && fullSnapshotId !== 'LIVE_BASELINE'
        ? { snapshotId: selectedSnap.id, checksum: selectedSnap.checksum }
        : null;

      const res = await apiClient.runRecoveryDryRun(payload);
      if (res) {
        setFullDryRunResult(res);
      }
    } catch (err: any) {
      setFullDryRunError(err?.message || 'Full preflight dry-run execution failed.');
    } finally {
      setIsFullDryRunLoading(false);
    }
  };

  const handleExecuteFullRestore = async () => {
    if (!isAdmin) return;
    if (fullConfirmationInput !== 'RESTORE ALL DATA') {
      setFullRestoreError('Confirmation phrase mismatch. Required: "RESTORE ALL DATA".');
      return;
    }
    if (!fullAckChecked) {
      setFullRestoreError('Explicit administrator acknowledgement is required.');
      return;
    }

    if (!fullDryRunResult || fullDryRunResult.status === 'BLOCKED' || fullDryRunResult.valid === false || fullDryRunResult.executionAllowed === false) {
      setFullRestoreError('Full restore execution is blocked by preflight engine or conflicting constraints.');
      return;
    }

    setShowFullRestoreConfirmModal(false);
    setIsFullRestoreExecuting(true);
    setFullRestoreError(null);

    try {
      const selectedSnap = snapshots.find(s => s.id === fullSnapshotId);
      const payload = selectedSnap && fullSnapshotId !== 'LIVE_BASELINE'
        ? { snapshotId: selectedSnap.id, checksum: selectedSnap.checksum }
        : null;

      const res = await apiClient.executeFullRestore(
        'RESTORE ALL DATA',
        payload,
        fullDryRunResult.plan || fullDryRunResult
      );

      if (res) {
        setFullRestoreResult(res);
        fetchStatus();
        fetchSnapshots();
      }
    } catch (err: any) {
      setFullRestoreError(err?.message || 'Full snapshot restore execution failed.');
    } finally {
      setIsFullRestoreExecuting(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchSnapshots();
  }, [user]);

  // Scope icons & label mapping
  const scopeConfig: Record<string, { label: string; icon: React.ElementType; description: string }> = {
    QUESTION: { label: 'Question Entity', icon: Sparkles, description: 'Single question record recovery' },
    VIDEO: { label: 'Video Entity', icon: Kanban, description: 'Production video record recovery' },
    SCRIPT: { label: 'Script Entity', icon: FileText, description: 'Script and version history recovery' },
    THUMBNAIL: { label: 'Thumbnail Entity', icon: Image, description: 'Thumbnail metadata recovery' },
    PINNED_COMMENT: { label: 'Pinned Comment Entity', icon: MessageSquare, description: 'Audience comment recovery' },
    PUBLISHING: { label: 'Publishing Entity', icon: Share2, description: 'Platform publishing state recovery' },
    ASSIGNMENT: { label: 'Assignment Entity', icon: UserCheck, description: 'Team task assignment recovery' },
    FULL_SNAPSHOT: { label: 'Full Snapshot', icon: Database, description: 'Complete system snapshot restoration' },
  };

  // 1. Unauthorized Access State
  if (!user || !isAdmin) {
    return (
      <div className="space-y-6" id="recovery-unauthorized">
        <PageHeader
          title="Recovery Administration"
          description="System recovery status, backup capabilities & safety verification"
        />
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">Access Denied</h2>
          <p className="text-sm text-slate-400 max-w-md mb-4">
            Recovery Administration is restricted to users with <span className="font-semibold text-slate-200">ADMIN</span> privileges. You are currently authenticated as <span className="font-mono text-indigo-400">{user?.role || 'Guest'}</span>.
          </p>
          <div className="px-4 py-2 bg-slate-950/60 rounded-lg border border-slate-800 text-xs text-slate-500 font-mono">
            RBAC Enforced: UserRole.ADMIN required
          </div>
        </div>
      </div>
    );
  }

  // 2. Loading State
  if (isLoading) {
    return (
      <div className="space-y-6" id="recovery-loading">
        <PageHeader
          title="Recovery Administration"
          description="System recovery status, backup capabilities & safety verification"
        />
        <div className="p-12 bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium text-slate-300">Retrieving system recovery status...</p>
          <p className="text-xs text-slate-500 mt-1">Checking snapshot capabilities, validator services & safety flags</p>
        </div>
      </div>
    );
  }

  // 3. Error State
  if (error) {
    return (
      <div className="space-y-6" id="recovery-error">
        <PageHeader
          title="Recovery Administration"
          description="System recovery status, backup capabilities & safety verification"
        />
        <div className="p-8 bg-slate-900 border border-rose-900/50 rounded-xl flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-rose-300 mb-1">Failed to Load Recovery Status</h2>
          <p className="text-xs text-slate-400 max-w-lg mb-6">{error}</p>
          <Button variant="secondary" onClick={fetchStatus}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry System Check
          </Button>
        </div>
      </div>
    );
  }

  // 4. Successful Recovery Status View (READ-ONLY)
  return (
    <div className="space-y-6" id="recovery-admin-dashboard">
      <PageHeader
        title="Recovery Administration"
        description="System recovery status, backup capabilities & safety verification"
        actions={
          <Button variant="outline" size="sm" onClick={handleRefreshAll}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh Status
          </Button>
        }
      />

      {/* System Safety Banner */}
      <div className="p-4 bg-slate-900 border border-emerald-900/40 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-100">Read-Only Administrative Interface</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              This dashboard provides operational visibility into recovery systems. No restore actions can be initiated from this view.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs flex items-center gap-2">
            <span className="text-slate-400">Read-Only Mode:</span>
            <span className="font-mono text-emerald-400 font-semibold">
              {status?.safety?.readOnly ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs flex items-center gap-2">
            <span className="text-slate-400">Production Mutations:</span>
            <span className="font-mono text-emerald-400 font-semibold">
              {status?.safety?.productionMutationPerformed ? 'YES (Mutated)' : 'NO (Safe)'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Backup Capabilities Card */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4" id="backup-capability-card">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-slate-100">Backup Capability</h3>
            </div>
            <span className="text-xs font-mono text-slate-500">Exporter Service</span>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800/80 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-slate-200 block">Snapshot Exporter Availability</span>
              <span className="text-xs text-slate-400">Generates full system Google Sheets snapshots</span>
            </div>
            {status?.backupCapability?.snapshotExporterAvailable ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Available
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <XCircle className="w-3.5 h-3.5" />
                Unavailable
              </span>
            )}
          </div>
        </div>

        {/* Durable Archive Status Card (Task 3F.4.10D) */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4" id="durable-archive-status-card">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Cloud className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-slate-100">Durable Snapshot Archive</h3>
            </div>
            <span className="text-xs font-mono text-slate-500">GCS Storage</span>
          </div>

          {status?.durableArchive?.enabled ? (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg flex items-center justify-between" id="durable-archive-enabled-banner">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-emerald-200">DURABLE ARCHIVE ACTIVE</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ENABLED
              </span>
            </div>
          ) : (
            <div className="p-3 bg-slate-950/80 border border-amber-900/50 rounded-lg flex flex-col gap-1" id="durable-archive-disabled-banner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CloudOff className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs font-bold text-amber-300">DURABLE ARCHIVE DISABLED</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-400">
                  DISABLED
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                GCS_SNAPSHOT_ENABLED=false. Persistent cloud storage archiving is disabled. In-memory baselines remain active.
              </p>
            </div>
          )}

          <div className="space-y-2 text-xs">
            <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400 font-medium">Archive Availability:</span>
              <span className="font-mono text-slate-200">
                {status?.durableArchive?.isGcsConfigured ? 'Configured' : 'Unconfigured'}
              </span>
            </div>
            <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400 font-medium">Bucket:</span>
              <span className="font-mono text-slate-300">{status?.durableArchive?.bucketNameMasked || 'Unconfigured'}</span>
            </div>
            <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400 font-medium">Retention Policy:</span>
              <span className="font-mono text-slate-200">{status?.durableArchive?.retentionDays || 365} Days</span>
            </div>
            <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400 font-medium">Durable Snapshot Count:</span>
              <span className="font-mono font-bold text-indigo-300">{status?.durableArchive?.durableSnapshotCount ?? 0}</span>
            </div>
            <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400 font-medium">Latest Durable Archive:</span>
              <span className="font-mono text-slate-300 text-[11px]">
                {status?.durableArchive?.latestDurableSnapshot ? new Date(status.durableArchive.latestDurableSnapshot).toLocaleDateString() : 'None'}
              </span>
            </div>
            <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-400 font-medium">Archive Integrity:</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                status?.durableArchive?.integrityStatus === 'CORRUPTED'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                <ShieldCheck className="w-3 h-3" />
                {status?.durableArchive?.integrityStatus || 'VALID'}
              </span>
            </div>
          </div>

          {status?.durableArchive?.enabled && (
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <Button
                id="create-durable-archive-btn"
                variant="outline"
                size="sm"
                onClick={handleCreateDurableArchive}
                disabled={isCreatingArchive}
                className="w-full border-indigo-500/40 text-indigo-300 hover:bg-indigo-950/40"
              >
                <Cloud className={`w-3.5 h-3.5 mr-1.5 ${isCreatingArchive ? 'animate-spin' : ''}`} />
                {isCreatingArchive ? 'Archiving Snapshot...' : 'Create Durable Archive (On-Demand)'}
              </Button>
              {createArchiveResult && (
                <p className="text-[11px] text-emerald-400 font-mono text-center">{createArchiveResult}</p>
              )}
              {createArchiveError && (
                <p className="text-[11px] text-rose-400 font-mono text-center">{createArchiveError}</p>
              )}
            </div>
          )}
        </div>

        {/* Recovery Capabilities Card */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4" id="recovery-capability-card">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-slate-100">Recovery Capability</h3>
            </div>
            <span className="text-xs font-mono text-slate-500">Engine Services</span>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-200 block">Restore Validator</span>
                <span className="text-[11px] text-slate-500">Snapshot schema & checksum verification</span>
              </div>
              {status?.recoveryCapability?.validatorAvailable ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <XCircle className="w-3 h-3" /> Unavailable
                </span>
              )}
            </div>

            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-200 block">Granular Restore</span>
                <span className="text-[11px] text-slate-500">Targeted entity-level restore services</span>
              </div>
              {status?.recoveryCapability?.granularRestoreAvailable ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <XCircle className="w-3 h-3" /> Unavailable
                </span>
              )}
            </div>

            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-200 block">Full Restore Planner</span>
                <span className="text-[11px] text-slate-500">Dry-run dependency & conflict analysis</span>
              </div>
              {status?.recoveryCapability?.fullRestorePlannerAvailable ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <XCircle className="w-3 h-3" /> Unavailable
                </span>
              )}
            </div>

            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-200 block">Full Restore Execution</span>
                <span className="text-[11px] text-slate-500">Full system snapshot restore execution engine</span>
              </div>
              {status?.recoveryCapability?.fullRestoreExecutionAvailable ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <XCircle className="w-3 h-3" /> Unavailable
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Supported Recovery Scopes Card */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4" id="supported-scopes-card">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-slate-100">Supported Recovery Scopes</h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {status?.supportedScopes?.length || 8} Registered Scopes
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(status?.supportedScopes || [
            'QUESTION',
            'VIDEO',
            'SCRIPT',
            'THUMBNAIL',
            'PINNED_COMMENT',
            'PUBLISHING',
            'ASSIGNMENT',
            'FULL_SNAPSHOT',
          ]).map((scopeKey) => {
            const conf = scopeConfig[scopeKey] || {
              label: scopeKey,
              icon: Layers,
              description: `${scopeKey} scope recovery`,
            };
            const IconComponent = conf.icon;
            return (
              <div
                key={scopeKey}
                className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800/80 flex flex-col justify-between space-y-2 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {scopeKey}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{conf.label}</h4>
                  <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{conf.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task 3F.4.9F.2: Snapshot History Section */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4" id="snapshot-history-section">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">Snapshot History</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Available system backup snapshots and deterministic SHA-256 checksum metadata.
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchSnapshots} disabled={isSnapshotsLoading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isSnapshotsLoading ? 'animate-spin' : ''}`} />
            Refresh History
          </Button>
        </div>

        {/* Snapshot History UI States */}
        {isSnapshotsLoading ? (
          <div className="p-8 bg-slate-950/60 rounded-lg border border-slate-800/80 flex flex-col items-center justify-center text-center" id="snapshot-history-loading">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-slate-400 font-medium">Loading snapshot metadata...</p>
          </div>
        ) : snapshotsError ? (
          <div className="p-6 bg-slate-950/60 rounded-lg border border-rose-900/40 flex flex-col items-center justify-center text-center" id="snapshot-history-error">
            <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
            <p className="text-xs font-semibold text-rose-300">Failed to load snapshot history</p>
            <p className="text-[11px] text-slate-400 max-w-md mt-1 mb-3">{snapshotsError}</p>
            <Button variant="secondary" size="sm" onClick={fetchSnapshots}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
            </Button>
          </div>
        ) : snapshots.length === 0 ? (
          <div className="p-8 bg-slate-950/60 rounded-lg border border-slate-800/80 flex flex-col items-center justify-center text-center" id="snapshot-history-empty">
            <FileCheck className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-300">No Snapshots Found</p>
            <p className="text-xs text-slate-500 max-w-sm mt-0.5">
              No historical Google Sheets snapshots have been registered or exported yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto" id="snapshot-history-table">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Snapshot ID</th>
                  <th className="py-3 px-4">Worksheets</th>
                  <th className="py-3 px-4">Rows</th>
                  <th className="py-3 px-4">Checksum</th>
                  <th className="py-3 px-4">Integrity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {snapshots.map((snap) => (
                  <tr key={snap.id} className="hover:bg-slate-850/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {new Date(snap.exportTimestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-indigo-400">
                      {snap.id}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {snap.totalWorksheets}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {snap.totalRows}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400" title={snap.checksum}>
                      {snap.checksum ? `${snap.checksum.substring(0, 10)}...` : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                        snap.integrityStatus === 'CORRUPTED'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" />
                        {snap.integrityStatus || 'VALID'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {snap.status === 'DURABLE_ARCHIVE' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" title="Durable GCS Cloud Storage Archive">
                          <Cloud className="w-3 h-3 text-indigo-400" />
                          DURABLE_ARCHIVE
                        </span>
                      ) : snap.status === 'SYSTEM_BASELINE' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20" title="In-Memory Live Baseline — Not Persisted to GCS">
                          <HardDrive className="w-3 h-3 text-amber-400" />
                          SYSTEM_BASELINE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-300">
                          {snap.status || 'AVAILABLE'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSnapshotDetail(snap);
                          setRetrievedSnapshotPayload(null);
                          setRetrievalError(null);
                          setRetrievalVerificationStatus(null);
                        }}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task 3F.4.9F.3: Restore Preview / Dry Run Section (100% Read-only Planning UI) */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-6" id="restore-preview-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <RotateCcw className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">Restore Preview / Dry Run</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate recovery preflight, dependency validation & impact analysis before executing.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldAlert className="w-3.5 h-3.5" />
              DRY RUN ONLY — NO DATA HAS BEEN MODIFIED
            </span>
          </div>
        </div>

        {/* Snapshot Selection & Trigger Controls */}
        <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <label htmlFor="snapshot-select" className="block text-xs font-semibold text-slate-300 mb-1">
                Select Recovery Target Snapshot:
              </label>
              <select
                id="snapshot-select"
                value={selectedSnapshotId}
                onChange={(e) => setSelectedSnapshotId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="LIVE_BASELINE">Current System Baseline (Live Export)</option>
                {snapshots.map((snap) => (
                  <option key={snap.id} value={snap.id}>
                    {snap.id} — {snap.spreadsheetTitle} ({new Date(snap.exportTimestamp).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:self-end">
              <Button
                id="run-dry-run-btn"
                variant="primary"
                size="sm"
                onClick={handleRunDryRun}
                disabled={isDryRunLoading}
              >
                <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${isDryRunLoading ? 'animate-spin' : ''}`} />
                {isDryRunLoading ? 'Simulating Dry Run...' : 'Run Dry Run / Preview'}
              </Button>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 italic">
            Note: Snapshot metadata & dry-run analysis are generated dynamically from live baseline state. Historical snapshot files are not stored persistently in cloud archives.
          </p>
        </div>

        {/* UI State: Loading */}
        {isDryRunLoading && (
          <div className="p-10 bg-slate-950/60 rounded-lg border border-slate-800/80 flex flex-col items-center justify-center text-center space-y-3" id="dry-run-loading">
            <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <div>
              <p className="text-sm font-semibold text-slate-200">Executing Read-Only Dry Run Preflight...</p>
              <p className="text-xs text-slate-400 mt-0.5">Validating schemas, foreign keys, sequence safety, and immutable versions.</p>
            </div>
          </div>
        )}

        {/* UI State: Error */}
        {!isDryRunLoading && dryRunError && (
          <div className="p-6 bg-slate-950/60 rounded-lg border border-rose-900/40 flex flex-col items-center justify-center text-center space-y-2" id="dry-run-error">
            <AlertCircle className="w-8 h-8 text-rose-400" />
            <p className="text-xs font-semibold text-rose-300">Dry-Run Simulation Error</p>
            <p className="text-xs text-slate-400 max-w-md">{dryRunError}</p>
            <Button variant="secondary" size="sm" onClick={handleRunDryRun} className="mt-2">
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry Dry Run
            </Button>
          </div>
        )}

        {/* UI State: Empty / Initial Prompt */}
        {!isDryRunLoading && !dryRunError && !dryRunResult && (
          <div className="p-10 bg-slate-950/60 rounded-lg border border-slate-800/80 flex flex-col items-center justify-center text-center space-y-2" id="dry-run-empty">
            <FileCheck className="w-10 h-10 text-slate-600 mb-1" />
            <p className="text-sm font-semibold text-slate-300">No Dry Run Preview Active</p>
            <p className="text-xs text-slate-500 max-w-sm">
              Select a target snapshot above and click "Run Dry Run / Preview" to view impact analysis and dependency verification.
            </p>
          </div>
        )}

        {/* UI State: Active Dry Run Result */}
        {!isDryRunLoading && !dryRunError && dryRunResult && (
          <div className="space-y-6">
            {/* Status & Safety Banner */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              dryRunResult.executionAllowed && dryRunResult.valid
                ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                : 'bg-amber-950/30 border-amber-800/60 text-amber-200'
            }`}>
              <div className="flex items-center gap-3">
                {dryRunResult.executionAllowed && dryRunResult.valid ? (
                  <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                ) : (
                  <ShieldAlert className="w-8 h-8 text-amber-400 shrink-0" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-100">
                      Recovery Status: {dryRunResult.executionAllowed && dryRunResult.valid ? 'SAFE / READY' : 'BLOCKED'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      dryRunResult.executionAllowed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      Execution Allowed: {dryRunResult.executionAllowed ? 'TRUE' : 'FALSE'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Plan ID: <code className="font-mono text-indigo-300">{dryRunResult.planId || 'PLAN-DRYRUN-BASELINE'}</code> | Snapshot Checksum: <code className="font-mono text-emerald-400">{dryRunResult.snapshotChecksum || dryRunResult.checksum || 'VALID'}</code>
                  </p>
                </div>
              </div>
              <div className="text-right sm:self-center">
                <span className="inline-block px-3 py-1 rounded-md text-xs font-mono font-bold bg-slate-950 border border-slate-800 text-slate-300">
                  DRY RUN ONLY — NO RESTORE EXECUTED
                </span>
              </div>
            </div>

            {/* Operations Summary Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Operation Impact Summary</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg text-center">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">CREATE</span>
                  <span className="text-lg font-bold font-mono text-emerald-400">{dryRunResult.createCount || 0}</span>
                </div>
                <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg text-center">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">UPDATE</span>
                  <span className="text-lg font-bold font-mono text-amber-400">{dryRunResult.updateCount || 0}</span>
                </div>
                <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg text-center">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">NO_CHANGE</span>
                  <span className="text-lg font-bold font-mono text-slate-400">{dryRunResult.unchangedCount || 0}</span>
                </div>
                <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg text-center">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">CONFLICT</span>
                  <span className="text-lg font-bold font-mono text-rose-400">{dryRunResult.conflictCount || 0}</span>
                </div>
                <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg text-center">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">BLOCKED</span>
                  <span className="text-lg font-bold font-mono text-rose-500">{dryRunResult.dependencyErrorCount || 0}</span>
                </div>
                <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg text-center">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">PRESERVE_EXISTING</span>
                  <span className="text-lg font-bold font-mono text-indigo-400">
                    {dryRunResult.immutableVersionOperationCount || dryRunResult.preservedExistingCount || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Conflicts & Missing Dependencies Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Conflicts Box */}
              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2" id="dry-run-conflicts">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <h4 className="text-xs font-bold text-slate-200">Conflicts Analysis</h4>
                </div>
                {dryRunResult.conflictCount > 0 || (dryRunResult.blockingIssues && dryRunResult.blockingIssues.length > 0) ? (
                  <ul className="space-y-1 text-xs text-rose-300 list-disc list-inside">
                    {dryRunResult.blockingIssues?.map((issue: string, idx: number) => (
                      <li key={idx}>{issue}</li>
                    )) || <li>{dryRunResult.conflictCount} record conflict(s) detected.</li>}
                  </ul>
                ) : (
                  <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> No active record conflicts detected.
                  </p>
                )}
              </div>

              {/* Missing Dependencies Box */}
              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2" id="dry-run-missing-deps">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-slate-200">Missing Dependencies</h4>
                </div>
                {dryRunResult.dependencyErrorCount > 0 ? (
                  <p className="text-xs text-amber-300">
                    {dryRunResult.dependencyErrorCount} missing parent dependency reference(s) flagged.
                  </p>
                ) : (
                  <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> All parent entity dependencies fully resolved.
                  </p>
                )}
              </div>
            </div>

            {/* Sequence Safety & Immutable Versions Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sequence Warnings */}
              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2" id="dry-run-sequence-warnings">
                <div className="flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold text-slate-200">Sequence Protection Warnings</h4>
                </div>
                {dryRunResult.sequenceWarningCount > 0 ? (
                  <p className="text-xs text-amber-300">
                    {dryRunResult.sequenceWarningCount} sequence warning(s) detected. Forward-only order enforced.
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">
                    Forward-only sequence enforcement active. Zero sequence rollbacks detected.
                  </p>
                )}
              </div>

              {/* Immutable Version Protection */}
              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2" id="dry-run-immutable-status">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold text-slate-200">Immutable Version Restrictions</h4>
                </div>
                <p className="text-xs text-slate-300">
                  3 Immutable Version Entities Protected (<code className="font-mono text-indigo-300">SCRIPT_VERSIONS</code>, <code className="font-mono text-indigo-300">THUMBNAIL_VERSIONS</code>, <code className="font-mono text-indigo-300">PINNED_COMMENT_VERSIONS</code>). Updates and deletes are strictly prohibited.
                </p>
              </div>
            </div>

            {/* 19-Worksheet Exact Dependency Order */}
            <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-3" id="dry-run-dependency-order">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200">Exact 19-Worksheet Restore Execution Order</h4>
                <span className="text-[10px] font-mono text-slate-400">Strict Topo-Sort Dependency Hierarchy</span>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
                {[
                  '1. CATEGORIES',
                  '2. TOPICS',
                  '3. SUBTOPICS',
                  '4. USERS',
                  '5. CONTENT_PLANS',
                  '6. CONTENT_BATCHES',
                  '7. QUESTIONS',
                  '8. VIDEOS',
                  '9. SCRIPT',
                  '10. SCRIPT_VERSIONS',
                  '11. THUMBNAILS',
                  '12. THUMBNAIL_VERSIONS',
                  '13. PINNED_COMMENTS',
                  '14. PINNED_COMMENT_VERSIONS',
                  '15. ASSIGNMENTS',
                  '16. PUBLISHING',
                  '17. WORKFLOW',
                  '18. AUDIT_LOG',
                  '19. SEQUENCES',
                ].map((step, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:border-indigo-500/50 transition-colors"
                  >
                    {step}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task 3F.4.9F.4: Granular Restore Section (ADMIN-only Controlled Mutation UI) */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-6" id="granular-restore-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">Granular Restore</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Restore ONE selected record at a time from a verified snapshot.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              GRANULAR RESTORE — ONE RECORD ONLY
            </span>
          </div>
        </div>

        {/* Step 1 - 4: Controls Grid */}
        <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Step 1: Target Snapshot Selector */}
            <div>
              <label htmlFor="granular-snapshot-select" className="block text-xs font-semibold text-slate-300 mb-1">
                1. Select Target Snapshot:
              </label>
              <select
                id="granular-snapshot-select"
                value={granularSnapshotId}
                onChange={(e) => {
                  setGranularSnapshotId(e.target.value);
                  setGranularValidationResult(null);
                }}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="LIVE_BASELINE">Current System Baseline (Live Export)</option>
                {snapshots.map((snap) => (
                  <option key={snap.id} value={snap.id}>
                    {snap.id} — {snap.spreadsheetTitle} ({new Date(snap.exportTimestamp).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Entity Type Selector */}
            <div>
              <label htmlFor="granular-entity-type-select" className="block text-xs font-semibold text-slate-300 mb-1">
                2. Select Entity Type:
              </label>
              <select
                id="granular-entity-type-select"
                value={granularEntityType}
                onChange={(e) => {
                  setGranularEntityType(e.target.value);
                  setGranularValidationResult(null);
                  setGranularConfirmationInput('');
                }}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="QUESTION">QUESTION (Question Record)</option>
                <option value="VIDEO">VIDEO (Video Record)</option>
                <option value="SCRIPT">SCRIPT (Script Record)</option>
                <option value="THUMBNAIL">THUMBNAIL (Thumbnail Record)</option>
                <option value="PINNED_COMMENT">PINNED_COMMENT (Pinned Comment Record)</option>
                <option value="PUBLISHING">PUBLISHING (Publishing Record)</option>
                <option value="ASSIGNMENT">ASSIGNMENT (Assignment Record)</option>
              </select>
            </div>

            {/* Step 3: Entity ID Input */}
            <div>
              <label htmlFor="granular-entity-id-input" className="block text-xs font-semibold text-slate-300 mb-1">
                3. Target Entity ID:
              </label>
              <input
                id="granular-entity-id-input"
                type="text"
                value={granularEntityId}
                onChange={(e) => {
                  setGranularEntityId(e.target.value);
                  setGranularValidationResult(null);
                }}
                placeholder="e.g. QST-001 or VID-001"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Step 4: Run Preflight Validation Button */}
          <div className="flex justify-end pt-2 border-t border-slate-800/80">
            <Button
              id="granular-validate-btn"
              variant="secondary"
              size="sm"
              onClick={handleValidateGranular}
              disabled={isGranularValidating || !granularEntityId.trim()}
            >
              <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${isGranularValidating ? 'animate-spin' : ''}`} />
              {isGranularValidating ? 'Validating Record Preflight...' : 'Run Record Validation / Preflight'}
            </Button>
          </div>
        </div>

        {/* UI State: Validation Loading */}
        {isGranularValidating && (
          <div className="p-8 bg-slate-950/60 rounded-lg border border-slate-800/80 flex flex-col items-center justify-center text-center space-y-2" id="granular-loading">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-200">Running Granular Record Preflight Validation...</p>
            <p className="text-[11px] text-slate-400">Verifying entity existence, parent references, conflicts, and version safety.</p>
          </div>
        )}

        {/* UI State: Validation Error */}
        {!isGranularValidating && granularValidationError && (
          <div className="p-4 bg-slate-950/60 rounded-lg border border-rose-900/40 flex items-center gap-3 text-rose-300" id="granular-error">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold">Validation Error:</span> {granularValidationError}
            </div>
          </div>
        )}

        {/* Validation Result Display: Step 5 & 6 */}
        {!isGranularValidating && granularValidationResult && (
          <div className="space-y-4">
            {/* Preflight Summary Banner */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              granularValidationResult.valid && granularValidationResult.proposedOperation !== 'REJECTED'
                ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                : 'bg-rose-950/30 border-rose-800/60 text-rose-200'
            }`}>
              <div className="flex items-center gap-3">
                {granularValidationResult.valid && granularValidationResult.proposedOperation !== 'REJECTED' ? (
                  <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-7 h-7 text-rose-400 shrink-0" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-100">
                      Proposed Operation:
                    </span>
                    <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase ${
                      granularValidationResult.proposedOperation === 'CREATE' ? 'bg-emerald-500/20 text-emerald-300' :
                      granularValidationResult.proposedOperation === 'UPDATE' ? 'bg-amber-500/20 text-amber-300' :
                      granularValidationResult.proposedOperation === 'NO_CHANGE' ? 'bg-slate-500/20 text-slate-300' :
                      'bg-rose-500/20 text-rose-300'
                    }`}>
                      {granularValidationResult.proposedOperation || 'REJECTED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Target: <code className="font-mono text-indigo-300">{granularEntityType}:{granularEntityId}</code> | Snapshot Checksum: <code className="font-mono text-emerald-400">{granularValidationResult.snapshotChecksum || 'VALID'}</code>
                  </p>
                </div>
              </div>
              <div>
                <span className={`inline-block px-3 py-1 rounded text-xs font-mono font-bold ${
                  granularValidationResult.valid && granularValidationResult.proposedOperation !== 'REJECTED'
                    ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                    : 'bg-rose-950 border border-rose-800 text-rose-300'
                }`}>
                  {granularValidationResult.valid && granularValidationResult.proposedOperation !== 'REJECTED' ? 'READY FOR CONFIRMATION' : 'EXECUTION BLOCKED'}
                </span>
              </div>
            </div>

            {/* Conflicts & Missing Dependencies Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Conflicts Box */}
              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2" id="granular-conflicts-box">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <h4 className="text-xs font-bold text-slate-200">Conflicts Analysis</h4>
                </div>
                {granularValidationResult.conflicts && granularValidationResult.conflicts.length > 0 ? (
                  <ul className="space-y-1 text-xs text-rose-300 list-disc list-inside">
                    {granularValidationResult.conflicts.map((c: any, idx: number) => (
                      <li key={idx}>{c.reason || c.entityId || JSON.stringify(c)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> No active record conflicts detected.
                  </p>
                )}
              </div>

              {/* Missing Dependencies Box */}
              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2" id="granular-missing-deps-box">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-slate-200">Missing Parent Dependencies</h4>
                </div>
                {granularValidationResult.missingDependencies && granularValidationResult.missingDependencies.length > 0 ? (
                  <ul className="space-y-1 text-xs text-amber-300 list-disc list-inside">
                    {granularValidationResult.missingDependencies.map((d: any, idx: number) => (
                      <li key={idx}>Missing key: {d.missingKey || d.entityId}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> All parent dependencies resolved.
                  </p>
                )}
              </div>
            </div>

            {/* Sequence Notice & Immutable Notice */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sequence Safety Notice */}
              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1" id="granular-sequence-notice">
                <div className="flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold text-slate-200">Sequence Safety</h4>
                </div>
                <p className="text-xs text-slate-400">
                  Forward-only sequence enforcement active. Manual counter overrides are strictly disabled.
                </p>
              </div>

              {/* Immutable Version Safety Notice */}
              <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1" id="granular-immutable-notice">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold text-slate-200">Immutable Version Restriction</h4>
                </div>
                <p className="text-xs text-slate-400">
                  Version tables (<code className="font-mono text-indigo-300">SCRIPT_VERSIONS</code>, <code className="font-mono text-indigo-300">THUMBNAIL_VERSIONS</code>, <code className="font-mono text-indigo-300">PINNED_COMMENT_VERSIONS</code>) are append-only. Version updates and deletes are prohibited.
                </p>
              </div>
            </div>

            {/* Step 7 & 8: Confirmation & Execution Gate */}
            {granularValidationResult.valid && granularValidationResult.proposedOperation !== 'REJECTED' ? (
              <div className="p-4 bg-indigo-950/20 border border-indigo-800/50 rounded-xl space-y-3">
                <div className="space-y-1">
                  <label htmlFor="granular-confirmation-input" className="block text-xs font-bold text-indigo-300">
                    7. Required Confirmation Gate:
                  </label>
                  <p className="text-xs text-slate-400">
                    To execute restore, type exact phrase: <code className="font-mono font-bold text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 select-all">"{CONFIRMATION_PHRASES[granularEntityType] || `RESTORE ${granularEntityType}`}"</code>
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    id="granular-confirmation-input"
                    type="text"
                    value={granularConfirmationInput}
                    onChange={(e) => setGranularConfirmationInput(e.target.value)}
                    placeholder={`Type "${CONFIRMATION_PHRASES[granularEntityType] || `RESTORE ${granularEntityType}`}"`}
                    className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <Button
                    id="granular-execute-btn"
                    variant="primary"
                    size="sm"
                    onClick={handleExecuteGranularRestore}
                    disabled={
                      isGranularRestoring ||
                      granularConfirmationInput !== (CONFIRMATION_PHRASES[granularEntityType] || `RESTORE ${granularEntityType}`)
                    }
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-bold"
                  >
                    <ShieldCheck className={`w-3.5 h-3.5 mr-1.5 ${isGranularRestoring ? 'animate-spin' : ''}`} />
                    {isGranularRestoring ? 'Executing Restoration...' : 'Execute Granular Restore'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-rose-950/20 border border-rose-800/50 rounded-xl text-center space-y-1">
                <p className="text-xs font-bold text-rose-300">Restoration Blocked by Preflight Engine</p>
                <p className="text-[11px] text-slate-400">
                  Execution is automatically disabled when preflight returns conflicts or unresolvable dependencies. "Force Restore" is disabled.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Restore Error Display */}
        {granularRestoreError && (
          <div className="p-4 bg-slate-950/60 rounded-lg border border-rose-900/40 flex items-center gap-3 text-rose-300">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold">Restore Execution Error:</span> {granularRestoreError}
            </div>
          </div>
        )}

        {/* Step 9 & 10: Execution Result Display */}
        {granularRestoreResult && (
          <div className="p-5 bg-emerald-950/30 border border-emerald-800/60 rounded-xl space-y-3" id="granular-restore-result">
            <div className="flex items-center gap-2.5 border-b border-emerald-800/40 pb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <div>
                <h4 className="text-sm font-bold text-emerald-200">Granular Restore Execution Completed</h4>
                <p className="text-xs text-slate-300">
                  Entity <code className="font-mono font-bold text-emerald-300">{granularRestoreResult.entityId}</code> restored successfully with operation: <span className="font-mono font-bold text-emerald-400">{granularRestoreResult.operation}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Persisted to DB</span>
                <span className="font-mono font-bold text-emerald-400">{granularRestoreResult.persisted ? 'TRUE' : 'FALSE'}</span>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Audit Recorded</span>
                <span className="font-mono font-bold text-emerald-400">{granularRestoreResult.auditRecorded ? 'TRUE' : 'FALSE'}</span>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Workflow Recorded</span>
                <span className="font-mono font-bold text-emerald-400">{granularRestoreResult.workflowRecorded ? 'TRUE' : 'FALSE'}</span>
              </div>
              <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Snapshot Checksum</span>
                <span className="font-mono text-[11px] text-slate-300 truncate block">{granularRestoreResult.snapshotChecksum || 'VERIFIED'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task 3F.4.9F.5: Full Snapshot Restore Section (ADMIN-only High-Impact Controlled Mutation UI) */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-6" id="full-restore-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">Full Snapshot Restore</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Restores complete 19-worksheet snapshot state into system storage with strict preflight verification.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-3.5 h-3.5" />
              FULL RESTORE — HIGH IMPACT DESTRUCTIVE OPERATION
            </span>
          </div>
        </div>

        {/* Persistence Limitation Notice */}
        <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg flex items-start gap-2.5 text-xs text-slate-300" id="full-restore-persistence-limitation-notice">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-200">Snapshot Persistence Limitation:</span> Snapshots are generated dynamically from current live system state and in-memory baseline models. Historical archived snapshots rely on live export verification; cloud database persistence archives do not auto-persist legacy files.
          </div>
        </div>

        {/* Step 1 & 2: Controls Grid */}
        <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Step 1: Select Snapshot */}
            <div>
              <label htmlFor="full-restore-snapshot-select" className="block text-xs font-semibold text-slate-300 mb-1">
                1. Select Target Snapshot:
              </label>
              <select
                id="full-restore-snapshot-select"
                value={fullSnapshotId}
                onChange={(e) => {
                  setFullSnapshotId(e.target.value);
                  setFullDryRunResult(null);
                  setFullAckChecked(false);
                  setFullConfirmationInput('');
                }}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="LIVE_BASELINE">Current System Baseline (Live Export)</option>
                {snapshots.map((snap) => (
                  <option key={snap.id} value={snap.id}>
                    {snap.id} — {snap.spreadsheetTitle} ({new Date(snap.exportTimestamp).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Run Preflight & Dry Run Trigger */}
            <div className="flex items-end">
              <Button
                id="full-restore-dryrun-btn"
                variant="secondary"
                size="sm"
                onClick={handleRunFullPreflight}
                disabled={isFullDryRunLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2"
              >
                <RotateCcw className={`w-3.5 h-3.5 mr-1.5 ${isFullDryRunLoading ? 'animate-spin' : ''}`} />
                {isFullDryRunLoading ? 'Running Full Preflight & Generating Plan...' : 'Run Full Preflight & Generate Restore Plan'}
              </Button>
            </div>
          </div>
        </div>

        {/* UI State: Preflight Loading */}
        {isFullDryRunLoading && (
          <div className="p-8 bg-slate-950/60 rounded-lg border border-slate-800/80 flex flex-col items-center justify-center text-center space-y-2" id="full-restore-loading">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-200">Analyzing Snapshot & Generating 19-Worksheet Restore Plan...</p>
            <p className="text-[11px] text-slate-400">Verifying checksums, schema constraints, foreign key graphs, sequence states, and version ledgers.</p>
          </div>
        )}

        {/* UI State: Preflight Error */}
        {!isFullDryRunLoading && fullDryRunError && (
          <div className="p-4 bg-slate-950/60 rounded-lg border border-rose-900/40 flex items-center gap-3 text-rose-300" id="full-restore-error">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold">Preflight Execution Error:</span> {fullDryRunError}
            </div>
          </div>
        )}

        {/* Step 3 - 8: Preflight Analysis & Plan Summary */}
        {!isFullDryRunLoading && fullDryRunResult && (
          <div className="space-y-5">
            {/* Status Banner */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              fullDryRunResult.status !== 'BLOCKED' && fullDryRunResult.valid !== false && (fullDryRunResult.executionAllowed !== false)
                ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                : 'bg-rose-950/30 border-rose-800/60 text-rose-200'
            }`}>
              <div className="flex items-center gap-3">
                {fullDryRunResult.status !== 'BLOCKED' && fullDryRunResult.valid !== false && (fullDryRunResult.executionAllowed !== false) ? (
                  <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-7 h-7 text-rose-400 shrink-0" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-100">Restore Plan Status:</span>
                    <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase ${
                      fullDryRunResult.status === 'SAFE' || fullDryRunResult.valid ? 'bg-emerald-500/20 text-emerald-300' :
                      fullDryRunResult.status === 'WARNINGS' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-rose-500/20 text-rose-300'
                    }`}>
                      {fullDryRunResult.status || (fullDryRunResult.valid ? 'SAFE' : 'BLOCKED')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Checksum: <code className="font-mono text-emerald-400">{fullDryRunResult.snapshotChecksum || fullDryRunResult.plan?.snapshotChecksum || 'VERIFIED'}</code> | Executable: <span className="font-semibold">{fullDryRunResult.executionAllowed || fullDryRunResult.plan?.executionAllowed ? 'TRUE' : 'FALSE'}</span>
                  </p>
                </div>
              </div>
              <div>
                <span className={`inline-block px-3 py-1 rounded text-xs font-mono font-bold ${
                  fullDryRunResult.status !== 'BLOCKED' && fullDryRunResult.valid !== false && (fullDryRunResult.executionAllowed !== false)
                    ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                    : 'bg-rose-950 border border-rose-800 text-rose-300'
                }`}>
                  {fullDryRunResult.status !== 'BLOCKED' && fullDryRunResult.valid !== false && (fullDryRunResult.executionAllowed !== false) ? 'PREFLIGHT READY' : 'RESTORE BLOCKED'}
                </span>
              </div>
            </div>

            {/* Impact Summary Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] font-semibold uppercase block">Records to Create</span>
                <span className="text-lg font-bold font-mono text-emerald-400" id="full-restore-create-count">
                  {fullDryRunResult.recordsToCreate?.length ?? fullDryRunResult.plan?.recordsToCreate?.length ?? fullDryRunResult.summary?.recordsToCreate ?? 0}
                </span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] font-semibold uppercase block">Records to Update</span>
                <span className="text-lg font-bold font-mono text-amber-400" id="full-restore-update-count">
                  {fullDryRunResult.recordsToUpdate?.length ?? fullDryRunResult.plan?.recordsToUpdate?.length ?? fullDryRunResult.summary?.recordsToUpdate ?? 0}
                </span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] font-semibold uppercase block">Unchanged Records</span>
                <span className="text-lg font-bold font-mono text-slate-300" id="full-restore-unchanged-count">
                  {fullDryRunResult.unchangedRecords?.length ?? fullDryRunResult.plan?.unchangedRecords?.length ?? fullDryRunResult.summary?.unchangedRecords ?? 0}
                </span>
              </div>
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] font-semibold uppercase block">Preserved Existing</span>
                <span className="text-lg font-bold font-mono text-indigo-300" id="full-restore-preserved-count">
                  {fullDryRunResult.preservedRecords?.length ?? fullDryRunResult.plan?.preservedRecords?.length ?? fullDryRunResult.summary?.preservedExistingRecords ?? 0}
                </span>
              </div>
            </div>

            {/* Conflicts & Dependency Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Conflicts Card */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2" id="full-restore-conflicts-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <h4 className="text-xs font-bold text-slate-200">Blocking Conflicts</h4>
                  </div>
                  <span className="font-mono text-xs font-bold text-rose-400" id="full-restore-conflicts-count">
                    {(fullDryRunResult.conflicts?.length || fullDryRunResult.plan?.conflicts?.length || 0)}
                  </span>
                </div>
                {fullDryRunResult.conflicts && fullDryRunResult.conflicts.length > 0 ? (
                  <ul className="space-y-1 text-xs text-rose-300 list-disc list-inside max-h-32 overflow-y-auto" id="full-restore-conflicts-list">
                    {fullDryRunResult.conflicts.map((c: any, idx: number) => (
                      <li key={idx}>{c.reason || c.entityId || JSON.stringify(c)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Zero blocking conflicts detected.
                  </p>
                )}
              </div>

              {/* Missing Dependencies Card */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-slate-200">Missing Dependencies</h4>
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-400" id="full-restore-missing-deps-count">
                    {(fullDryRunResult.missingDependencies?.length || fullDryRunResult.plan?.missingDependencies?.length || 0)}
                  </span>
                </div>
                {fullDryRunResult.missingDependencies && fullDryRunResult.missingDependencies.length > 0 ? (
                  <ul className="space-y-1 text-xs text-amber-300 list-disc list-inside max-h-32 overflow-y-auto" id="full-restore-missing-deps-list">
                    {fullDryRunResult.missingDependencies.map((d: any, idx: number) => (
                      <li key={idx}>{d.missingKey || d.reason || JSON.stringify(d)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> All parent key dependencies satisfied.
                  </p>
                )}
              </div>
            </div>

            {/* Step 6: 19-Worksheet Execution Dependency Order */}
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3" id="full-restore-dependency-order">
              <div className="flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-slate-200">Strict 19-Worksheet Dependency Execution Order</h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-[11px] font-mono">
                {[
                  '1. CATEGORIES', '2. TOPICS', '3. SUBTOPICS', '4. USERS',
                  '5. CONTENT_PLANS', '6. CONTENT_BATCHES', '7. QUESTIONS', '8. VIDEOS',
                  '9. SCRIPT', '10. SCRIPT_VERSIONS', '11. THUMBNAILS', '12. THUMBNAIL_VERSIONS',
                  '13. PINNED_COMMENTS', '14. PINNED_COMMENT_VERSIONS', '15. ASSIGNMENTS',
                  '16. PUBLISHING', '17. WORKFLOW', '18. AUDIT_LOG', '19. SEQUENCES'
                ].map((ws, i) => (
                  <div key={i} className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-300 truncate">
                    {ws}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 7, 8: Immutable Version, Sequence & Deletion Safety Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Immutable Version Protection */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg space-y-1" id="full-restore-immutable-versions-notice">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-400" />
                  <h5 className="text-xs font-bold text-slate-200">Immutable Version Protection</h5>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <code className="text-indigo-300 font-mono">SCRIPT_VERSIONS</code>, <code className="text-indigo-300 font-mono">THUMBNAIL_VERSIONS</code>, and <code className="text-indigo-300 font-mono">PINNED_COMMENT_VERSIONS</code> permit ONLY CREATE or NO_CHANGE. UPDATE and DELETE are strictly prohibited.
                </p>
              </div>

              {/* Sequence Safety */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg space-y-1" id="full-restore-sequence-safety-notice">
                <div className="flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-indigo-400" />
                  <h5 className="text-xs font-bold text-slate-200">Sequence Forward-Only Safety</h5>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Sequences are strictly forward-only. Manual counter edits and rollbacks are disabled. Any sequence rollback attempt blocks execution immediately.
                </p>
              </div>

              {/* Deletion Safety */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg space-y-1" id="full-restore-deletion-safety-notice">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h5 className="text-xs font-bold text-slate-200">Non-Destructive Deletion Protection</h5>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Missing snapshot records NEVER produce DELETE operations. All existing production records absent from the snapshot are preserved safely.
                </p>
              </div>
            </div>

            {/* Step 9 & 10: Acknowledgement Checkbox & Confirmation Phrase Gate */}
            {fullDryRunResult.status !== 'BLOCKED' && fullDryRunResult.valid !== false && (fullDryRunResult.executionAllowed !== false) ? (
              <div className="p-5 bg-rose-950/20 border border-rose-800/50 rounded-xl space-y-4">
                <div className="flex items-start gap-3">
                  <input
                    id="full-restore-ack-checkbox"
                    type="checkbox"
                    checked={fullAckChecked}
                    onChange={(e) => setFullAckChecked(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-slate-700 text-rose-600 focus:ring-rose-500 bg-slate-900"
                  />
                  <label htmlFor="full-restore-ack-checkbox" className="text-xs font-semibold text-slate-200 cursor-pointer select-none">
                    I explicitly acknowledge that a full snapshot restore is a high-impact operation and I have verified the preflight impact summary across all 19 worksheets.
                  </label>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-rose-900/40">
                  <label htmlFor="full-restore-confirmation-input" className="block text-xs font-bold text-rose-300">
                    Required Confirmation Phrase:
                  </label>
                  <p className="text-xs text-slate-400">
                    To enable execution, type exact phrase: <code className="font-mono font-bold text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 select-all">"RESTORE ALL DATA"</code>
                  </p>
                  <input
                    id="full-restore-confirmation-input"
                    type="text"
                    value={fullConfirmationInput}
                    onChange={(e) => setFullConfirmationInput(e.target.value)}
                    placeholder='Type "RESTORE ALL DATA"'
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                  />
                </div>

                {/* Step 11: Final Execute Trigger Button */}
                <div className="flex justify-end pt-2">
                  <Button
                    id="full-restore-execute-btn"
                    variant="primary"
                    size="sm"
                    onClick={() => setShowFullRestoreConfirmModal(true)}
                    disabled={
                      isFullRestoreExecuting ||
                      !fullAckChecked ||
                      fullConfirmationInput !== 'RESTORE ALL DATA' ||
                      fullDryRunResult.status === 'BLOCKED' ||
                      fullDryRunResult.valid === false ||
                      fullDryRunResult.executionAllowed === false
                    }
                    className="bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 text-white font-bold py-2 px-5"
                  >
                    <AlertTriangle className={`w-4 h-4 mr-2 ${isFullRestoreExecuting ? 'animate-spin' : ''}`} />
                    {isFullRestoreExecuting ? 'Full Restore In Progress...' : 'Execute Full Snapshot Restore'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-rose-950/20 border border-rose-800/50 rounded-xl text-center space-y-1">
                <p className="text-xs font-bold text-rose-300">Full Restoration Execution Blocked</p>
                <p className="text-[11px] text-slate-400">
                  Preflight engine reported blocking issues or checksum failure. Execution controls are strictly disabled.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Restore Error Display */}
        {fullRestoreError && (
          <div className="p-4 bg-slate-950/60 rounded-lg border border-rose-900/40 flex items-center gap-3 text-rose-300">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold">Restore Execution Error:</span> {fullRestoreError}
            </div>
          </div>
        )}

        {/* Step 12 & 13: Execution Result Display */}
        {fullRestoreResult && (
          <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4" id="full-restore-result-card">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3" id="full-restore-result">
              {fullRestoreResult.status === 'SUCCESS' ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
              ) : fullRestoreResult.status === 'PARTIAL_FAILURE' ? (
                <AlertTriangle className="w-7 h-7 text-amber-400 shrink-0" />
              ) : (
                <AlertCircle className="w-7 h-7 text-rose-400 shrink-0" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-100">Full Restore Execution Result</h4>
                  <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase ${
                    fullRestoreResult.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-300' :
                    fullRestoreResult.status === 'PARTIAL_FAILURE' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-rose-500/20 text-rose-300'
                  }`}>
                    {fullRestoreResult.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Operation ID: <code className="font-mono text-indigo-300">{fullRestoreResult.operationId || 'N/A'}</code> | Worksheets Processed: <span className="font-semibold text-slate-200">{(fullRestoreResult.worksheetsProcessed?.length || 0)} / 19</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Records Created</span>
                <span className="font-mono font-bold text-emerald-400">{fullRestoreResult.recordsCreated ?? 0}</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Records Updated</span>
                <span className="font-mono font-bold text-amber-400">{fullRestoreResult.recordsUpdated ?? 0}</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Audit Events</span>
                <span className="font-mono font-bold text-indigo-300">{fullRestoreResult.auditEvents ?? 0}</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Workflow Events</span>
                <span className="font-mono font-bold text-indigo-300">{fullRestoreResult.workflowEvents ?? 0}</span>
              </div>
            </div>

            {/* Error Journal for PARTIAL or FAILED */}
            {(fullRestoreResult.status === 'PARTIAL_FAILURE' || fullRestoreResult.status === 'FAILED') && (
              <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-lg space-y-1">
                <span className="text-xs font-bold text-rose-300 block">Execution Journal & Error Log:</span>
                <p className="text-xs text-rose-200">
                  {fullRestoreResult.message || (fullRestoreResult.errors && fullRestoreResult.errors.join(', ')) || 'Restoration encountered an unexpected failure during operation execution.'}
                </p>
                {fullRestoreResult.failedAtWorksheet && (
                  <p className="text-[11px] font-mono text-amber-300">
                    Failed at Worksheet: {fullRestoreResult.failedAtWorksheet}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full Restore Modal Confirmation Dialog */}
      {showFullRestoreConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4" id="full-restore-confirm-modal">
          <div className="bg-slate-900 border border-rose-800/80 rounded-xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <AlertTriangle className="w-7 h-7 text-rose-500 shrink-0" />
              <div>
                <h3 className="text-base font-bold text-rose-400">THIS WILL RESTORE THE FULL SNAPSHOT</h3>
                <p className="text-xs text-slate-400">Final Confirmation Gate</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p className="leading-relaxed">
                You are about to execute a full snapshot restore across all 19 worksheets. This action will write new entities and update existing entities based on the snapshot.
              </p>
              <div className="p-3 bg-slate-950 rounded border border-slate-800 text-center font-mono font-bold text-rose-400 text-sm">
                RESTORE ALL DATA
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowFullRestoreConfirmModal(false)}
                disabled={isFullRestoreExecuting}
              >
                Cancel
              </Button>
              <Button
                id="full-restore-final-confirm-btn"
                variant="primary"
                size="sm"
                onClick={handleExecuteFullRestore}
                disabled={isFullRestoreExecuting}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
              >
                {isFullRestoreExecuting ? 'Executing Restore...' : 'Confirm Full Restore Execution'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Snapshot Detail Modal (Read-Only Informational & Verification Viewer) */}
      {selectedSnapshotDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4" id="snapshot-details-modal">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Info className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-slate-100">Snapshot Details & Verification</h3>
              </div>
              <button
                onClick={() => setSelectedSnapshotDetail(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 font-medium">Archive Status & Type:</span>
                <div className="col-span-2">
                  {selectedSnapshotDetail.status === 'DURABLE_ARCHIVE' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      <Cloud className="w-3.5 h-3.5 text-indigo-400" />
                      DURABLE_ARCHIVE (GCS Cloud Storage)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                      SYSTEM_BASELINE (In-Memory Live Baseline)
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 font-medium">Snapshot ID:</span>
                <span className="col-span-2 font-mono font-semibold text-indigo-300">{selectedSnapshotDetail.id}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 font-medium">Archive Timestamp:</span>
                <span className="col-span-2 font-mono text-slate-200">
                  {new Date(selectedSnapshotDetail.exportTimestamp).toLocaleString()} ({selectedSnapshotDetail.exportTimestamp})
                </span>
              </div>

              {selectedSnapshotDetail.status === 'DURABLE_ARCHIVE' && (
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                  <span className="text-slate-400 font-medium">Storage Object Identifier:</span>
                  <span className="col-span-2 font-mono text-slate-300 text-[11px] break-all">
                    {selectedSnapshotDetail.storageUri || `snapshots/${new Date(selectedSnapshotDetail.exportTimestamp).getFullYear()}/${String(new Date(selectedSnapshotDetail.exportTimestamp).getMonth() + 1).padStart(2, '0')}/${selectedSnapshotDetail.id}.json`}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 font-medium">Spreadsheet Title:</span>
                <span className="col-span-2 text-slate-200">{selectedSnapshotDetail.spreadsheetTitle}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 font-medium">Masked Sheet ID:</span>
                <span className="col-span-2 font-mono text-slate-300">{selectedSnapshotDetail.spreadsheetIdMasked}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 font-medium">Worksheets / Rows:</span>
                <span className="col-span-2 text-slate-200">
                  <span className="font-mono text-indigo-300 font-semibold">{selectedSnapshotDetail.totalWorksheets}</span> Worksheets | <span className="font-mono text-indigo-300 font-semibold">{selectedSnapshotDetail.totalRows}</span> Total Rows
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 font-medium">Manifest & Integrity:</span>
                <span className="col-span-2 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-300">
                    MANIFEST: VALID
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    selectedSnapshotDetail.integrityStatus === 'CORRUPTED'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    INTEGRITY: {selectedSnapshotDetail.integrityStatus || 'VALID'}
                  </span>
                </span>
              </div>

              <div className="space-y-1 p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                <span className="text-slate-400 font-medium block">SHA-256 Checksum:</span>
                <code className="block p-2 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] text-emerald-400 break-all select-all">
                  {selectedSnapshotDetail.checksum}
                </code>
              </div>

              {/* Task 3F.4.10D: Read-Only Verification / Retrieval Action */}
              {selectedSnapshotDetail.status === 'DURABLE_ARCHIVE' && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-3" id="durable-retrieval-section">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">Durable Payload Inspection</h4>
                      <p className="text-[11px] text-slate-400">Download and verify SHA-256 checksum against stored metadata manifest</p>
                    </div>
                    <Button
                      id="verify-retrieve-snapshot-btn"
                      variant="outline"
                      size="sm"
                      onClick={() => handleVerifyAndRetrieveSnapshot(selectedSnapshotDetail.id)}
                      disabled={isRetrievingSnapshot}
                      className="border-indigo-500/40 text-indigo-300 hover:bg-indigo-950/40"
                    >
                      <FileCheck className={`w-3.5 h-3.5 mr-1.5 ${isRetrievingSnapshot ? 'animate-spin' : ''}`} />
                      {isRetrievingSnapshot ? 'Verifying Integrity...' : 'Verify SHA-256 & Fetch Payload'}
                    </Button>
                  </div>

                  {/* Verification Status Display */}
                  {retrievalVerificationStatus === 'VERIFIED' && retrievedSnapshotPayload && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg space-y-2" id="verification-status-verified">
                      <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>VERIFIED INTEGRITY — SHA-256 CHECKSUM MATCHES MANIFEST</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Worksheets Verified: <span className="font-mono text-emerald-400 font-semibold">{Object.keys(retrievedSnapshotPayload.worksheets || {}).length}</span> | Total Sequences: <span className="font-mono text-indigo-300 font-semibold">{retrievedSnapshotPayload.sequences?.length || 0}</span>
                      </p>
                      <div className="p-2 bg-slate-950 rounded border border-slate-800 max-h-32 overflow-y-auto space-y-1">
                        {Object.entries(retrievedSnapshotPayload.worksheets || {}).map(([name, ws]: [string, any]) => (
                          <div key={name} className="flex justify-between text-[10px] font-mono text-slate-400">
                            <span>{name}</span>
                            <span className="text-slate-300">{ws.rowCount} rows ({ws.headers?.length || 0} cols)</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 italic">
                        Read-only payload verification complete. No restore actions have been triggered or executed.
                      </p>
                    </div>
                  )}

                  {retrievalVerificationStatus === 'CORRUPTED' && (
                    <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg space-y-1" id="verification-status-corrupted">
                      <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>INTEGRITY VERIFICATION FAILED — CORRUPTED ARCHIVE</span>
                      </div>
                      <p className="text-[11px] text-rose-200">
                        {retrievalError || 'Retrieved payload checksum does not match registered metadata manifest. FAILED CLOSED.'}
                      </p>
                    </div>
                  )}

                  {retrievalVerificationStatus === 'UNAVAILABLE' && (
                    <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg space-y-1" id="verification-status-unavailable">
                      <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>ARCHIVE OBJECT UNAVAILABLE</span>
                      </div>
                      <p className="text-[11px] text-amber-200">
                        {retrievalError || 'Snapshot object missing or unavailable in Cloud Storage bucket.'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setSelectedSnapshotDetail(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Video as VideoIcon,
  Mic,
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Play,
  Save,
  FileQuestion,
  UploadCloud,
  Maximize2,
  X,
} from 'lucide-react';
import { Video, Script, VideoProductionStatus, AssignmentTaskType } from '../../types';
import { apiClient } from '../../lib/api-client';
import { Button } from '../common/Button';
import { VideoStatusBadge } from '../common/StatusBadge';
import { PRIORITY_CONFIG } from '../../config/constants';

interface RecordingWorkspaceProps {
  videoId: string;
  video: Video;
  onStatusChange?: () => void;
}

export const RecordingWorkspace: React.FC<RecordingWorkspaceProps> = ({
  videoId,
  video,
  onStatusChange,
}) => {
  const [script, setScript] = useState<Script | null>(null);
  const [isLoadingScript, setIsLoadingScript] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isFullscreenTeleprompter, setIsFullscreenTeleprompter] = useState<boolean>(false);

  // Notes state
  const [recordingNotes, setRecordingNotes] = useState<string>(video.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);

  // Raw file upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) return;
    setIsUploadingFile(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const updatedVideo = await apiClient.uploadVideoFile(videoId, selectedFile, video.contentId);
      setSuccessMessage(`Successfully uploaded "${selectedFile.name}" to Google Drive! File ID: ${updatedVideo.driveFileId}`);
      setSelectedFile(null);
      // Reset the file input element visually
      const fileInput = document.getElementById('raw-video-file-input') as HTMLInputElement | null;
      if (fileInput) {
        fileInput.value = '';
      }
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (err: any) {
      const rawMsg = err?.message || '';
      if (rawMsg.includes('invalid_grant')) {
        setError(
          'Google Drive connection error. Please ensure your Google Drive refresh token is configured in Secrets or set SKIP_DRIVE_SYNC=true in your environment for local testing.'
        );
      } else {
        setError(rawMsg || 'Failed to upload video asset.');
      }
    } finally {
      setIsUploadingFile(false);
    }
  };

  const fetchScript = async () => {
    try {
      setIsLoadingScript(true);
      const res = await apiClient.getScript(videoId);
      if (res.script) {
        setScript(res.script);
      }
    } catch (err: any) {
      console.warn('Failed to load script for recording workspace:', err);
    } finally {
      setIsLoadingScript(false);
    }
  };

  useEffect(() => {
    fetchScript();
    setRecordingNotes(video.notes || '');
  }, [videoId, video]);

  const handleStatusTransition = async (nextStatus: VideoProductionStatus) => {
    setIsUpdating(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await apiClient.updateVideoStatus(
        videoId,
        nextStatus,
        `Transitioned to ${nextStatus} via Recording Workspace`
      );
      setSuccessMessage(`Successfully transitioned recording status to ${nextStatus}.`);
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (err: any) {
      const rawMsg = err?.message || '';
      if (rawMsg.includes('invalid_grant')) {
        setError(
          'Google Drive connection error. Please ensure your Google Drive refresh token is configured in Secrets or set SKIP_DRIVE_SYNC=true in your environment for local testing.'
        );
      } else {
        setError(rawMsg || 'Failed to update video status.');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    setError(null);
    try {
      await apiClient.updateVideoMetadata(videoId, {
        notes: recordingNotes,
      });
      setSuccessMessage('Recording notes saved successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      setError(err?.message || 'Failed to save recording notes.');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const recordingAssignments = (video.assignments || []).filter(
    (a) => a.taskType === AssignmentTaskType.RECORDING || a.assignmentRole === 'SPEAKER' || a.assignmentRole === 'EDITOR'
  );

  const priorityCfg = PRIORITY_CONFIG[video.priority] || PRIORITY_CONFIG['NORMAL'];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Action Bar & Notification Banners */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <VideoIcon className="w-5 h-5 text-indigo-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recording Stage Controls</h3>
            <p className="text-xs text-slate-500">Manage recording lifecycle, teleprompter, and raw asset ingestion</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {video.status === VideoProductionStatus.SCRIPT_READY && (
            <Button
              variant="primary"
              size="sm"
              disabled={isUpdating}
              onClick={() => handleStatusTransition(VideoProductionStatus.RECORDING)}
              className="text-xs"
              icon={Play}
            >
              Start Recording
            </Button>
          )}

          {video.status === VideoProductionStatus.RECORDING && (
            <Button
              variant="primary"
              size="sm"
              disabled={isUpdating || !video.driveFileId}
              onClick={() => handleStatusTransition(VideoProductionStatus.RECORDED)}
              className="text-xs"
              icon={CheckCircle2}
              title={!video.driveFileId ? "A raw video file must be uploaded before marking as Recorded" : ""}
            >
              Mark as Recorded
            </Button>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            {error.includes('invalid_grant') ? (
              <span>
                Google Drive connection error. Please ensure your Google Drive refresh token is configured in Secrets or set SKIP_DRIVE_SYNC=true in your environment for local testing.
              </span>
            ) : (
              <span>{error}</span>
            )}
          </div>
        </div>
      )}

      {/* Main Content Grid: Approved Script & Recording Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Approved Script Teleprompter View */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Approved Script (Teleprompter View)</h3>
              {script && (
                <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold border border-indigo-200">
                  Version v{script.currentVersion}
                </span>
              )}
            </div>
            {script && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreenTeleprompter(true)}
                icon={Play}
                className="text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50"
              >
                Launch Fullscreen Teleprompter
              </Button>
            )}
          </div>

          {isLoadingScript ? (
            <div className="py-12 text-center text-xs text-slate-400 font-mono">Loading approved script...</div>
          ) : script ? (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-indigo-50/40 border border-indigo-100 rounded-lg space-y-1">
                <span className="font-bold text-indigo-900 uppercase tracking-wider text-[10px]">Hook (0 - 5s)</span>
                <p className="text-slate-800 leading-relaxed font-medium">{script.hookText}</p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Problem Statement (5 - 15s)</span>
                <p className="text-slate-800 leading-relaxed">{script.problemStatement}</p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Step-by-Step Solution (15 - 35s)</span>
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{script.stepByStepSolution}</p>
              </div>

              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-1">
                <span className="font-bold text-emerald-900 uppercase tracking-wider text-[10px]">Speed Trick & Takeaway</span>
                <p className="text-emerald-950 leading-relaxed">{script.speedTrickOrTakeaway}</p>
              </div>

              <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-lg space-y-1">
                <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px]">Call to Action</span>
                <p className="text-amber-950 leading-relaxed">{script.callToAction}</p>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200 text-slate-500 text-xs">
              No approved script found for this video yet. Please check the Script Workspace.
            </div>
          )}
        </div>

        {/* Right Col: Recording Assignments & Operational Notes */}
        <div className="space-y-6">
          {/* Raw Video Upload Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Raw Video Upload</h3>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {video.driveFileId ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Raw Video Uploaded</span>
                  </div>
                  <div className="font-mono text-[10px] text-emerald-700 break-all space-y-1">
                    <p><strong>File ID:</strong> {video.driveFileId}</p>
                    {video.finalRenderPath && <p><strong>Path:</strong> {video.finalRenderPath}</p>}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg">
                  <p className="font-medium text-[11px] leading-snug">
                    A raw video file is required in Google Drive before you can mark this video as Recorded.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Select Video File</label>
                <input
                  id="raw-video-file-input"
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  disabled={isUploadingFile}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-slate-200 rounded-lg p-1.5 focus:outline-none"
                />
              </div>

              {selectedFile && (
                <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <p className="truncate"><strong>Name:</strong> {selectedFile.name}</p>
                  <p><strong>Size:</strong> {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              )}

              <Button
                variant="primary"
                size="sm"
                className="w-full text-xs justify-center"
                disabled={!selectedFile || isUploadingFile}
                onClick={handleUploadFile}
                icon={UploadCloud}
              >
                {isUploadingFile ? 'Uploading to Google Drive...' : 'Upload Raw Video'}
              </Button>
            </div>
          </div>

          {/* Recording Assignment Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Recording Assignment</h3>
              </div>
            </div>

            {recordingAssignments.length > 0 ? (
              <div className="space-y-2.5">
                {recordingAssignments.map((assignment) => (
                  <div key={assignment.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{assignment.assigneeName}</span>
                      <span className="font-mono text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">
                        {assignment.taskType}
                      </span>
                    </div>
                    <p className="text-slate-500">Status: <span className="font-medium text-slate-700">{assignment.status}</span></p>
                    {assignment.notes && <p className="text-slate-600 italic">"{assignment.notes}"</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center text-xs text-slate-500">
                No recording task assigned yet. Use the assignments panel to assign recording staff.
              </div>
            )}
          </div>

          {/* Recording Operational Notes */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Recording Session Notes</h3>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <textarea
                rows={4}
                value={recordingNotes}
                onChange={(e) => setRecordingNotes(e.target.value)}
                placeholder="Log microphone settings, studio take notes, retake timestamps, or sound quality remarks..."
                className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 text-slate-800"
              />
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isSavingNotes}
                  onClick={handleSaveNotes}
                  className="text-xs"
                  icon={Save}
                >
                  {isSavingNotes ? 'Saving...' : 'Save Notes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Teleprompter Modal */}
      {isFullscreenTeleprompter && script && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col p-6 sm:p-10 overflow-y-auto animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm px-2.5 py-1 rounded bg-indigo-900 text-indigo-200 font-bold border border-indigo-700">
                {video.id}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{video.title}</h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                v{script.currentVersion}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreenTeleprompter(false)}
              icon={X}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
            >
              Exit Teleprompter
            </Button>
          </div>

          <div className="max-w-4xl mx-auto w-full py-12 space-y-10">
            <div className="space-y-2 p-6 rounded-2xl bg-indigo-950/40 border border-indigo-900/60">
              <span className="text-xs font-mono font-bold tracking-wider text-indigo-400 uppercase">
                Hook (0 - 5s)
              </span>
              <p className="text-2xl sm:text-3xl font-medium leading-relaxed text-indigo-100">
                {script.hookText}
              </p>
            </div>

            <div className="space-y-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
                Problem Statement (5 - 15s)
              </span>
              <p className="text-2xl sm:text-3xl font-normal leading-relaxed text-slate-200">
                {script.problemStatement}
              </p>
            </div>

            <div className="space-y-2 p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
                Step-by-Step Solution (15 - 35s)
              </span>
              <p className="text-2xl sm:text-3xl font-normal leading-relaxed text-slate-200 whitespace-pre-wrap">
                {script.stepByStepSolution}
              </p>
            </div>

            <div className="space-y-2 p-6 rounded-2xl bg-emerald-950/40 border border-emerald-900/60">
              <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase">
                Speed Trick & Takeaway
              </span>
              <p className="text-2xl sm:text-3xl font-medium leading-relaxed text-emerald-100">
                {script.speedTrickOrTakeaway}
              </p>
            </div>

            <div className="space-y-2 p-6 rounded-2xl bg-amber-950/40 border border-amber-900/60">
              <span className="text-xs font-mono font-bold tracking-wider text-amber-400 uppercase">
                Call to Action
              </span>
              <p className="text-2xl sm:text-3xl font-medium leading-relaxed text-amber-100">
                {script.callToAction}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * BURRA PARIKSHA CMS - Client API Bridge
 * Phase 2: Google Sheets Database Architecture & Persistence
 * 
 * Provides type-safe fetch abstractions for calling server-side API endpoints.
 */

import {
  CancelAssignmentInput,
  CompleteAssignmentInput,
  CreateAssignmentInput,
  CreateQuestionInput,
  CreateUserInput,
  QuestionFilterInput,
  ReassignAssignmentInput,
  UpdateAssignmentInput,
  UpdateUserInput,
} from './schemas/google-sheets-schema';
import {
  Assignment,
  AuditLog,
  Category,
  MyWorkSummary,
  Publishing,
  Question,
  QuestionDraft,
  QuestionStatus,
  QuestionStudioConfigResponse,
  SpreadsheetHealthReport,
  Subtopic,
  TeamWorkloadSummary,
  Topic,
  UnassignedWorkItem,
  User,
  UserWorkload,
  Video,
  Workflow,
} from '../types';
import { GenerateCandidateInput, GenerationResult, RefineCandidateInput } from './ai/types';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

export interface RecoveryStatusResponse {
  backupCapability: {
    snapshotExporterAvailable: boolean;
  };
  recoveryCapability: {
    validatorAvailable: boolean;
    granularRestoreAvailable: boolean;
    fullRestorePlannerAvailable: boolean;
    fullRestoreExecutionAvailable: boolean;
  };
  durableArchive?: {
    enabled: boolean;
    bucketNameMasked: string;
    retentionDays: number;
    isGcsConfigured: boolean;
    durableSnapshotCount: number;
    latestDurableSnapshot: string | null;
    integrityStatus: 'VALID' | 'WARNING' | 'CORRUPTED';
    warnings: string[];
  };
  safety: {
    productionMutationPerformed: boolean;
    readOnly: boolean;
  };
  supportedScopes: string[];
}

export interface SnapshotHistoryItem {
  id: string;
  exportTimestamp: string;
  spreadsheetTitle: string;
  spreadsheetIdMasked: string;
  totalWorksheets: number;
  totalRows: number;
  checksum: string;
  integrityStatus: 'VALID' | 'WARNING' | 'CORRUPTED';
  status: 'AVAILABLE' | 'ARCHIVED' | 'SYSTEM_BASELINE' | 'DURABLE_ARCHIVE';
  generator: string;
  storageUri?: string;
}

class ApiClient {
  private sessionToken: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.sessionToken = localStorage.getItem('bp_session_token');
      } catch {
        this.sessionToken = null;
      }
    }
  }

  public setSessionToken(token: string | null): void {
    this.sessionToken = token;
    if (typeof window !== 'undefined') {
      try {
        if (token) {
          localStorage.setItem('bp_session_token', token);
        } else {
          localStorage.removeItem('bp_session_token');
        }
      } catch {
        // ignore localStorage access errors
      }
    }
  }

  public getSessionToken(): string | null {
    return this.sessionToken;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options?.headers as Record<string, string>) || {}),
    };

    if (this.sessionToken && !headers['Authorization'] && !headers['authorization']) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
    }

    const controller = new AbortController();
    let isTimedOut = false;
    const timeoutId = setTimeout(() => {
      isTimedOut = true;
      try {
        controller.abort(new Error('Request timed out after 45 seconds.'));
      } catch {
        controller.abort();
      }
    }, 45000);

    const signal = options?.signal || controller.signal;

    try {
      const res = await fetch(`/api${endpoint}`, {
        credentials: 'include',
        ...options,
        headers,
        signal,
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data?.message || data?.error || `Request failed with status ${res.status}`;
        const err: any = new Error(errorMsg);
        err.statusCode = res.status;
        err.details = data?.details;
        throw err;
      }

      return data as T;
    } catch (err: any) {
      if (isTimedOut) {
        throw new Error('Request timed out after 45 seconds. Please try again.');
      }
      if (err?.name === 'AbortError') {
        throw new Error(err.message && err.message !== 'The user aborted a request.' ? err.message : 'The request was aborted.');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // System & Sheets Health
  public async getHealth(): Promise<{ status: string; mode: string; timestamp: string; spreadsheetId: string | null; databaseConfigured?: boolean }> {
    return this.request('/health');
  }

  public async getSheetsHealth(): Promise<SpreadsheetHealthReport> {
    return this.request('/sheets/health');
  }

  public async getSystemIntegrityHealth(): Promise<import('../types').SystemHealthReport> {
    return this.request('/system/health/integrity');
  }

  // Taxonomy
  public async getTaxonomyTree(): Promise<any[]> {
    return this.request('/taxonomy/tree');
  }

  public async getPureTopicTree(includeInactive = false): Promise<any[]> {
    return this.request(`/taxonomy/pure-tree?includeInactive=${includeInactive}`);
  }

  public async getCategories(): Promise<Category[]> {
    return this.request('/categories');
  }

  public async getTopics(
    categoryId?: string,
    options?: { search?: string; includeInactive?: boolean }
  ): Promise<Topic[]> {
    const params = new URLSearchParams();
    if (categoryId) params.set('categoryId', categoryId);
    if (options?.search) params.set('search', options.search);
    if (options?.includeInactive) params.set('includeInactive', 'true');
    const qs = params.toString();
    return this.request(`/topics${qs ? `?${qs}` : ''}`);
  }

  public async getTopicById(id: string): Promise<Topic> {
    return this.request(`/topics/${encodeURIComponent(id)}`);
  }

  public async createTopic(data: Partial<Topic>): Promise<Topic> {
    return this.request('/topics', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateTopic(id: string, data: Partial<Topic>): Promise<Topic> {
    return this.request(`/topics/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  public async toggleTopicActive(id: string, isActive: boolean): Promise<Topic> {
    return this.request(`/topics/${encodeURIComponent(id)}/toggle-active`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  public async getSubtopics(
    topicId?: string,
    options?: { search?: string; includeInactive?: boolean }
  ): Promise<Subtopic[]> {
    const params = new URLSearchParams();
    if (topicId) params.set('topicId', topicId);
    if (options?.search) params.set('search', options.search);
    if (options?.includeInactive) params.set('includeInactive', 'true');
    const qs = params.toString();
    return this.request(`/subtopics${qs ? `?${qs}` : ''}`);
  }

  public async getSubtopicById(id: string): Promise<Subtopic> {
    return this.request(`/subtopics/${encodeURIComponent(id)}`);
  }

  public async createSubtopic(data: Partial<Subtopic>): Promise<Subtopic> {
    return this.request('/subtopics', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateSubtopic(id: string, data: Partial<Subtopic>): Promise<Subtopic> {
    return this.request(`/subtopics/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  public async toggleSubtopicActive(id: string, isActive: boolean): Promise<Subtopic> {
    return this.request(`/subtopics/${encodeURIComponent(id)}/toggle-active`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  public async getPureTaxonomyTree(options?: { includeInactive?: boolean }): Promise<Array<Topic & { subtopics: Subtopic[] }>> {
    const params = new URLSearchParams();
    if (options?.includeInactive) params.set('includeInactive', 'true');
    const qs = params.toString();
    return this.request(`/taxonomy/pure-tree${qs ? `?${qs}` : ''}`);
  }

  public async getTaxonomyMetrics(): Promise<any> {
    return this.request('/taxonomy/metrics');
  }

  // Questions
  public async getQuestions(filter?: QuestionFilterInput): Promise<Question[]> {
    const params = new URLSearchParams();
    if (filter) {
      if (filter.search) params.set('search', filter.search);
      if (filter.categoryId) params.set('categoryId', filter.categoryId);
      if (filter.topicId) params.set('topicId', filter.topicId);
      if (filter.subtopicId) params.set('subtopicId', filter.subtopicId);
      if (filter.difficulty) params.set('difficulty', filter.difficulty);
      if (filter.status) params.set('status', filter.status);
      if (filter.videoStatus) params.set('videoStatus', filter.videoStatus);
    }
    const queryString = params.toString();
    return this.request(`/questions${queryString ? `?${queryString}` : ''}`);
  }

  public async getQuestionById(id: string): Promise<Question> {
    return this.request(`/questions/${encodeURIComponent(id)}`);
  }

  public async getQuestionCreationConfig(): Promise<any> {
    return this.request('/questions/config');
  }

  public async getQuestionStudioConfig(forceRefresh?: boolean): Promise<QuestionStudioConfigResponse> {
    const qs = forceRefresh ? '?forceRefresh=true' : '';
    return this.request(`/questions/config${qs}`);
  }

  public async resolveSmartRandom(input: any): Promise<any> {
    return this.request('/questions/smart-random', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  public async createQuestionCanonical(payload: any, idempotencyKey?: string): Promise<Question> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['x-idempotency-key'] = idempotencyKey;
    }
    return this.request('/questions', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  }

  public async saveQuestionDraft(payload: any): Promise<QuestionDraft> {
    return this.request('/questions/draft', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getQuestionDraft(id: string): Promise<QuestionDraft> {
    return this.request(`/questions/draft/${encodeURIComponent(id)}`);
  }

  public async getQuestionDrafts(): Promise<QuestionDraft[]> {
    return this.request('/questions/drafts');
  }

  public async approveQuestionDraft(id: string, notes?: string): Promise<Question> {
    return this.request(`/questions/draft/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  public async createQuestion(input: CreateQuestionInput): Promise<Question> {
    return this.request('/questions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  public async updateQuestion(id: string, updates: Partial<CreateQuestionInput>): Promise<Question> {
    return this.request(`/questions/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  public async updateQuestionStatus(id: string, status: QuestionStatus, remarks?: string): Promise<Question> {
    return this.request(`/questions/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, remarks }),
    });
  }

  public async queueQuestion(id: string, remarks?: string): Promise<Question> {
    return this.request(`/questions/${encodeURIComponent(id)}/queue`, {
      method: 'POST',
      body: JSON.stringify({ remarks }),
    });
  }

  public async checkDuplicate(
    text: string,
    excludeId?: string,
    options?: { signal?: AbortSignal }
  ): Promise<{ isDuplicate: boolean; matches: any[] }> {
    return this.request('/questions/check-duplicate', {
      method: 'POST',
      body: JSON.stringify({ text, excludeId }),
      signal: options?.signal,
    });
  }

  // Question Validation Engine (Phase 5)
  public async validateQuestion(id: string, options?: { skipTaxonomyLookup?: boolean; source?: string }): Promise<{ success: boolean; data: import('../types').ValidationResult }> {
    return this.request(`/questions/${encodeURIComponent(id)}/validate`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  }

  public async validateCandidate(question: Partial<Question>, options?: { skipTaxonomyLookup?: boolean; source?: string }): Promise<{ success: boolean; data: import('../types').ValidationResult }> {
    return this.request('/questions/validate-candidate', {
      method: 'POST',
      body: JSON.stringify({ question, ...options }),
    });
  }

  public async getLatestValidation(id: string): Promise<{ success: boolean; data: import('../types').ValidationResult | null }> {
    return this.request(`/questions/${encodeURIComponent(id)}/validation`);
  }

  public async getValidationHistory(id: string): Promise<{ success: boolean; count: number; data: import('../types').ValidationResult[] }> {
    return this.request(`/questions/${encodeURIComponent(id)}/validation-history`);
  }

  // Videos & Production (Phase 5)
  public async getVideos(filter?: {
    status?: string;
    priority?: string;
    search?: string;
    categoryId?: string;
    topicId?: string;
    difficulty?: string;
    assignedHost?: string;
    assignedEditor?: string;
  }): Promise<Video[]> {
    const params = new URLSearchParams();
    if (filter) {
      if (filter.status) params.set('status', filter.status);
      if (filter.priority) params.set('priority', filter.priority);
      if (filter.search) params.set('search', filter.search);
      if (filter.categoryId) params.set('categoryId', filter.categoryId);
      if (filter.topicId) params.set('topicId', filter.topicId);
      if (filter.difficulty) params.set('difficulty', filter.difficulty);
      if (filter.assignedHost) params.set('assignedHost', filter.assignedHost);
      if (filter.assignedEditor) params.set('assignedEditor', filter.assignedEditor);
    }
    const qs = params.toString();
    return this.request(`/videos${qs ? `?${qs}` : ''}`);
  }

  public async getVideoById(id: string): Promise<Video> {
    return this.request(`/videos/${encodeURIComponent(id)}`);
  }

  public async getProductionStats(): Promise<import('../types').ProductionStats> {
    return this.request('/videos/stats');
  }

  public async queueVideo(input: {
    questionId: string;
    title?: string;
    priority?: string;
    assignedHost?: string;
    assignedEditor?: string;
    notes?: string;
    targetDurationSeconds?: number;
  }): Promise<Video> {
    return this.request('/videos/queue', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  public async queueQuestionForVideo(questionId: string, remarks?: string): Promise<Video> {
    try {
      return await this.queueVideo({
        questionId,
        notes: remarks || 'Queued for video production',
      });
    } catch (err: any) {
      // If already queued, find existing video for this question
      const videos = await this.getVideos();
      const existing = videos.find((v) => v.questionId === questionId);
      if (existing) {
        return existing;
      }
      throw err;
    }
  }

  public async updateVideoStatus(
    id: string,
    status: string,
    remarks?: string,
    actualDurationSeconds?: number
  ): Promise<Video> {
    return this.request(`/videos/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, remarks, actualDurationSeconds }),
    });
  }

  public async updateVideoPriority(id: string, priority: string, remarks?: string): Promise<Video> {
    return this.request(`/videos/${encodeURIComponent(id)}/priority`, {
      method: 'PATCH',
      body: JSON.stringify({ priority, remarks }),
    });
  }

  public async assignVideo(
    id: string,
    assignment: {
      assigneeId: string;
      assigneeName: string;
      taskType?: string;
      dueDate?: string;
      notes?: string;
    }
  ): Promise<any> {
    return this.request(`/videos/${encodeURIComponent(id)}/assignments`, {
      method: 'POST',
      body: JSON.stringify(assignment),
    });
  }

  public async updateVideoMetadata(id: string, updates: Partial<Video>): Promise<Video> {
    return this.request(`/videos/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  public async uploadVideoFile(videoId: string, file: File, contentId?: string): Promise<Video> {
    const formData = new FormData();
    formData.append('file', file);
    if (contentId) {
      formData.append('contentId', contentId);
    }
    formData.append('videoId', videoId);

    const headers: Record<string, string> = {};
    if (this.sessionToken) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
    }

    const res = await fetch(`/api/videos/${encodeURIComponent(videoId)}/upload`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || data?.error || 'Failed to upload file');
    }
    return data;
  }

  public async uploadEditedVideoFile(
    videoId: string,
    file: File,
    expectedContentId?: string,
    advanceStatus: boolean = false
  ): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    if (expectedContentId) {
      formData.append('expectedContentId', expectedContentId);
    }
    formData.append('advanceStatus', String(advanceStatus));

    const headers: Record<string, string> = {};
    if (this.sessionToken) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
    }

    const res = await fetch(`/api/videos/${encodeURIComponent(videoId)}/edited`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || data?.error || 'Failed to upload edited video');
    }
    return data;
  }

  public async getVideoProductionHistory(videoId: string): Promise<{
    video: Video;
    currentState: string;
    rawAssets: any[];
    editedAssets: any[];
    finalAssets: any[];
  }> {
    return this.request(`/videos/${encodeURIComponent(videoId)}/production-history`);
  }

  public async completeFinalRender(id: string, remarks?: string): Promise<Video> {
    return this.request(`/videos/${encodeURIComponent(id)}/final-render/complete`, {
      method: 'POST',
      body: JSON.stringify({ remarks }),
    });
  }

  // Publishing
  public async getPublishing(): Promise<Publishing[]> {
    return this.request('/publishing');
  }

  public async getVideoPublishing(videoId: string): Promise<Publishing> {
    return this.request(`/videos/${encodeURIComponent(videoId)}/publishing`);
  }

  public async updatePublishing(id: string, updates: Partial<Publishing>): Promise<Publishing> {
    return this.request(`/publishing/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  public async markPlatformPublished(
    videoId: string,
    platform: 'youtube' | 'instagram' | 'facebook',
    postUrl: string,
    notes?: string
  ): Promise<Publishing> {
    return this.request(`/videos/${encodeURIComponent(videoId)}/publishing/publish-platform`, {
      method: 'POST',
      body: JSON.stringify({ platform, postUrl, notes }),
    });
  }

  public async schedulePublishing(
    videoId: string,
    platform: 'youtube' | 'instagram' | 'facebook',
    scheduledAt: string
  ): Promise<Publishing> {
    return this.request(`/videos/${encodeURIComponent(videoId)}/publishing/schedule`, {
      method: 'POST',
      body: JSON.stringify({ platform, scheduledAt }),
    });
  }

  public async markPlatformFailed(
    videoId: string,
    platform: 'youtube' | 'instagram' | 'facebook',
    failureReason: string
  ): Promise<Publishing> {
    return this.request(`/videos/${encodeURIComponent(videoId)}/publishing/fail`, {
      method: 'POST',
      body: JSON.stringify({ platform, failureReason }),
    });
  }

  public async retryPublishing(
    videoId: string,
    platform: 'youtube' | 'instagram' | 'facebook',
    options?: { scheduledAt?: string; remarks?: string }
  ): Promise<Publishing> {
    return this.request(`/videos/${encodeURIComponent(videoId)}/publishing/retry`, {
      method: 'POST',
      body: JSON.stringify({ platform, ...(options || {}) }),
    });
  }

  public async getPlatformPackage(
    videoId: string,
    platform: 'youtube' | 'instagram' | 'facebook'
  ): Promise<import('../types').PlatformPackageProjection> {
    return this.request(`/videos/${encodeURIComponent(videoId)}/publishing/package/${encodeURIComponent(platform)}`);
  }

  public async createPublishingAssignment(
    videoId: string,
    assignment: {
      assigneeId: string;
      platform?: 'youtube' | 'instagram' | 'facebook';
      priority?: import('../types').PriorityLevel;
      dueDate?: string;
      dueAt?: string;
      notes?: string;
    }
  ): Promise<any> {
    return this.request(`/videos/${encodeURIComponent(videoId)}/publishing/assignment`, {
      method: 'POST',
      body: JSON.stringify(assignment),
    });
  }

  public async getPublishingAssignments(videoId: string): Promise<any[]> {
    return this.request(`/videos/${encodeURIComponent(videoId)}/publishing/assignments`);
  }

  public async finalizePublishing(
    videoId: string,
    remarks?: string
  ): Promise<{ video: Video; publishing: Publishing }> {
    return this.request(`/videos/${encodeURIComponent(videoId)}/publishing/finalize`, {
      method: 'POST',
      body: JSON.stringify({ remarks }),
    });
  }

  // Scripts (Phase 6)
  public async getScript(videoId: string): Promise<{ script: import('../types').Script | null; draftProposal?: any }> {
    return this.request(`/videos/${encodeURIComponent(videoId)}/script`);
  }

  public async generateTeluguScript(videoId: string): Promise<any> {
    return this.request(`/videos/${encodeURIComponent(videoId)}/script/generate`, {
      method: 'POST',
    });
  }

  public async generateTeluguScriptForQuestion(question: any): Promise<any> {
    return this.request('/ai/script/generate', {
      method: 'POST',
      body: JSON.stringify(question),
    });
  }

  public async getScriptVersions(scriptId: string): Promise<import('../types').ScriptVersion[]> {
    return this.request(`/scripts/${encodeURIComponent(scriptId)}/versions`);
  }

  public async saveScript(videoId: string, payload: any): Promise<{ script: import('../types').Script; version?: import('../types').ScriptVersion }> {
    return this.request(`/videos/${encodeURIComponent(videoId)}/script`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async revertScript(scriptId: string, versionNumber: number): Promise<import('../types').Script> {
    return this.request(`/scripts/${encodeURIComponent(scriptId)}/revert`, {
      method: 'POST',
      body: JSON.stringify({ versionNumber }),
    });
  }

  public async markScriptReady(videoId: string, remarks?: string): Promise<{ script: import('../types').Script; videoStatus: string }> {
    return this.request(`/videos/${encodeURIComponent(videoId)}/script/mark-ready`, {
      method: 'POST',
      body: JSON.stringify({ remarks }),
    });
  }

  public async returnScriptToEditing(videoId: string, remarks?: string): Promise<{ script: import('../types').Script; videoStatus: string }> {
    return this.request(`/videos/${encodeURIComponent(videoId)}/script/return-to-editing`, {
      method: 'POST',
      body: JSON.stringify({ remarks }),
    });
  }

  // Thumbnails (Phase 6)
  public async uploadThumbnailFile(
    videoId: string,
    file: File,
    notes?: string
  ): Promise<{
    thumbnail: import('../types').Thumbnail;
    version: import('../types').ThumbnailVersion;
    driveFile: any;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('videoId', videoId);
    if (notes) {
      formData.append('designerNotes', notes);
    }

    const headers: Record<string, string> = {};
    if (this.sessionToken) {
      headers['Authorization'] = `Bearer ${this.sessionToken}`;
    }

    const res = await fetch(`/api/videos/${encodeURIComponent(videoId)}/thumbnail/upload`, {
      method: 'POST',
      headers,
      body: formData,
      credentials: 'include',
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || data?.error || 'Failed to upload thumbnail file');
    }
    return data;
  }

  public async getThumbnail(videoId: string): Promise<{ thumbnail: import('../types').Thumbnail | null; draftProposal?: any }> {
    return this.request(`/videos/${encodeURIComponent(videoId)}/thumbnail`);
  }

  public async getThumbnailVersions(thumbnailId: string): Promise<import('../types').ThumbnailVersion[]> {
    return this.request(`/thumbnails/${encodeURIComponent(thumbnailId)}/versions`);
  }

  public async saveThumbnail(videoId: string, payload: any): Promise<{ thumbnail: import('../types').Thumbnail; version?: import('../types').ThumbnailVersion }> {
    return this.request(`/videos/${encodeURIComponent(videoId)}/thumbnail`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateThumbnailStatus(thumbnailId: string, status: string, remarks?: string): Promise<import('../types').Thumbnail> {
    return this.request(`/thumbnails/${encodeURIComponent(thumbnailId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, remarks }),
    });
  }

  // Pinned Comments (Phase 6)
  public async getPinnedComment(videoId: string): Promise<{ pinnedComment: import('../types').PinnedComment | null; draftProposal?: any }> {
    return this.request(`/videos/${encodeURIComponent(videoId)}/pinned-comment`);
  }

  public async savePinnedComment(videoId: string, payload: any): Promise<any> {
    return this.request(`/videos/${encodeURIComponent(videoId)}/pinned-comment`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getPinnedCommentVersions(pinnedCommentId: string): Promise<import('../types').PinnedCommentVersion[]> {
    return this.request(`/pinned-comments/${encodeURIComponent(pinnedCommentId)}/versions`);
  }

  public async updatePinnedCommentStatus(pinnedCommentId: string, isApproved: boolean, remarks?: string): Promise<import('../types').PinnedComment> {
    return this.request(`/pinned-comments/${encodeURIComponent(pinnedCommentId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isApproved, remarks }),
    });
  }

  // Audit & Workflow
  public async getAuditLogs(entityType?: string, entityId?: string): Promise<AuditLog[]> {
    const params = new URLSearchParams();
    if (entityType) params.set('entityType', entityType);
    if (entityId) params.set('entityId', entityId);
    const qs = params.toString();
    return this.request(`/audit-logs${qs ? `?${qs}` : ''}`);
  }

  public async getWorkflowHistory(entityType: string, entityId: string): Promise<Workflow[]> {
    return this.request(`/workflow/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`);
  }

  // Gemini AI Studio
  public async getAiStatus(): Promise<{ isConfigured: boolean; model: string }> {
    return this.request('/ai/status');
  }

  public async generateAiQuestion(input: GenerateCandidateInput): Promise<GenerationResult> {
    return this.request('/ai/generate', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  public async refineAiQuestion(input: RefineCandidateInput): Promise<GenerationResult> {
    return this.request('/ai/refine', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  // Phase 7: Operations Dashboard & Global Search
  public async getDashboardOverview(
    filter?: {
      categoryId?: string;
      topicId?: string;
      difficulty?: string;
      priority?: string;
      questionStatus?: string;
      videoStatus?: string;
      search?: string;
    },
    refresh?: boolean
  ): Promise<import('../types').DashboardOverviewData> {
    const params = new URLSearchParams();
    if (filter) {
      if (filter.categoryId) params.set('categoryId', filter.categoryId);
      if (filter.topicId) params.set('topicId', filter.topicId);
      if (filter.difficulty) params.set('difficulty', filter.difficulty);
      if (filter.priority) params.set('priority', filter.priority);
      if (filter.questionStatus) params.set('questionStatus', filter.questionStatus);
      if (filter.videoStatus) params.set('videoStatus', filter.videoStatus);
      if (filter.search) params.set('search', filter.search);
    }
    if (refresh) {
      params.set('refresh', 'true');
    }
    const qs = params.toString();
    return this.request(`/dashboard/overview${qs ? `?${qs}` : ''}`);
  }

  public async getDashboardMetrics(filter?: any): Promise<import('../types').DashboardMetrics> {
    const params = new URLSearchParams();
    if (filter) {
      if (filter.categoryId) params.set('categoryId', filter.categoryId);
      if (filter.topicId) params.set('topicId', filter.topicId);
    }
    const qs = params.toString();
    return this.request(`/dashboard/metrics${qs ? `?${qs}` : ''}`);
  }

  public async getTodaysWork(filter?: any): Promise<import('../types').TodaysWorkItem[]> {
    const params = new URLSearchParams();
    if (filter) {
      if (filter.categoryId) params.set('categoryId', filter.categoryId);
      if (filter.topicId) params.set('topicId', filter.topicId);
    }
    const qs = params.toString();
    return this.request(`/dashboard/todays-work${qs ? `?${qs}` : ''}`);
  }

  public async getBottlenecks(filter?: any): Promise<import('../types').BottleneckStage[]> {
    const params = new URLSearchParams();
    if (filter) {
      if (filter.categoryId) params.set('categoryId', filter.categoryId);
      if (filter.topicId) params.set('topicId', filter.topicId);
    }
    const qs = params.toString();
    return this.request(`/dashboard/bottlenecks${qs ? `?${qs}` : ''}`);
  }

  public async getStaleContent(filter?: any): Promise<import('../types').StaleContentItem[]> {
    const params = new URLSearchParams();
    if (filter) {
      if (filter.categoryId) params.set('categoryId', filter.categoryId);
      if (filter.topicId) params.set('topicId', filter.topicId);
    }
    const qs = params.toString();
    return this.request(`/dashboard/stale-content${qs ? `?${qs}` : ''}`);
  }

  public async getPublishingReadiness(filter?: any): Promise<import('../types').PublishingReadinessItem[]> {
    const params = new URLSearchParams();
    if (filter) {
      if (filter.categoryId) params.set('categoryId', filter.categoryId);
      if (filter.topicId) params.set('topicId', filter.topicId);
    }
    const qs = params.toString();
    return this.request(`/dashboard/publishing-readiness${qs ? `?${qs}` : ''}`);
  }

  public async getVideoPublishReadiness(videoId: string): Promise<any> {
    return this.request(`/videos/${encodeURIComponent(videoId)}/publishing/readiness`);
  }

  public async globalSearch(query: string): Promise<import('../types').GlobalSearchResult[]> {
    return this.request(`/search?q=${encodeURIComponent(query)}`);
  }

  // ==========================================
  // Phase 9: Content Planning, Batches & Intelligence
  // ==========================================

  public async getContentPlans(filter?: { categoryId?: string; topicId?: string; status?: string }): Promise<import('../types').ContentPlan[]> {
    const params = new URLSearchParams();
    if (filter) {
      if (filter.categoryId) params.set('categoryId', filter.categoryId);
      if (filter.topicId) params.set('topicId', filter.topicId);
      if (filter.status) params.set('status', filter.status);
    }
    const qs = params.toString();
    return this.request(`/planning/plans${qs ? `?${qs}` : ''}`);
  }

  public async getContentPlanById(id: string): Promise<import('../types').ContentPlan> {
    return this.request(`/planning/plans/${encodeURIComponent(id)}`);
  }

  public async createContentPlan(input: any): Promise<import('../types').ContentPlan> {
    return this.request('/planning/plans', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  public async updateContentPlan(id: string, input: any): Promise<import('../types').ContentPlan> {
    return this.request(`/planning/plans/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  public async approveContentPlan(id: string): Promise<import('../types').ContentPlan> {
    return this.request(`/planning/plans/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
    });
  }

  public async transitionPlanStatus(id: string, status: string): Promise<import('../types').ContentPlan> {
    return this.request(`/planning/plans/${encodeURIComponent(id)}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  public async deleteContentPlan(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/planning/plans/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  public async getContentBatches(filter?: { planId?: string; status?: string }): Promise<{ batch: import('../types').ContentBatch; metrics: import('../types').BatchProgressMetrics }[]> {
    const params = new URLSearchParams();
    if (filter) {
      if (filter.planId) params.set('planId', filter.planId);
      if (filter.status) params.set('status', filter.status);
    }
    const qs = params.toString();
    return this.request(`/planning/batches${qs ? `?${qs}` : ''}`);
  }

  public async createContentBatch(input: any): Promise<{ batch: import('../types').ContentBatch; metrics: import('../types').BatchProgressMetrics }> {
    return this.request('/planning/batches', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  public async updateContentBatch(id: string, input: any): Promise<{ batch: import('../types').ContentBatch; metrics: import('../types').BatchProgressMetrics }> {
    return this.request(`/planning/batches/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  public async deleteContentBatch(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/planning/batches/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  public async linkBatchQuestions(batchId: string, questionIds: string[], action: 'ADD' | 'REMOVE' | 'SET' = 'SET'): Promise<{ batch: import('../types').ContentBatch; metrics: import('../types').BatchProgressMetrics }> {
    return this.request(`/planning/batches/${encodeURIComponent(batchId)}/questions`, {
      method: 'POST',
      body: JSON.stringify({ questionIds, action }),
    });
  }

  public async getCoverageOverview(): Promise<import('../types').CoverageOverviewData> {
    return this.request('/planning/coverage');
  }

  public async getGapAnalysis(): Promise<import('../types').ContentGapAnalysis> {
    return this.request('/planning/gaps');
  }

  public async getSimilarityRadar(): Promise<import('./services/similarity.service').DiversityRadarReport> {
    return this.request('/planning/similarity-radar');
  }

  public async checkPlanSimilarity(text: string, excludeQuestionId?: string, threshold?: number): Promise<{ matches: import('./services/similarity.service').QuestionSimilarityMatch[]; isDuplicate: boolean }> {
    return this.request('/planning/similarity-check', {
      method: 'POST',
      body: JSON.stringify({ text, excludeQuestionId, threshold }),
    });
  }

  public async generateAiContentPlanRecommendation(input: any): Promise<import('../types').AiContentPlanRecommendation> {
    return this.request('/planning/ai-recommendation', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  public async getOperationalHealth(): Promise<import('./services/operational-health.service').OperationalHealthReport> {
    return this.request('/system/operational-health');
  }

  public async getSequenceSafety(): Promise<import('./services/sequence-safety.service').SequenceSafetyReport> {
    return this.request('/system/sequence-safety');
  }

  public async getRecoveryState(): Promise<import('./services/operational-recovery.service').OperationalRecoveryState> {
    return this.request('/system/recovery/state');
  }

  public async getRecoveryStatus(): Promise<RecoveryStatusResponse> {
    return this.request('/recovery/status');
  }

  public async getSnapshotHistory(): Promise<{ success: boolean; snapshots: SnapshotHistoryItem[] }> {
    return this.request('/recovery/snapshots');
  }

  public async createDurableArchive(): Promise<{ success: boolean; message: string; snapshot: SnapshotHistoryItem }> {
    return this.request('/recovery/snapshots/archive', {
      method: 'POST',
    });
  }

  public async retrieveDurableSnapshot(id: string): Promise<{ success: boolean; snapshot: any }> {
    return this.request(`/recovery/snapshots/${encodeURIComponent(id)}`);
  }

  public async runRecoveryDryRun(snapshot?: any): Promise<any> {
    return this.request('/recovery/dry-run', {
      method: 'POST',
      body: JSON.stringify(snapshot ? { snapshot } : {}),
    });
  }

  public async validateGranularRestore(
    entityType: string,
    entityId: string,
    snapshot?: any
  ): Promise<any> {
    return this.request('/recovery/validate/granular', {
      method: 'POST',
      body: JSON.stringify({ entityType, entityId, snapshot }),
    });
  }

  public async restoreGranularRecord(
    entityType: string,
    entityId: string,
    explicitConfirmation: string,
    snapshot?: any
  ): Promise<any> {
    const endpointMap: Record<string, string> = {
      QUESTION: '/recovery/restore/question',
      VIDEO: '/recovery/restore/video',
      SCRIPT: '/recovery/restore/script',
      THUMBNAIL: '/recovery/restore/thumbnail',
      PINNED_COMMENT: '/recovery/restore/pinned-comment',
      PUBLISHING: '/recovery/restore/publishing',
      ASSIGNMENT: '/recovery/restore/assignment',
    };

    const endpoint = endpointMap[entityType];
    if (!endpoint) {
      throw new Error(`Unsupported entity type for granular restore: ${entityType}`);
    }

    const payload: any = {
      entityId,
      explicitConfirmation,
    };
    if (snapshot) {
      payload.snapshot = snapshot;
    }

    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async executeFullRestore(
    explicitConfirmation: string,
    snapshot?: any,
    plan?: any
  ): Promise<any> {
    const payload: any = { explicitConfirmation };
    if (snapshot) payload.snapshot = snapshot;
    if (plan) payload.plan = plan;

    return this.request('/recovery/restore/full', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async syncSequence(
    entityType: string,
    proposedNextNumber: number,
    confirmed: boolean,
    actor?: { id: string; name: string }
  ): Promise<any> {
    return this.request('/system/recovery/sync-sequence', {
      method: 'POST',
      body: JSON.stringify({ entityType, proposedNextNumber, confirmed, actor }),
    });
  }

  // ==========================================
  // PHASE 10: Team Operations & Assignments
  // ==========================================

  public async getAssignments(filter?: {
    entityType?: string;
    entityId?: string;
    assigneeId?: string;
    status?: string;
    priority?: string;
    taskType?: string;
    isOverdue?: boolean;
  }): Promise<Assignment[]> {
    const params = new URLSearchParams();
    if (filter) {
      if (filter.entityType) params.set('entityType', filter.entityType);
      if (filter.entityId) params.set('entityId', filter.entityId);
      if (filter.assigneeId) params.set('assigneeId', filter.assigneeId);
      if (filter.status) params.set('status', filter.status);
      if (filter.priority) params.set('priority', filter.priority);
      if (filter.taskType) params.set('taskType', filter.taskType);
      if (filter.isOverdue !== undefined) params.set('isOverdue', String(filter.isOverdue));
    }
    const qs = params.toString();
    return this.request(`/assignments${qs ? `?${qs}` : ''}`);
  }

  public async getAssignmentById(id: string): Promise<Assignment> {
    return this.request(`/assignments/${encodeURIComponent(id)}`);
  }

  public async createAssignment(input: CreateAssignmentInput, actor?: { id: string; name: string }): Promise<Assignment> {
    return this.request('/assignments', {
      method: 'POST',
      body: JSON.stringify({ ...input, actor }),
    });
  }

  public async updateAssignment(id: string, input: UpdateAssignmentInput, actor?: { id: string; name: string }): Promise<Assignment> {
    return this.request(`/assignments/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...input, actor }),
    });
  }

  public async startAssignment(id: string, actor?: { id: string; name: string }): Promise<Assignment> {
    return this.request(`/assignments/${encodeURIComponent(id)}/start`, {
      method: 'POST',
      body: JSON.stringify({ actor }),
    });
  }

  public async blockAssignment(id: string, reason: string, actor?: { id: string; name: string }): Promise<Assignment> {
    return this.request(`/assignments/${encodeURIComponent(id)}/block`, {
      method: 'POST',
      body: JSON.stringify({ reason, actor }),
    });
  }

  public async completeAssignment(id: string, input?: CompleteAssignmentInput, actor?: { id: string; name: string }): Promise<Assignment> {
    return this.request(`/assignments/${encodeURIComponent(id)}/complete`, {
      method: 'POST',
      body: JSON.stringify({ ...input, actor }),
    });
  }

  public async cancelAssignment(id: string, input?: CancelAssignmentInput, actor?: { id: string; name: string }): Promise<Assignment> {
    return this.request(`/assignments/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ ...input, actor }),
    });
  }

  public async reassignAssignment(id: string, input: ReassignAssignmentInput, actor?: { id: string; name: string }): Promise<Assignment> {
    return this.request(`/assignments/${encodeURIComponent(id)}/reassign`, {
      method: 'POST',
      body: JSON.stringify({ ...input, actor }),
    });
  }

  public async getEntityAssignments(entityType: string, entityId: string): Promise<Assignment[]> {
    return this.request(`/assignments/entity/${encodeURIComponent(entityType)}/${encodeURIComponent(entityId)}`);
  }

  public async getUnassignedWork(): Promise<UnassignedWorkItem[]> {
    return this.request('/assignments/unassigned');
  }

  public async getUsers(): Promise<User[]> {
    return this.request('/users');
  }

  public async getUserById(id: string): Promise<User> {
    return this.request(`/users/${encodeURIComponent(id)}`);
  }

  public async createUser(input: CreateUserInput, actor?: { id: string; name: string }): Promise<User> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify({ ...input, actor }),
    });
  }

  public async updateUser(id: string, input: UpdateUserInput, actor?: { id: string; name: string }): Promise<User> {
    return this.request(`/users/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...input, actor }),
    });
  }

  public async getTeamWorkload(): Promise<TeamWorkloadSummary> {
    return this.request('/team/workload');
  }

  public async getUserWorkload(userId: string): Promise<UserWorkload> {
    return this.request(`/team/workload/${encodeURIComponent(userId)}`);
  }

  public async getMyWork(userId?: string): Promise<MyWorkSummary> {
    const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return this.request(`/my-work${qs}`);
  }

  // Authentication Foundation (Phase 11.2)
  public async getMe(): Promise<{ authenticated: boolean; user?: User }> {
    try {
      return await this.request<{ authenticated: boolean; user?: User }>('/auth/me');
    } catch (err: any) {
      if (err.statusCode === 401) {
        this.setSessionToken(null);
        return { authenticated: false };
      }
      throw err;
    }
  }

  public async login(userId: string, password: string): Promise<{ success: boolean; user: User; token?: string }> {
    const res = await this.request<{ success: boolean; user: User; token?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ userId, password }),
    });
    if (res.success && res.token) {
      this.setSessionToken(res.token);
    }
    return res;
  }

  public async logout(): Promise<{ success: boolean }> {
    try {
      return await this.request<{ success: boolean }>('/auth/logout', {
        method: 'POST',
      });
    } finally {
      this.setSessionToken(null);
    }
  }

  public async getProductionBoard(): Promise<import('../types').ProductionBoardItem[]> {
    return this.request('/production-board');
  }

  // Phase 8H / Step 09: Canonical Social Content Review
  public async getSocialReviewPackage(questionId: string): Promise<{ success: boolean; data: import('../types').SocialReviewPackageBundle }> {
    return this.request(`/social-enhancement/review/${encodeURIComponent(questionId)}`);
  }

  public async submitSocialReviewDecision(
    questionId: string,
    decision: 'APPROVED' | 'CHANGES_REQUESTED' | 'REJECTED',
    versionHash: string,
    reason?: string,
    feedbackCategories?: string[]
  ): Promise<{ success: boolean; data: import('../types').SocialReviewPackageBundle; record: import('../types').SocialReviewRecord }> {
    return this.request('/social-reviews/decision', {
      method: 'POST',
      body: JSON.stringify({ questionId, decision, versionHash, reason, feedbackCategories }),
    });
  }

  public async approveSocialReviewPackage(
    questionId: string,
    versionHash: string,
    reason?: string,
    feedbackCategories?: string[]
  ): Promise<{ success: boolean; data: import('../types').SocialReviewPackageBundle; record: import('../types').SocialReviewRecord }> {
    return this.submitSocialReviewDecision(
      questionId,
      'APPROVED',
      versionHash,
      reason || 'Human social package approved.',
      feedbackCategories
    );
  }

  public async requestSocialReviewChanges(
    questionId: string,
    versionHash: string,
    reason: string,
    feedbackCategories?: string[]
  ): Promise<{ success: boolean; data: import('../types').SocialReviewPackageBundle; record: import('../types').SocialReviewRecord }> {
    return this.submitSocialReviewDecision(
      questionId,
      'CHANGES_REQUESTED',
      versionHash,
      reason,
      feedbackCategories
    );
  }

  public async rejectSocialReviewPackage(
    questionId: string,
    versionHash: string,
    reason: string,
    feedbackCategories?: string[]
  ): Promise<{ success: boolean; data: import('../types').SocialReviewPackageBundle; record: import('../types').SocialReviewRecord }> {
    return this.submitSocialReviewDecision(
      questionId,
      'REJECTED',
      versionHash,
      reason,
      feedbackCategories
    );
  }

  public async getSocialReviewHistory(questionId: string): Promise<{ success: boolean; data: import('../types').SocialReviewRecord[] }> {
    return this.request(`/social-enhancement/review/${encodeURIComponent(questionId)}/history`);
  }

  public async getSocialReviewsList(): Promise<{ success: boolean; data: import('../types').SocialReviewRecord[] }> {
    return this.request('/social-reviews');
  }

  public async getSocialReviewItem(reviewId: string): Promise<{
    success: boolean;
    data: import('../types').SocialReviewPackageBundle;
    review?: import('../types').SocialReviewRecord | null;
    questionId: string;
    canReview?: boolean;
  }> {
    return this.request(`/social-reviews/item/${encodeURIComponent(reviewId)}`);
  }

  public async getContentMasters(): Promise<{ success: boolean; count: number; data: import('../types').ContentMaster[] }> {
    return this.request<{ success: boolean; count: number; data: import('../types').ContentMaster[] }>('/content-masters');
  }

  public async getContentMasterDetails(id: string): Promise<{ success: boolean; data: import('./services/content-master.service').ContentMasterDetails }> {
    return this.request<{ success: boolean; data: import('./services/content-master.service').ContentMasterDetails }>(`/content-masters/${encodeURIComponent(id)}`);
  }

  public async getContentMasterCanonicalState(id: string): Promise<{ success: boolean; data: import('../types').ContentMasterCanonicalState }> {
    return this.request<{ success: boolean; data: import('../types').ContentMasterCanonicalState }>(`/content-masters/${encodeURIComponent(id)}/canonical-state`);
  }

  public async transitionContentMasterStatus(id: string, targetStatus: string, remarks?: string): Promise<{ success: boolean; data: import('../types').ContentMaster }> {
    return this.request<{ success: boolean; data: import('../types').ContentMaster }>(`/content-masters/${encodeURIComponent(id)}/transition`, {
      method: 'POST',
      body: JSON.stringify({ targetStatus, remarks }),
    });
  }

  public async archiveContentMaster(id: string, reason?: string): Promise<{ success: boolean; data: import('../types').ContentMaster }> {
    return this.request<{ success: boolean; data: import('../types').ContentMaster }>(`/content-masters/${encodeURIComponent(id)}/archive`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  public async recordSocialAnalytics(
    input: import('../types').CreateSocialAnalyticsInput
  ): Promise<{ success: boolean; record?: import('../types').SocialAnalyticsRecord; error?: string }> {
    return this.request('/analytics', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  public async getSocialAnalyticsForContent(
    contentId: string
  ): Promise<{ success: boolean; count: number; contentId: string; records: import('../types').SocialAnalyticsRecord[] }> {
    return this.request(`/analytics/content/${encodeURIComponent(contentId)}`);
  }

  public async querySocialAnalytics(
    filters?: import('../types').SocialAnalyticsQueryFilters
  ): Promise<{ success: boolean; count: number; records: import('../types').SocialAnalyticsRecord[] }> {
    const params = new URLSearchParams();
    if (filters?.contentId) params.append('contentId', filters.contentId);
    if (filters?.platform) params.append('platform', filters.platform);
    if (filters?.topicId) params.append('topicId', filters.topicId);
    if (filters?.subtopicId) params.append('subtopicId', filters.subtopicId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    const queryString = params.toString();
    return this.request(`/analytics${queryString ? `?${queryString}` : ''}`);
  }

  public async getSocialAnalyticsSummary(
    filters?: import('../types').SocialAnalyticsQueryFilters
  ): Promise<{ success: boolean; summary: import('../types').SocialAnalyticsSummary }> {
    const params = new URLSearchParams();
    if (filters?.contentId) params.append('contentId', filters.contentId);
    if (filters?.platform) params.append('platform', filters.platform);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    const queryString = params.toString();
    return this.request(`/analytics/summary${queryString ? `?${queryString}` : ''}`);
  }

  // Phase 28: Performance Intelligence
  public async getIntelligenceReports(
    limit: number = 20
  ): Promise<{ success: boolean; count: number; reports: import('../types').SocialPerformanceIntelligenceRecord[] }> {
    return this.request(`/analytics/intelligence?limit=${limit}`);
  }

  public async getIntelligenceReportById(
    id: string
  ): Promise<{ success: boolean; report?: import('../types').SocialPerformanceIntelligenceRecord }> {
    return this.request(`/analytics/intelligence/${encodeURIComponent(id)}`);
  }

  public async generateIntelligenceReport(
    input?: { contentId?: string; platform?: string; startDate?: string; endDate?: string; topicId?: string; subtopicId?: string }
  ): Promise<{ success: boolean; record?: import('../types').SocialPerformanceIntelligenceRecord; error?: string }> {
    return this.request('/analytics/intelligence', {
      method: 'POST',
      body: JSON.stringify(input || {}),
    });
  }

  // Phase 29: Content Strategy
  public async getStrategyRecommendations(
    limit: number = 10
  ): Promise<{ success: boolean; count: number; data: import('../types').ContentStrategyRecommendation[] }> {
    return this.request(`/content-strategy/recommendations?limit=${limit}`);
  }

  public async generateStrategyRecommendation(
    input?: { sourceReportId?: string }
  ): Promise<{ success: boolean; recommendation?: import('../types').ContentStrategyRecommendation; error?: string }> {
    return this.request('/content-strategy/recommendations', {
      method: 'POST',
      body: JSON.stringify(input || {}),
    });
  }

  public async applyStrategyRecommendation(
    id: string
  ): Promise<{ success: boolean; data?: import('../types').ContentStrategyRecommendation; error?: string }> {
    return this.request(`/content-strategy/recommendations/${encodeURIComponent(id)}/apply`, {
      method: 'POST',
    });
  }

  // Phase 30: Audience Social Comments (Strictly in Analytics Workbook)
  public async createSocialComment(
    input: import('../types').CreateSocialCommentInput
  ): Promise<{ success: boolean; record?: import('../types').SocialCommentRecord; isDuplicate?: boolean; error?: string }> {
    return this.request('/social-comments', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  public async importSocialComments(
    input: import('../types').ImportSocialCommentsInput
  ): Promise<{
    success: boolean;
    importedCount: number;
    duplicateCount: number;
    failedCount: number;
    createdIds: string[];
    errors: string[];
  }> {
    return this.request('/social-comments/import', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  public async getSocialComments(
    filters?: import('../types').SocialCommentQueryFilters
  ): Promise<{ success: boolean; count: number; records: import('../types').SocialCommentRecord[] }> {
    const params = new URLSearchParams();
    if (filters?.contentId) params.append('contentId', filters.contentId);
    if (filters?.videoId) params.append('videoId', filters.videoId);
    if (filters?.publishingId) params.append('publishingId', filters.publishingId);
    if (filters?.platform) params.append('platform', filters.platform);
    if (filters?.platformPostId) params.append('platformPostId', filters.platformPostId);
    if (filters?.platformCommentId) params.append('platformCommentId', filters.platformCommentId);
    if (filters?.source) params.append('source', filters.source);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.isReply !== undefined) params.append('isReply', String(filters.isReply));
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    const qs = params.toString();
    return this.request(`/social-comments${qs ? `?${qs}` : ''}`);
  }

  public async getSocialCommentsForContent(
    contentId: string
  ): Promise<{ success: boolean; count: number; contentId: string; records: import('../types').SocialCommentRecord[] }> {
    return this.request(`/social-comments/content/${encodeURIComponent(contentId)}`);
  }

  public async getSocialCommentById(
    id: string
  ): Promise<{ success: boolean; record?: import('../types').SocialCommentRecord; error?: string }> {
    return this.request(`/social-comments/${encodeURIComponent(id)}`);
  }

  // Phase 30 / C3: AI Comment Intelligence & Misconception Engine
  public async generateCommentIntelligence(
    input: import('../types').GenerateCommentIntelligenceInput
  ): Promise<{ success: boolean; record?: import('../types').CommentIntelligenceRecord; error?: string }> {
    return this.request('/comment-intelligence/analyze', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  public async getCommentIntelligenceReports(
    limit: number = 20
  ): Promise<{ success: boolean; count: number; reports: import('../types').CommentIntelligenceRecord[] }> {
    return this.request(`/comment-intelligence?limit=${limit}`);
  }

  public async getCommentIntelligenceForContent(
    contentId: string
  ): Promise<{ success: boolean; count: number; contentId: string; reports: import('../types').CommentIntelligenceRecord[] }> {
    return this.request(`/comment-intelligence/content/${encodeURIComponent(contentId)}`);
  }

  public async getCommentIntelligenceById(
    id: string
  ): Promise<{ success: boolean; record?: import('../types').CommentIntelligenceRecord; error?: string }> {
    return this.request(`/comment-intelligence/${encodeURIComponent(id)}`);
  }
}

export const apiClient = new ApiClient();

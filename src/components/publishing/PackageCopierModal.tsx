import React, { useState, useEffect } from 'react';
import { Copy, Check, ShieldCheck, AlertCircle, RefreshCw, FileText, ExternalLink } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { apiClient } from '../../lib/api-client';
import { PlatformPackageProjection, PlatformType } from '../../types';

interface PackageCopierModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string;
  videoTitle: string;
  initialPlatform?: PlatformType;
}

export const PackageCopierModal: React.FC<PackageCopierModalProps> = ({
  isOpen,
  onClose,
  videoId,
  videoTitle,
  initialPlatform = 'youtube',
}) => {
  const [platform, setPlatform] = useState<PlatformType>(initialPlatform);
  const [pkg, setPkg] = useState<PlatformPackageProjection | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPlatform(initialPlatform);
      loadPackage(initialPlatform);
    } else {
      setPkg(null);
      setError(null);
    }
  }, [isOpen, videoId, initialPlatform]);

  const loadPackage = async (targetPlatform: PlatformType) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getPlatformPackage(videoId, targetPlatform);
      setPkg(data);
    } catch (err: any) {
      setPkg(null);
      setError(err?.message || `Failed to load ${targetPlatform} publishing package`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlatformChange = (p: PlatformType) => {
    setPlatform(p);
    loadPackage(p);
  };

  const copyToClipboard = async (fieldName: string, text: string) => {
    if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for iFrame / non-secure context
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2500);
    } catch (err) {
      // Graceful fallback
      setCopiedField(`${fieldName}-manual`);
      setTimeout(() => setCopiedField(null), 3500);
    }
  };

  const formatFullPackageText = (p: PlatformPackageProjection): string => {
    const lines: string[] = [];
    lines.push(`=== ${p.platform.toUpperCase()} PUBLISHING PACKAGE ===`);
    lines.push(`Approved Package Fingerprint: ${p.versionHash}`);
    lines.push(`Video ID: ${p.videoId} | ${p.videoTitle}`);
    if (p.title) {
      lines.push(`\n--- TITLE ---`);
      lines.push(p.title);
    }
    if (p.caption) {
      lines.push(`\n--- CAPTION / DESCRIPTION ---`);
      lines.push(p.caption);
    }
    if (p.hashtags && p.hashtags.length > 0) {
      lines.push(`\n--- HASHTAGS ---`);
      lines.push(p.hashtags.join(' '));
    }
    if (p.tags && p.tags.length > 0) {
      lines.push(`\n--- TAGS / KEYWORDS ---`);
      lines.push(p.tags.join(', '));
    }
    if (p.cta) {
      lines.push(`\n--- CALL TO ACTION ---`);
      lines.push(p.cta);
    }
    if (p.pinnedComment) {
      lines.push(`\n--- PINNED COMMENT ---`);
      lines.push(p.pinnedComment);
    }
    if (p.finalRenderAssetPath) {
      lines.push(`\n--- RENDER ASSET PATH ---`);
      lines.push(p.finalRenderAssetPath);
    }
    if (p.thumbnailDriveUrl || p.thumbnailUrl) {
      lines.push(`\n--- THUMBNAIL ASSET ---`);
      if (p.thumbnailDriveUrl) lines.push(`Drive Asset: ${p.thumbnailDriveUrl}`);
      if (p.thumbnailUrl) lines.push(`Preview: ${p.thumbnailUrl}`);
    }
    return lines.join('\n');
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Platform Package Copier"
      subtitle={`Approved Distribution Copy • ${videoId} - ${videoTitle}`}
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full text-xs">
          <div className="text-slate-500 font-mono text-[11px]">
            {pkg ? `Version Hash: ${pkg.versionHash.slice(0, 16)}...` : ''}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            {pkg && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => copyToClipboard('complete', formatFullPackageText(pkg))}
                className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
              >
                {copiedField === 'complete' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Copied Full Package!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Complete Package</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Platform Selector Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            {(['youtube', 'instagram', 'facebook'] as PlatformType[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePlatformChange(p)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors ${
                  platform === p
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Read-Only Approved Package</span>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-8 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            <p className="text-xs">Fetching approved {platform.toUpperCase()} package...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Package Retrieval Blocked (Gate D / Gate Policy)</span>
            </div>
            <p className="text-slate-700 leading-relaxed font-mono text-[11px] whitespace-pre-wrap">
              {error}
            </p>
          </div>
        )}

        {/* Package Content Display */}
        {pkg && !isLoading && (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 text-xs">
            {/* Title (for YouTube / General) */}
            {pkg.title && (
              <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
                    Title
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('title', pkg.title || '')}
                    className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs"
                  >
                    {copiedField === 'title' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedField === 'title' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200 font-medium text-slate-900">
                  {pkg.title}
                </div>
              </div>
            )}

            {/* Caption */}
            <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
                  Caption / Description
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard('caption', pkg.caption)}
                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs"
                >
                  {copiedField === 'caption' ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedField === 'caption' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <textarea
                readOnly
                value={pkg.caption}
                rows={3}
                className="w-full p-2 bg-white rounded border border-slate-200 text-slate-900 font-normal leading-relaxed resize-none focus:outline-none"
              />
            </div>

            {/* Hashtags */}
            <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
                  Hashtags
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard('hashtags', (pkg.hashtags || []).join(' '))}
                  className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs"
                >
                  {copiedField === 'hashtags' ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedField === 'hashtags' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200 text-indigo-700 font-mono text-[11px]">
                {(pkg.hashtags || []).join(' ') || 'No hashtags provided'}
              </div>
            </div>

            {/* Tags / Keywords (YouTube) */}
            {pkg.tags && pkg.tags.length > 0 && (
              <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
                    Tags / Keywords
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('tags', pkg.tags!.join(', '))}
                    className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs"
                  >
                    {copiedField === 'tags' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedField === 'tags' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200 text-slate-800 font-mono text-[11px]">
                  {pkg.tags.join(', ')}
                </div>
              </div>
            )}

            {/* CTA */}
            {pkg.cta && (
              <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
                    Call To Action
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('cta', pkg.cta)}
                    className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs"
                  >
                    {copiedField === 'cta' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedField === 'cta' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200 text-slate-900 font-medium">
                  {pkg.cta}
                </div>
              </div>
            )}

            {/* Pinned Comment */}
            {pkg.pinnedComment && (
              <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
                    Pinned Comment
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('pinnedComment', pkg.pinnedComment)}
                    className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs"
                  >
                    {copiedField === 'pinnedComment' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedField === 'pinnedComment' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  value={pkg.pinnedComment}
                  rows={2}
                  className="w-full p-2 bg-white rounded border border-slate-200 text-slate-900 font-normal leading-relaxed resize-none focus:outline-none"
                />
              </div>
            )}

            {/* Final Render Asset Path */}
            <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
                  Master Render Asset Path
                </span>
                <div className="flex items-center gap-1.5">
                  {pkg.finalRenderAssetPath && (
                    <>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('assetPath', pkg.finalRenderAssetPath || '')}
                        className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs"
                      >
                        {copiedField === 'assetPath' ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedField === 'assetPath' ? 'Copied' : 'Copy'}</span>
                      </button>
                      {(pkg.finalRenderAssetPath.startsWith('http://') || pkg.finalRenderAssetPath.startsWith('https://')) && (
                        <a
                          href={pkg.finalRenderAssetPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Open Asset</span>
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200 text-slate-800 font-mono text-[11px] truncate">
                {pkg.finalRenderAssetPath || 'No render path recorded'}
              </div>
            </div>

            {/* Associated Thumbnail Asset */}
            <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px]">
                  Associated Thumbnail Asset
                </span>
                <div className="flex items-center gap-1.5">
                  {(pkg.thumbnailDriveUrl || pkg.thumbnailUrl) && (
                    <>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('thumbnailUrl', pkg.thumbnailDriveUrl || pkg.thumbnailUrl || '')}
                        className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs"
                      >
                        {copiedField === 'thumbnailUrl' ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedField === 'thumbnailUrl' ? 'Copied' : 'Copy Link'}</span>
                      </button>
                      <a
                        href={pkg.thumbnailDriveUrl || pkg.thumbnailUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Open Asset</span>
                      </a>
                    </>
                  )}
                </div>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200 text-slate-800 font-mono text-[11px] truncate flex items-center justify-between">
                <span className="truncate">
                  {pkg.thumbnailDriveUrl || pkg.thumbnailUrl || 'No thumbnail asset linked'}
                </span>
                {pkg.thumbnailStatus && (
                  <span className="ml-2 px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-sans font-medium rounded border border-slate-200 shrink-0">
                    {pkg.thumbnailStatus}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

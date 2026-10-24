import React from 'react';
import { ArtifactPreviewProjection } from '../../shared/contracts/artifact-projection.contract';

export interface ArtifactProjectionPreviewProps {
  projection: ArtifactPreviewProjection;
}

/**
 * Renders the shared audience-safe projection. Media previews intentionally
 * expose metadata only; binary content remains behind the media adapter.
 */
export const ArtifactProjectionPreview: React.FC<ArtifactProjectionPreviewProps> = ({
  projection,
}) => (
  <article data-artifact-format={projection.format} data-artifact-id={projection.id}>
    <h2>{projection.title}</h2>
    {projection.format === 'TEXT' ? (
      <p>{projection.content.body}</p>
    ) : (
      <dl>
        <dt>Media file</dt>
        <dd>{projection.media.fileName}</dd>
        <dt>Version</dt>
        <dd>{projection.media.version}</dd>
      </dl>
    )}
  </article>
);

import { Readable } from 'stream';
import {
  ImageArtifactInput,
  ImageArtifactInputSchema,
  ImageArtifactMetadata,
  ImageArtifactMetadataSchema,
  TextArtifact,
  TextArtifactSchema,
} from '../../../../shared/contracts/content-artifacts.contract';
import { validateLearningUnitLink, LearningUnitLinkActor } from './learning-unit-link.service';
import { driveSyncService, UploadAssetParams } from '../../../infrastructure/services/drive-sync.service';
import { MediaAsset } from '../../../../shared';
import { ValidationError } from '../../../../src/lib/errors';

export interface ContentArtifactDependencies {
  validateLink?: typeof validateLearningUnitLink;
  uploadAsset?: (params: UploadAssetParams) => Promise<MediaAsset>;
}

/**
 * Keeps structured text in application data while routing image bytes through
 * the established Drive/MediaAsset pipeline. No binary content is returned or
 * persisted in the artifact metadata contract.
 */
export class ContentArtifactService {
  private readonly validateLink: typeof validateLearningUnitLink;
  private readonly uploadAsset: (params: UploadAssetParams) => Promise<MediaAsset>;

  constructor(dependencies: ContentArtifactDependencies = {}) {
    this.validateLink = dependencies.validateLink || validateLearningUnitLink;
    this.uploadAsset = dependencies.uploadAsset || ((params) => driveSyncService.uploadProductionAsset(params));
  }

  public validateTextArtifact(input: unknown): TextArtifact {
    return TextArtifactSchema.parse(input);
  }

  public async uploadImageArtifact(
    input: unknown,
    bodyStreamOrBuffer: Readable | Buffer,
    actor: LearningUnitLinkActor
  ): Promise<ImageArtifactMetadata> {
    const artifact = ImageArtifactInputSchema.parse(input);
    await this.validateLink(artifact.learningUnitId, actor);

    // The client size is a consistency check only; DriveSyncService validates
    // the actual bytes before upload, so metadata can never authorize a larger
    // or different payload.
    const payload = Buffer.isBuffer(bodyStreamOrBuffer)
      ? bodyStreamOrBuffer
      : await this.readStream(bodyStreamOrBuffer);
    if (payload.length !== artifact.fileSize) {
      throw new ValidationError(`Image payload size (${payload.length}) does not match declared size (${artifact.fileSize}).`);
    }

    const mediaAsset = await this.uploadAsset({
      contentId: artifact.contentId,
      learningUnitId: artifact.learningUnitId,
      mediaStage: 'THUMBNAIL',
      fileName: artifact.fileName,
      mimeType: artifact.mimeType,
      bodyStreamOrBuffer: payload,
    });

    if (!mediaAsset.driveFileId || mediaAsset.fileSize !== artifact.fileSize || mediaAsset.mimeType !== artifact.mimeType) {
      throw new ValidationError('Drive metadata does not match the validated image artifact.');
    }

    const metadata = ImageArtifactMetadataSchema.parse({
      ...artifact,
      driveFileId: mediaAsset.driveFileId,
      folderId: mediaAsset.folderId,
      checksum: mediaAsset.checksum || mediaAsset.md5Checksum,
      version: mediaAsset.version,
    });
    return metadata;
  }

  private async readStream(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
}

export const contentArtifactService = new ContentArtifactService();

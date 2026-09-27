import { PassThrough, Readable } from 'stream';
import { ZipArchive } from 'archiver';
import { Upload } from '@aws-sdk/lib-storage';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, getR2BucketName, getPresignedDownloadUrl } from '@/lib/r2';
import { connectToDatabase } from '@/lib/mongodb';
import { DownloadRequest } from '@/models/DownloadRequest';
import { MediaItem } from '@/models/MediaItem';
import { sendDownloadReadyEmail } from '@/lib/email';

/**
 * Background worker task to package all media items of a gallery into a ZIP archive,
 * stream it directly to Cloudflare R2, generate a 48-hour signed download URL,
 * and email the client.
 */
export async function processArchiveJob(jobId: string): Promise<void> {
  console.log(`[ARCHIVE WORKER] Starting archive processing for job ID: ${jobId}`);

  await connectToDatabase();

  const job = await DownloadRequest.findById(jobId);
  if (!job) {
    console.error(`[ARCHIVE WORKER] Job ${jobId} not found.`);
    return;
  }

  if (job.status === 'processing' || job.status === 'ready') {
    console.log(`[ARCHIVE WORKER] Job ${jobId} is already in state: ${job.status}`);
    return;
  }

  // Mark as processing
  job.status = 'processing';
  await job.save();

  try {
    const isMockR2 = !process.env.R2_ACCESS_KEY_ID || process.env.R2_ENDPOINT?.includes('example.r2');
    const bucket = isMockR2 ? 'everlens-media' : getR2BucketName();

    // Fetch all media items for this gallery
    const items = await MediaItem.find({ galleryId: job.galleryId })
      .sort({ category: 1, originalFilename: 1 })
      .lean();

    if (items.length === 0) {
      job.status = 'failed';
      job.errorMessage = 'No photographs or films found in this gallery to archive.';
      await job.save();
      return;
    }

    const timestamp = Date.now();
    const safeSlug = job.coupleNames
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const zipKey = `archives/${job.galleryId}/${safeSlug}_wedding_archive_${timestamp}.zip`;

    let downloadUrl: string;
    let packagedCount = 0;

    if (isMockR2) {
      console.log(`[ARCHIVE WORKER] Development mode: Mocking archive generation for job ${jobId}`);
      packagedCount = items.length;
      downloadUrl = '/api/portal/downloads/zip?type=everything';
    } else {
      // Setup streaming pipeline: ZipArchive -> PassThrough -> R2 Upload
      const passThrough = new PassThrough();
      const archive = new ZipArchive({
        zlib: { level: 5 }, // Balanced compression for fast packaging
      });

      archive.on('warning', (err: any) => {
        console.warn('[ARCHIVE WORKER] Archiver warning:', err);
      });

      archive.on('error', (err: any) => {
        console.error('[ARCHIVE WORKER] Archiver error:', err);
        throw err;
      });

      // Pipe archive output into passThrough stream
      archive.pipe(passThrough);

      // Multi-part streaming upload directly to Cloudflare R2
      const uploader = new Upload({
        client: r2Client,
        params: {
          Bucket: bucket,
          Key: zipKey,
          Body: passThrough,
          ContentType: 'application/zip',
        },
        queueSize: 4,
        partSize: 10 * 1024 * 1024, // 10MB chunk size
        leavePartsOnError: false,
      });

      // Stream files into the archive
      for (const item of items) {
        try {
          const getCommand = new GetObjectCommand({
            Bucket: bucket,
            Key: item.r2Key,
          });

          const r2Obj = await r2Client.send(getCommand);
          if (r2Obj.Body) {
            const categoryFolder = item.category
              ? item.category.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
              : 'Moments';

            const entryPath = `${categoryFolder}/${item.originalFilename}`;
            archive.append(r2Obj.Body as Readable, { name: entryPath });
            packagedCount += 1;
          }
        } catch (fileErr: any) {
          console.warn(
            `[ARCHIVE WORKER] Could not stream file ${item.originalFilename} (${item.r2Key}):`,
            fileErr?.message || fileErr
          );
        }
      }

      // Include an archival manifest text file in root of ZIP
      const manifestContent = `EVERLENS WEDDINGS — ARCHIVAL COLLECTION
Couple: ${job.coupleNames}
Delivered: ${new Date().toISOString()}
Files Packaged: ${packagedCount} of ${items.length}

Each chapter contains your original master files grading specifications.
Thank you for trusting EverLens with your celebration memories.
`;
      archive.append(manifestContent, { name: 'README_ARCHIVE.txt' });

      // Finalize the archive stream
      await archive.finalize();

      // Wait for the R2 multipart upload to complete
      await uploader.done();

      console.log(`[ARCHIVE WORKER] Upload completed for ${zipKey}`);

      // Generate 48-hour signed download URL (48 * 3600 = 172,800 seconds)
      downloadUrl = await getPresignedDownloadUrl(zipKey, 172800, {
        downloadFilename: `${safeSlug}_wedding_collection.zip`,
        contentType: 'application/zip',
      });
    }

    const expiresAt = new Date(Date.now() + 48 * 3600 * 1000);

    job.status = 'ready';
    job.r2Key = zipKey;
    job.downloadUrl = downloadUrl;
    job.expiresAt = expiresAt;
    job.itemCount = packagedCount;
    job.completedAt = new Date();
    await job.save();

    console.log(`[ARCHIVE WORKER] Job ${jobId} marked READY. Dispatching email...`);

    // Dispatch transactional email to couple
    await sendDownloadReadyEmail({
      to: job.clientEmail,
      coupleNames: job.coupleNames,
      downloadUrl,
      expiresAt,
      itemCount: packagedCount,
    });

    console.log(`[ARCHIVE WORKER] Completed job ${jobId} successfully.`);
  } catch (err: any) {
    console.error(`[ARCHIVE WORKER] Archive job ${jobId} failed:`, err);
    job.status = 'failed';
    job.errorMessage = err?.message || 'Archive packaging failed.';
    await job.save();
  }
}

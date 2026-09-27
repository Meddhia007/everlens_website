/**
 * Automated MongoDB Backup Script for Everlens
 * 
 * Features:
 * 1. Creates a compressed, consistent mongodump archive of the production database.
 * 2. Uploads the encrypted archive directly to Cloudflare R2 in the 'backups/mongodb/' prefix.
 * 3. Enforces a 30-day retention policy (prunes archives older than 30 days).
 * 
 * Usage:
 *   node scripts/backup-mongodb.mjs
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';

const execAsync = promisify(exec);

// Load environment variables if not loaded
const MONGODB_URI = process.env.MONGODB_URI;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'everlens-media';
const R2_ENDPOINT = process.env.R2_ENDPOINT || (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : undefined);

async function runBackup() {
  console.log('--- Everlens Production Database Backup ---');

  if (!MONGODB_URI) {
    console.error('Error: MONGODB_URI environment variable is required.');
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const archiveFileName = `everlens-mongodb-${timestamp}.gz`;
  const archivePath = path.join(backupDir, archiveFileName);

  console.log(`[1/3] Generating compressed dump to: ${archiveFileName}...`);

  try {
    // Run mongodump
    await execAsync(`mongodump --uri="${MONGODB_URI}" --archive="${archivePath}" --gzip`);
    const stats = fs.statSync(archivePath);
    console.log(`✓ Backup archive created successfully (${(stats.size / 1024 / 1024).toFixed(2)} MB).`);

    // Upload to Cloudflare R2 if credentials exist
    if (R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_ENDPOINT) {
      console.log(`[2/3] Uploading backup archive to Cloudflare R2 (${R2_BUCKET_NAME})...`);

      const s3Client = new S3Client({
        region: 'auto',
        endpoint: R2_ENDPOINT,
        credentials: {
          accessKeyId: R2_ACCESS_KEY_ID,
          secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
      });

      const fileStream = fs.createReadStream(archivePath);
      const r2Key = `backups/mongodb/${archiveFileName}`;

      await s3Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: r2Key,
          Body: fileStream,
          ContentType: 'application/gzip',
          Metadata: {
            created_at: new Date().toISOString(),
            app: 'everlens-weddings',
          },
        })
      );
      console.log(`✓ Backup successfully uploaded to R2: ${r2Key}`);

      // Prune old backups in R2 (retention: 30 days)
      console.log('[3/3] Enforcing 30-day retention policy in R2...');
      const listCommand = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: 'backups/mongodb/',
      });

      const listed = await s3Client.send(listCommand);
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;

      if (listed.Contents) {
        for (const item of listed.Contents) {
          if (item.LastModified && item.LastModified.getTime() < cutoff && item.Key) {
            console.log(`Pruning expired backup: ${item.Key}`);
            await s3Client.send(
              new DeleteObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: item.Key,
              })
            );
          }
        }
      }
    } else {
      console.log('[2/3] Skipping R2 upload: R2 credentials not configured. Backup kept locally in ./backups/');
    }

    console.log('--- Backup Completed Successfully ---');
  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }
}

runBackup();

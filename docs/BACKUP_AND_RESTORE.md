# Everlens Disaster Recovery: Backup & Restore Runbook

This document defines the comprehensive production backup strategy and step-by-step restoration procedures for the Everlens platform across **MongoDB** and **Cloudflare R2**.

---

## 1. System Architecture & Objectives

| Component | Storage | Backup Target | RPO (Data Loss Window) | RTO (Restore Time) |
| :--- | :--- | :--- | :--- | :--- |
| **Database** | MongoDB Atlas / Self-hosted | Cloudflare R2 / S3 | < 1 hour (Atlas) / 24h (Cron) | < 15 minutes |
| **Media Assets** | Cloudflare R2 Bucket | Versioning + Secondary S3 | Near 0 (Object Versioning) | < 30 minutes |

---

## 2. MongoDB Backup Strategy

### Method A: Automated CLI Script (Built-in)
The application includes an automated backup utility that dumps the entire database, compresses it with gzip, and stores it in the private `backups/mongodb/` prefix in Cloudflare R2 with automatic 30-day retention pruning.

```bash
# Run manual on-demand backup
npm run db:backup
```

**Automating via Daily Crontab (e.g. at 03:00 UTC daily):**
```bash
0 3 * * * cd /path/to/everlens_website && /usr/local/bin/node scripts/backup-mongodb.mjs >> /var/log/everlens-backup.log 2>&1
```

### Method B: MongoDB Atlas Continuous Cloud Backups (Recommended for Production)
If hosting on MongoDB Atlas:
1. Navigate to **Database Deployments** > **Cluster Details** > **Backup**.
2. Continuous Cloud Backups are enabled by default (M10+ tiers).
3. Provides 1-click **Point-in-Time Recovery (PITR)** to any second within the past 7 days.

---

## 3. MongoDB Step-by-Step Restore Procedure

### Step 1: Download or Locate Backup Archive
If restoring from Cloudflare R2:
```bash
# Using AWS CLI configured with R2 credentials
aws s3 cp s3://everlens-media/backups/mongodb/everlens-mongodb-2026-09-27T18-00-00-000Z.gz ./restore-dump.gz \
  --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

### Step 2: Full Database Restoration
> [!CAUTION]
> The `--drop` flag drops existing collections before restoring. Use with caution in production.

```bash
# Restore entire database from compressed archive
mongorestore --uri="$MONGODB_URI" --drop --gzip --archive="./restore-dump.gz"
```

### Step 3: Targeted / Single-Collection Restoration
If you only need to restore a corrupted collection without affecting the rest of the database:
```bash
# Restore only the 'galleries' collection
mongorestore --uri="$MONGODB_URI" \
  --nsInclude="*.galleries" \
  --drop \
  --gzip \
  --archive="./restore-dump.gz"
```

---

## 4. Cloudflare R2 Media Backup & Versioning Strategy

Everlens stores photographs and 4K master films in Cloudflare R2 under namespaced keys:
`galleries/<galleryId>/photos/...` and `galleries/<galleryId>/videos/...`.

### 1. Enabling Bucket Versioning in Cloudflare R2
Bucket versioning ensures that if an asset is overwritten or accidentally deleted, previous object versions remain recoverable.
* In Cloudflare Dashboard: **R2** > Select `everlens-media` bucket > **Settings** > **Bucket Versioning** > Enable.
* Non-current version expiration policy: Configure lifecycle rules to expire non-current versions after 90 days.

### 2. Secondary Off-site Replication (R2 to AWS S3 Glacier / Backblaze B2)
Using `rclone` for daily synchronized mirror:
```bash
# Mirror R2 media assets to secondary backup storage
rclone sync r2:everlens-media/galleries/ s3-secondary:everlens-media-cold-backup/galleries/ \
  --fast-list \
  --transfers 16 \
  --checkers 32
```

---

## 5. Cloudflare R2 Media Restore Procedure

### Restoring an Accidentally Deleted Object Version
1. Using AWS CLI with R2 credentials:
```bash
# List versions of the key
aws s3api list-object-versions \
  --bucket everlens-media \
  --prefix "galleries/<galleryId>/" \
  --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com

# Restore specific version by copying version ID back to head
aws s3api copy-object \
  --bucket everlens-media \
  --copy-source "everlens-media/<objectKey>?versionId=<versionId>" \
  --key "<objectKey>" \
  --endpoint-url https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

### Restoring Entire Gallery Folder from Secondary Backup
```bash
rclone copy s3-secondary:everlens-media-cold-backup/galleries/<galleryId>/ r2:everlens-media/galleries/<galleryId>/ --progress
```

---

## 6. Post-Restore Verification Checklist

After performing any restoration, execute this verification runbook:

- [ ] **Database Connectivity**: Verify application connects to database (`curl http://localhost:3000/api/auth/session`).
- [ ] **Document Integrity**: Verify collections have expected record counts:
  ```bash
  mongosh "$MONGODB_URI" --eval 'db.galleries.countDocuments(); db.mediaitems.countDocuments(); db.printselections.countDocuments()'
  ```
- [ ] **Authentication**: Log into Admin Dashboard (`/admin/login`) and test Client Login (`/portal/login`).
- [ ] **Media Link Presigning**: Open any client gallery in the portal and verify that presigned download URLs generate valid, viewable media links.
- [ ] **Audit Confirmation**: Check that an audit log event was recorded for the restoration check (`AuditLog` collection).

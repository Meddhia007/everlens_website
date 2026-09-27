import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Load .env.local if available via Node.js built-in
try {
  if (process.loadEnvFile && fs.existsSync('.env.local')) {
    process.loadEnvFile('.env.local');
  }
} catch (e) {
  // Ignored if already loaded
}

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI in environment.');
    process.exit(1);
  }

  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB.');

  const { runDailyGalleryLifecycle } = await import('../lib/galleryLifecycle.ts');

  console.log('\n--- Running EverLens Daily Gallery Lifecycle ---');
  const result = await runDailyGalleryLifecycle();
  console.log('\nExecution Summary:');
  console.log(`- Galleries Auto-Archived: ${result.archivedCount}`);
  console.log(`- 7-Day Warning Emails Sent: ${result.sent7DayCount}`);
  console.log(`- 1-Day Final Notice Emails Sent: ${result.sent1DayCount}`);
  console.log(`- Processed At: ${result.processedAt}`);

  await mongoose.disconnect();
  console.log('\nDatabase connection closed. Daily lifecycle job completed.');
}

run().catch((err) => {
  console.error('Daily lifecycle execution failed:', err);
  process.exit(1);
});

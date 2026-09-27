import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Load .env.local if available
try {
  if (process.loadEnvFile) {
    process.loadEnvFile('.env.local');
  }
} catch {
  // File might not exist or env already loaded
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/everlens';

// Schemas defined inline for standalone script execution without build dependencies
const AdminUserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, default: 'Studio Admin' },
  },
  { timestamps: true }
);

const GallerySchema = new mongoose.Schema(
  {
    coupleNames: { type: String, required: true, trim: true },
    weddingDate: { type: Date, required: true },
    clientEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    status: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft' },
    expirationDate: { type: Date },
    guestPin: { type: String },
    guestLinkToken: { type: String },
  },
  { timestamps: true }
);

const MediaItemSchema = new mongoose.Schema(
  {
    galleryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gallery', required: true },
    originalFilename: { type: String, required: true },
    r2Key: { type: String, required: true },
    type: { type: String, enum: ['photo', 'video'], required: true },
    category: {
      type: String,
      enum: ['getting-ready', 'ceremony', 'couples-portraits', 'reception', 'films'],
      required: true,
    },
    isPublicPortfolio: { type: Boolean, default: false },
    isPrintSelected: { type: Boolean, default: false },
    printNote: { type: String },
  },
  { timestamps: true }
);

const PrintSelectionSchema = new mongoose.Schema(
  {
    galleryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Gallery', required: true, unique: true },
    mediaItemIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MediaItem' }],
    submittedAt: { type: Date },
    locked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const AdminUser = mongoose.models.AdminUser || mongoose.model('AdminUser', AdminUserSchema);
const Gallery = mongoose.models.Gallery || mongoose.model('Gallery', GallerySchema);
const MediaItem = mongoose.models.MediaItem || mongoose.model('MediaItem', MediaItemSchema);
const PrintSelection = mongoose.models.PrintSelection || mongoose.model('PrintSelection', PrintSelectionSchema);

async function runSeed() {
  try {
    console.log(`\nConnecting to database: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log(' Connected to MongoDB successfully.\n');

    // 1. Seed Admin
    const adminEmail = 'admin@everlensweddings.com';
    const adminPassword = 'EverLens2025!';
    const salt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash(adminPassword, salt);

    let admin = await AdminUser.findOne({ email: adminEmail });
    if (!admin) {
      admin = await AdminUser.create({
        email: adminEmail,
        passwordHash: adminHash,
        name: 'Studio Admin',
      });
      console.log(` Created Admin User: ${adminEmail}`);
    } else {
      admin.passwordHash = adminHash;
      await admin.save();
      console.log(` Updated Admin User: ${adminEmail}`);
    }

    // 2. Seed Client Gallery
    const clientEmail = 'sarah.youssef@example.com';
    const clientPassword = 'Wedding2025!';
    const clientHash = await bcrypt.hash(clientPassword, salt);

    let gallery = await Gallery.findOne({ clientEmail });
    if (!gallery) {
      gallery = await Gallery.create({
        coupleNames: 'Sarah & Youssef',
        weddingDate: new Date('2024-05-12'),
        clientEmail,
        passwordHash: clientHash,
        status: 'active',
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        guestPin: '4829',
        guestLinkToken: 'sy-carthage-2024',
      });
      console.log(` Created Client Gallery: ${clientEmail} (${gallery.coupleNames})`);
    } else {
      gallery.passwordHash = clientHash;
      gallery.status = 'active';
      await gallery.save();
      console.log(` Updated Client Gallery: ${clientEmail} (${gallery.coupleNames})`);
    }

    // 3. Seed Media Items
    const existingMediaCount = await MediaItem.countDocuments({ galleryId: gallery._id });
    if (existingMediaCount < 10) {
      await MediaItem.deleteMany({ galleryId: gallery._id });

      const sampleItems = [
        {
          galleryId: gallery._id,
          originalFilename: 'bridal_veil_editorial_01.jpg',
          r2Key: `galleries/${gallery._id}/photos/bridal_veil_editorial_01.jpg`,
          type: 'photo',
          category: 'getting-ready',
          isPublicPortfolio: true,
          isPrintSelected: true,
          printNote: 'Cover photo for archival linen album',
        },
        {
          galleryId: gallery._id,
          originalFilename: 'rades_coastal_portrait_02.jpg',
          r2Key: `galleries/${gallery._id}/photos/rades_coastal_portrait_02.jpg`,
          type: 'photo',
          category: 'couples-portraits',
          isPublicPortfolio: true,
          isPrintSelected: true,
          printNote: 'Spread across pages 4-5',
        },
        {
          galleryId: gallery._id,
          originalFilename: 'ayoub_dorsaf_golden_hour_03.jpg',
          r2Key: `galleries/${gallery._id}/photos/ayoub_dorsaf_golden_hour_03.jpg`,
          type: 'photo',
          category: 'couples-portraits',
          isPublicPortfolio: true,
          isPrintSelected: true,
          printNote: 'Warm golden hour lab grading',
        },
        {
          galleryId: gallery._id,
          originalFilename: 'traditional_heritage_attire_04.jpg',
          r2Key: `galleries/${gallery._id}/photos/traditional_heritage_attire_04.jpg`,
          type: 'photo',
          category: 'ceremony',
          isPublicPortfolio: true,
          isPrintSelected: false,
        },
        {
          galleryId: gallery._id,
          originalFilename: 'carthage_palace_ceremony_05.jpg',
          r2Key: `galleries/${gallery._id}/photos/carthage_palace_ceremony_05.jpg`,
          type: 'photo',
          category: 'ceremony',
          isPublicPortfolio: true,
          isPrintSelected: true,
          printNote: 'Monochrome black & white spread',
        },
        {
          galleryId: gallery._id,
          originalFilename: 'mediterranean_shoreline_06.jpg',
          r2Key: `galleries/${gallery._id}/photos/mediterranean_shoreline_06.jpg`,
          type: 'photo',
          category: 'couples-portraits',
          isPublicPortfolio: true,
          isPrintSelected: true,
          printNote: 'Full bleed centerfold',
        },
        {
          galleryId: gallery._id,
          originalFilename: 'ayoub_dorsaf_sunset_vows_07.jpg',
          r2Key: `galleries/${gallery._id}/photos/ayoub_dorsaf_sunset_vows_07.jpg`,
          type: 'photo',
          category: 'ceremony',
          isPublicPortfolio: true,
          isPrintSelected: true,
          printNote: 'Retouch soft focus background',
        },
        {
          galleryId: gallery._id,
          originalFilename: 'heirloom_family_portrait_08.jpg',
          r2Key: `galleries/${gallery._id}/photos/heirloom_family_portrait_08.jpg`,
          type: 'photo',
          category: 'reception',
          isPublicPortfolio: true,
          isPrintSelected: false,
        },
        {
          galleryId: gallery._id,
          originalFilename: 'hedi_zaibi_bridal_couture_09.jpg',
          r2Key: `galleries/${gallery._id}/photos/hedi_zaibi_bridal_couture_09.jpg`,
          type: 'photo',
          category: 'getting-ready',
          isPublicPortfolio: true,
          isPrintSelected: false,
        },
        {
          galleryId: gallery._id,
          originalFilename: 'ayoub_dorsaf_celebration_dance_10.jpg',
          r2Key: `galleries/${gallery._id}/photos/ayoub_dorsaf_celebration_dance_10.jpg`,
          type: 'photo',
          category: 'reception',
          isPublicPortfolio: true,
          isPrintSelected: false,
        },
        {
          galleryId: gallery._id,
          originalFilename: 'rades_sunset_landscape_11.jpg',
          r2Key: `galleries/${gallery._id}/photos/rades_sunset_landscape_11.jpg`,
          type: 'photo',
          category: 'couples-portraits',
          isPublicPortfolio: true,
          isPrintSelected: false,
        },
        {
          galleryId: gallery._id,
          originalFilename: 'wedding_highlight_film_4k.mp4',
          r2Key: `galleries/${gallery._id}/films/wedding_highlight_film_4k.mp4`,
          type: 'video',
          category: 'films',
          isPublicPortfolio: true,
          isPrintSelected: false,
        },
        {
          galleryId: gallery._id,
          originalFilename: 'cinematic_teaser_reel.mp4',
          r2Key: `galleries/${gallery._id}/films/cinematic_teaser_reel.mp4`,
          type: 'video',
          category: 'films',
          isPublicPortfolio: true,
          isPrintSelected: false,
        },
      ];
      await MediaItem.insertMany(sampleItems);
      console.log(` Inserted ${sampleItems.length} media items.`);
    }

    // 4. Seed Print Selection
    let printSelection = await PrintSelection.findOne({ galleryId: gallery._id });
    if (!printSelection) {
      const selected = await MediaItem.find({ galleryId: gallery._id, isPrintSelected: true });
      printSelection = await PrintSelection.create({
        galleryId: gallery._id,
        mediaItemIds: selected.map((m) => m._id),
        locked: false,
      });
      console.log(' Created initial PrintSelection record (max 50 enforced).');
    }

    console.log('\n=========================================');
    console.log(' DATABASE SEED COMPLETED SUCCESSFULLY');
    console.log('=========================================');
    console.log('1. Admin Portal Flow:');
    console.log(`   URL:      http://localhost:3000/admin/login`);
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('\n2. Client Portal Flow:');
    console.log(`   URL:      http://localhost:3000/portal/login`);
    console.log(`   Email:    ${clientEmail}`);
    console.log(`   Password: ${clientPassword}`);
    console.log('=========================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

runSeed();

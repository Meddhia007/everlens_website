import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { AdminUser } from '@/models/AdminUser';
import { Gallery } from '@/models/Gallery';
import { MediaItem } from '@/models/MediaItem';
import { PrintSelection } from '@/models/PrintSelection';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  return handleSeed();
}

export async function POST() {
  return handleSeed();
}

async function handleSeed() {
  try {
    await connectToDatabase();

    // 1. Seed or update Admin User
    const adminEmail = 'admin@everlensweddings.com';
    const adminPassword = 'EverLens2025!';
    const adminPasswordHash = await hashPassword(adminPassword);

    let admin = await AdminUser.findOne({ email: adminEmail });
    if (!admin) {
      admin = await AdminUser.create({
        email: adminEmail,
        passwordHash: adminPasswordHash,
        name: 'Studio Admin',
      });
      console.log('Created admin user:', adminEmail);
    } else {
      admin.passwordHash = adminPasswordHash;
      await admin.save();
      console.log('Updated existing admin user password:', adminEmail);
    }

    // 2. Seed or update Client Gallery
    const clientEmail = 'sarah.youssef@example.com';
    const clientPassword = 'Wedding2025!';
    const clientPasswordHash = await hashPassword(clientPassword);

    let gallery = await Gallery.findOne({ clientEmail });
    if (!gallery) {
      gallery = await Gallery.create({
        coupleNames: 'Sarah & Youssef',
        weddingDate: new Date('2024-05-12'),
        clientEmail,
        passwordHash: clientPasswordHash,
        status: 'active',
        expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        guestPin: '4829',
        guestLinkToken: 'sy-carthage-2024',
      });
      console.log('Created sample client gallery for:', clientEmail);
    } else {
      gallery.passwordHash = clientPasswordHash;
      gallery.status = 'active';
      await gallery.save();
      console.log('Updated existing gallery password for:', clientEmail);
    }

    // 3. Seed Sample Media Items if none exist for this gallery
    const existingMediaCount = await MediaItem.countDocuments({ galleryId: gallery._id });
    let createdMediaItems = [];

    if (existingMediaCount < 10) {
      // Remove any sparse existing sample items and insert full rich collection
      await MediaItem.deleteMany({ galleryId: gallery._id });

      const sampleItems = [
        {
          galleryId: gallery._id,
          originalFilename: 'bridal_veil_editorial_01.jpg',
          r2Key: `galleries/${gallery._id}/photos/bridal_veil_editorial_01.jpg`,
          type: 'photo' as const,
          category: 'getting-ready' as const,
          isPublicPortfolio: true,
          isPrintSelected: true,
          printNote: 'Cover photo for archival linen album',
        },
        {
          galleryId: gallery._id,
          originalFilename: 'rades_coastal_portrait_02.jpg',
          r2Key: `galleries/${gallery._id}/photos/rades_coastal_portrait_02.jpg`,
          type: 'photo' as const,
          category: 'couples-portraits' as const,
          isPublicPortfolio: true,
          isPrintSelected: true,
          printNote: 'Spread across pages 4-5',
        },
        {
          galleryId: gallery._id,
          originalFilename: 'ayoub_dorsaf_golden_hour_03.jpg',
          r2Key: `galleries/${gallery._id}/photos/ayoub_dorsaf_golden_hour_03.jpg`,
          type: 'photo' as const,
          category: 'couples-portraits' as const,
          isPublicPortfolio: true,
          isPrintSelected: true,
          printNote: 'Warm golden hour lab grading',
        },
        {
          galleryId: gallery._id,
          originalFilename: 'traditional_heritage_attire_04.jpg',
          r2Key: `galleries/${gallery._id}/photos/traditional_heritage_attire_04.jpg`,
          type: 'photo' as const,
          category: 'ceremony' as const,
          isPublicPortfolio: true,
          isPrintSelected: false,
        },
        {
          galleryId: gallery._id,
          originalFilename: 'carthage_palace_ceremony_05.jpg',
          r2Key: `galleries/${gallery._id}/photos/carthage_palace_ceremony_05.jpg`,
          type: 'photo' as const,
          category: 'ceremony' as const,
          isPublicPortfolio: true,
          isPrintSelected: true,
          printNote: 'Monochrome black & white spread',
        },
        {
          galleryId: gallery._id,
          originalFilename: 'mediterranean_shoreline_06.jpg',
          r2Key: `galleries/${gallery._id}/photos/mediterranean_shoreline_06.jpg`,
          type: 'photo' as const,
          category: 'couples-portraits' as const,
          isPublicPortfolio: true,
          isPrintSelected: true,
          printNote: 'Full bleed centerfold',
        },
        {
          galleryId: gallery._id,
          originalFilename: 'ayoub_dorsaf_sunset_vows_07.jpg',
          r2Key: `galleries/${gallery._id}/photos/ayoub_dorsaf_sunset_vows_07.jpg`,
          type: 'photo' as const,
          category: 'ceremony' as const,
          isPublicPortfolio: true,
          isPrintSelected: true,
          printNote: 'Retouch soft focus background',
        },
        {
          galleryId: gallery._id,
          originalFilename: 'heirloom_family_portrait_08.jpg',
          r2Key: `galleries/${gallery._id}/photos/heirloom_family_portrait_08.jpg`,
          type: 'photo' as const,
          category: 'reception' as const,
          isPublicPortfolio: true,
          isPrintSelected: false,
        },
        {
          galleryId: gallery._id,
          originalFilename: 'hedi_zaibi_bridal_couture_09.jpg',
          r2Key: `galleries/${gallery._id}/photos/hedi_zaibi_bridal_couture_09.jpg`,
          type: 'photo' as const,
          category: 'getting-ready' as const,
          isPublicPortfolio: true,
          isPrintSelected: false,
        },
        {
          galleryId: gallery._id,
          originalFilename: 'ayoub_dorsaf_celebration_dance_10.jpg',
          r2Key: `galleries/${gallery._id}/photos/ayoub_dorsaf_celebration_dance_10.jpg`,
          type: 'photo' as const,
          category: 'reception' as const,
          isPublicPortfolio: true,
          isPrintSelected: false,
        },
        {
          galleryId: gallery._id,
          originalFilename: 'rades_sunset_landscape_11.jpg',
          r2Key: `galleries/${gallery._id}/photos/rades_sunset_landscape_11.jpg`,
          type: 'photo' as const,
          category: 'couples-portraits' as const,
          isPublicPortfolio: true,
          isPrintSelected: false,
        },
        {
          galleryId: gallery._id,
          originalFilename: 'wedding_highlight_film_4k.mp4',
          r2Key: `galleries/${gallery._id}/films/wedding_highlight_film_4k.mp4`,
          type: 'video' as const,
          category: 'films' as const,
          isPublicPortfolio: true,
          isPrintSelected: false,
        },
        {
          galleryId: gallery._id,
          originalFilename: 'cinematic_teaser_reel.mp4',
          r2Key: `galleries/${gallery._id}/films/cinematic_teaser_reel.mp4`,
          type: 'video' as const,
          category: 'films' as const,
          isPublicPortfolio: true,
          isPrintSelected: false,
        },
      ];

      createdMediaItems = await MediaItem.insertMany(sampleItems);
      console.log(`Inserted ${createdMediaItems.length} media items.`);
    }

    // 4. Seed or update PrintSelection
    let printSelection = await PrintSelection.findOne({ galleryId: gallery._id });
    const selectedMedia = await MediaItem.find({
      galleryId: gallery._id,
      isPrintSelected: true,
    });

    if (!printSelection) {
      printSelection = await PrintSelection.create({
        galleryId: gallery._id,
        mediaItemIds: selectedMedia.map((m) => m._id),
        locked: false,
      });
      console.log('Created PrintSelection record for gallery');
    } else {
      printSelection.mediaItemIds = selectedMedia.map((m) => m._id);
      await printSelection.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully!',
      credentials: {
        admin: {
          email: adminEmail,
          password: adminPassword,
          loginUrl: '/admin/login',
        },
        client: {
          email: clientEmail,
          password: clientPassword,
          coupleNames: 'Sarah & Youssef',
          loginUrl: '/portal/login',
        },
      },
      galleryId: gallery._id.toString(),
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: error?.message || 'Database seeding failed' },
      { status: 500 }
    );
  }
}

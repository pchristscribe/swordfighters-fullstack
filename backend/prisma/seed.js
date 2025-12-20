import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default admin user
  const adminEmail = 'admin@swordfighters.com';
  const adminPassword = 'Admin123!'; // Change this immediately after first login!

  const existingAdmin = await prisma.admin.findUnique({
    where: { email: adminEmail }
  });

  if (existingAdmin) {
    console.log(`✅ Admin user already exists: ${adminEmail}`);
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.admin.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: 'Admin User',
        role: 'admin',
        isActive: true
      }
    });

    console.log(`✅ Created admin user: ${admin.email}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('   ⚠️  CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN!');
  }

  // Create sample categories
  const categories = [
    {
      name: 'Fashion & Accessories',
      slug: 'fashion-accessories',
      description: 'Stylish clothing, accessories, and fashion items',
      imageUrl: 'https://via.placeholder.com/400x300?text=Fashion'
    },
    {
      name: 'Home & Living',
      slug: 'home-living',
      description: 'Home decor, furniture, and living essentials',
      imageUrl: 'https://via.placeholder.com/400x300?text=Home'
    },
    {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Gadgets, tech accessories, and electronics',
      imageUrl: 'https://via.placeholder.com/400x300?text=Electronics'
    },
    {
      name: 'Health & Wellness',
      slug: 'health-wellness',
      description: 'Fitness, grooming, and wellness products',
      imageUrl: 'https://via.placeholder.com/400x300?text=Health'
    }
  ];

  for (const categoryData of categories) {
    const existing = await prisma.category.findUnique({
      where: { slug: categoryData.slug }
    });

    if (!existing) {
      await prisma.category.create({ data: categoryData });
      console.log(`✅ Created category: ${categoryData.name}`);
    }
  }

  // Get created categories for products
  const fashionCategory = await prisma.category.findUnique({
    where: { slug: 'fashion-accessories' }
  });
  const homeCategory = await prisma.category.findUnique({
    where: { slug: 'home-living' }
  });
  const electronicsCategory = await prisma.category.findUnique({
    where: { slug: 'electronics' }
  });
  const healthCategory = await prisma.category.findUnique({
    where: { slug: 'health-wellness' }
  });

  // Create sample products
  const products = [
    // Fashion & Accessories
    {
      externalId: 'DHGATE-12345',
      platform: 'DHGATE',
      title: 'Rainbow Pride Flag Enamel Pin Set',
      description: 'High-quality enamel pins featuring various pride flags. Perfect for jackets, backpacks, or displaying your identity.',
      imageUrl: 'https://via.placeholder.com/600x600?text=Pride+Pin+Set',
      price: 12.99,
      categoryId: fashionCategory.id,
      status: 'ACTIVE',
      rating: 4.5,
      reviewCount: 127,
      tags: ['pride', 'accessories', 'pins', 'lgbtq']
    },
    {
      externalId: 'ALIEXPRESS-67890',
      platform: 'ALIEXPRESS',
      title: 'Mesh Tank Top - Breathable Summer Wear',
      description: 'Lightweight, breathable mesh tank top perfect for summer festivals, gym, or clubbing. Available in multiple colors.',
      imageUrl: 'https://via.placeholder.com/600x600?text=Mesh+Tank+Top',
      price: 18.50,
      categoryId: fashionCategory.id,
      status: 'ACTIVE',
      rating: 4.2,
      reviewCount: 89,
      tags: ['clothing', 'summer', 'athletic', 'mesh']
    },
    {
      externalId: 'AMAZON-54321',
      platform: 'AMAZON',
      title: 'Designer Leather Harness - Adjustable',
      description: 'Premium vegan leather harness with adjustable straps. Fashion-forward statement piece for parties and events.',
      imageUrl: 'https://via.placeholder.com/600x600?text=Leather+Harness',
      price: 45.00,
      categoryId: fashionCategory.id,
      status: 'ACTIVE',
      rating: 4.7,
      reviewCount: 234,
      tags: ['fashion', 'leather', 'harness', 'party']
    },
    {
      externalId: 'WISH-98765',
      platform: 'WISH',
      title: 'Glitter Beard Oil & Balm Set',
      description: 'Moisturizing beard oil with subtle glitter particles. Includes balm for styling. Great for special occasions.',
      imageUrl: 'https://via.placeholder.com/600x600?text=Glitter+Beard+Oil',
      price: 22.99,
      categoryId: fashionCategory.id,
      status: 'ACTIVE',
      rating: 3.9,
      reviewCount: 56,
      tags: ['grooming', 'beard', 'glitter', 'care']
    },
    {
      externalId: 'DHGATE-24680',
      platform: 'DHGATE',
      title: 'Crop Top Hoodie - Streetwear Style',
      description: 'Trendy cropped hoodie with kangaroo pocket. Soft fleece material, perfect for casual streetwear looks.',
      imageUrl: 'https://via.placeholder.com/600x600?text=Crop+Hoodie',
      price: 29.99,
      categoryId: fashionCategory.id,
      status: 'ACTIVE',
      rating: 4.4,
      reviewCount: 178,
      tags: ['hoodie', 'crop', 'streetwear', 'casual']
    },
    {
      externalId: 'ALIEXPRESS-13579',
      platform: 'ALIEXPRESS',
      title: 'Statement Sunglasses - Oversized Frame',
      description: 'Bold, oversized sunglasses with UV protection. Multiple frame colors available. Perfect for summer vibes.',
      imageUrl: 'https://via.placeholder.com/600x600?text=Sunglasses',
      price: 15.99,
      categoryId: fashionCategory.id,
      status: 'ACTIVE',
      rating: 4.1,
      reviewCount: 92,
      tags: ['sunglasses', 'accessories', 'summer', 'fashion']
    },

    // Home & Living
    {
      externalId: 'AMAZON-11111',
      platform: 'AMAZON',
      title: 'Rainbow Gradient Throw Blanket',
      description: 'Ultra-soft fleece blanket with vibrant rainbow gradient. Perfect for couch cuddles or bedroom decor.',
      imageUrl: 'https://via.placeholder.com/600x600?text=Rainbow+Blanket',
      price: 38.99,
      categoryId: homeCategory.id,
      status: 'ACTIVE',
      rating: 4.8,
      reviewCount: 312,
      tags: ['blanket', 'rainbow', 'home', 'decor']
    },
    {
      externalId: 'DHGATE-22222',
      platform: 'DHGATE',
      title: 'Neon LED Sign - Custom Quote',
      description: 'Customizable LED neon sign for home or studio. Energy-efficient, multiple color options available.',
      imageUrl: 'https://via.placeholder.com/600x600?text=Neon+Sign',
      price: 89.00,
      categoryId: homeCategory.id,
      status: 'ACTIVE',
      rating: 4.6,
      reviewCount: 145,
      tags: ['neon', 'led', 'sign', 'decor']
    },
    {
      externalId: 'WISH-33333',
      platform: 'WISH',
      title: 'Tropical Plant Print Pillow Set',
      description: 'Set of 4 decorative pillows with tropical monstera and palm prints. Vibrant colors, soft fabric.',
      imageUrl: 'https://via.placeholder.com/600x600?text=Tropical+Pillows',
      price: 32.50,
      categoryId: homeCategory.id,
      status: 'ACTIVE',
      rating: 4.0,
      reviewCount: 67,
      tags: ['pillows', 'tropical', 'home', 'plants']
    },
    {
      externalId: 'ALIEXPRESS-44444',
      platform: 'ALIEXPRESS',
      title: 'Minimalist Wall Art Canvas Set',
      description: 'Modern abstract canvas art set (3 pieces). Black and gold geometric designs perfect for contemporary spaces.',
      imageUrl: 'https://via.placeholder.com/600x600?text=Wall+Art',
      price: 54.99,
      categoryId: homeCategory.id,
      status: 'ACTIVE',
      rating: 4.5,
      reviewCount: 203,
      tags: ['art', 'canvas', 'wall', 'modern']
    },
    {
      externalId: 'AMAZON-55555',
      platform: 'AMAZON',
      title: 'Himalayan Salt Lamp - Large',
      description: 'Natural Himalayan pink salt lamp with wooden base. Creates ambient lighting and purifies air.',
      imageUrl: 'https://via.placeholder.com/600x600?text=Salt+Lamp',
      price: 42.00,
      categoryId: homeCategory.id,
      status: 'ACTIVE',
      rating: 4.7,
      reviewCount: 289,
      tags: ['lamp', 'salt', 'ambient', 'wellness']
    },

    // Electronics
    {
      externalId: 'DHGATE-66666',
      platform: 'DHGATE',
      title: 'RGB Gaming Keyboard - Mechanical',
      description: 'Mechanical keyboard with customizable RGB lighting. Blue switches, anti-ghosting technology.',
      imageUrl: 'https://via.placeholder.com/600x600?text=RGB+Keyboard',
      price: 68.99,
      categoryId: electronicsCategory.id,
      status: 'ACTIVE',
      rating: 4.3,
      reviewCount: 156,
      tags: ['keyboard', 'gaming', 'rgb', 'mechanical']
    },
    {
      externalId: 'ALIEXPRESS-77777',
      platform: 'ALIEXPRESS',
      title: 'Wireless Earbuds - Noise Cancelling',
      description: 'True wireless earbuds with active noise cancellation. 24-hour battery life, waterproof IPX7.',
      imageUrl: 'https://via.placeholder.com/600x600?text=Wireless+Earbuds',
      price: 45.50,
      categoryId: electronicsCategory.id,
      status: 'ACTIVE',
      rating: 4.4,
      reviewCount: 421,
      tags: ['earbuds', 'wireless', 'audio', 'noise-cancelling']
    },
    {
      externalId: 'AMAZON-88888',
      platform: 'AMAZON',
      title: 'Smartphone Ring Light - Portable',
      description: 'Clip-on ring light for smartphones. Perfect for selfies, video calls, and content creation. USB rechargeable.',
      imageUrl: 'https://via.placeholder.com/600x600?text=Ring+Light',
      price: 24.99,
      categoryId: electronicsCategory.id,
      status: 'ACTIVE',
      rating: 4.6,
      reviewCount: 178,
      tags: ['light', 'ring', 'selfie', 'portable']
    },
    {
      externalId: 'WISH-99999',
      platform: 'WISH',
      title: 'Bluetooth Speaker - Waterproof',
      description: 'Portable Bluetooth speaker with LED light show. Waterproof, 12-hour battery. Perfect for pool parties.',
      imageUrl: 'https://via.placeholder.com/600x600?text=Bluetooth+Speaker',
      price: 35.00,
      categoryId: electronicsCategory.id,
      status: 'ACTIVE',
      rating: 4.0,
      reviewCount: 98,
      tags: ['speaker', 'bluetooth', 'waterproof', 'party']
    },
    {
      externalId: 'DHGATE-10101',
      platform: 'DHGATE',
      title: 'Smart Watch - Fitness Tracker',
      description: 'Fitness smartwatch with heart rate monitor, step counter, and sleep tracking. Compatible with iOS and Android.',
      imageUrl: 'https://via.placeholder.com/600x600?text=Smart+Watch',
      price: 58.00,
      categoryId: electronicsCategory.id,
      status: 'ACTIVE',
      rating: 4.2,
      reviewCount: 267,
      tags: ['smartwatch', 'fitness', 'tracker', 'health']
    },

    // Health & Wellness
    {
      externalId: 'AMAZON-20202',
      platform: 'AMAZON',
      title: 'Yoga Mat - Extra Thick Non-Slip',
      description: 'Premium 8mm thick yoga mat with alignment markers. Non-slip surface, eco-friendly materials.',
      imageUrl: 'https://via.placeholder.com/600x600?text=Yoga+Mat',
      price: 39.99,
      categoryId: healthCategory.id,
      status: 'ACTIVE',
      rating: 4.7,
      reviewCount: 534,
      tags: ['yoga', 'fitness', 'mat', 'exercise']
    },
    {
      externalId: 'ALIEXPRESS-30303',
      platform: 'ALIEXPRESS',
      title: 'Resistance Bands Set - 5 Levels',
      description: 'Set of 5 resistance bands with different strength levels. Includes door anchor and carrying bag.',
      imageUrl: 'https://via.placeholder.com/600x600?text=Resistance+Bands',
      price: 22.50,
      categoryId: healthCategory.id,
      status: 'ACTIVE',
      rating: 4.5,
      reviewCount: 298,
      tags: ['resistance', 'bands', 'fitness', 'strength']
    },
    {
      externalId: 'DHGATE-40404',
      platform: 'DHGATE',
      title: 'Facial Cleansing Brush - Electric',
      description: 'Waterproof electric facial brush with 3 speed settings. Deep cleansing, gentle on skin.',
      imageUrl: 'https://via.placeholder.com/600x600?text=Facial+Brush',
      price: 28.99,
      categoryId: healthCategory.id,
      status: 'ACTIVE',
      rating: 4.3,
      reviewCount: 167,
      tags: ['facial', 'cleansing', 'brush', 'skincare']
    },
    {
      externalId: 'WISH-50505',
      platform: 'WISH',
      title: 'Essential Oil Diffuser - Ultrasonic',
      description: 'Large capacity aromatherapy diffuser with color-changing LED lights. Whisper-quiet operation.',
      imageUrl: 'https://via.placeholder.com/600x600?text=Oil+Diffuser',
      price: 31.00,
      categoryId: healthCategory.id,
      status: 'ACTIVE',
      rating: 4.4,
      reviewCount: 223,
      tags: ['diffuser', 'aromatherapy', 'essential-oils', 'wellness']
    },
    {
      externalId: 'AMAZON-60606',
      platform: 'AMAZON',
      title: 'Hair Styling Tool Set - Professional',
      description: 'Complete hair styling set with curling iron, straightener, and blow dryer brush. Ceramic technology.',
      imageUrl: 'https://via.placeholder.com/600x600?text=Hair+Tools',
      price: 79.99,
      categoryId: healthCategory.id,
      status: 'ACTIVE',
      rating: 4.6,
      reviewCount: 412,
      tags: ['hair', 'styling', 'tools', 'grooming']
    },
    {
      externalId: 'ALIEXPRESS-70707',
      platform: 'ALIEXPRESS',
      title: 'Massage Gun - Deep Tissue',
      description: 'Percussion massage gun with 6 speed settings and 4 massage heads. Rechargeable, quiet motor.',
      imageUrl: 'https://via.placeholder.com/600x600?text=Massage+Gun',
      price: 89.50,
      categoryId: healthCategory.id,
      status: 'ACTIVE',
      rating: 4.8,
      reviewCount: 678,
      tags: ['massage', 'recovery', 'fitness', 'wellness']
    },
    {
      externalId: 'DHGATE-80808',
      platform: 'DHGATE',
      title: 'Skincare Fridge - Mini Cosmetic Cooler',
      description: 'Compact beauty fridge for skincare products. Keeps serums, masks, and creams cool and fresh.',
      imageUrl: 'https://via.placeholder.com/600x600?text=Beauty+Fridge',
      price: 65.00,
      categoryId: healthCategory.id,
      status: 'ACTIVE',
      rating: 4.2,
      reviewCount: 189,
      tags: ['skincare', 'fridge', 'beauty', 'storage']
    }
  ];

  let productsCreated = 0;
  for (const productData of products) {
    const existing = await prisma.product.findUnique({
      where: {
        platform_externalId: {
          platform: productData.platform,
          externalId: productData.externalId
        }
      }
    });

    if (!existing) {
      await prisma.product.create({ data: productData });
      productsCreated++;
    }
  }

  if (productsCreated > 0) {
    console.log(`✅ Created ${productsCreated} products`);
  }

  // Create sample reviews for a few featured products
  const leatherHarness = await prisma.product.findUnique({
    where: { platform_externalId: { platform: 'AMAZON', externalId: 'AMAZON-54321' } }
  });

  const rainbowBlanket = await prisma.product.findUnique({
    where: { platform_externalId: { platform: 'AMAZON', externalId: 'AMAZON-11111' } }
  });

  const massageGun = await prisma.product.findUnique({
    where: { platform_externalId: { platform: 'ALIEXPRESS', externalId: 'ALIEXPRESS-70707' } }
  });

  const reviews = [];

  if (leatherHarness) {
    reviews.push(
      {
        productId: leatherHarness.id,
        rating: 5,
        title: 'Perfect for Pride!',
        content: 'The quality is amazing and it fits perfectly. Wore it to Pride and got so many compliments. The vegan leather looks and feels premium.',
        pros: ['Great quality', 'Comfortable fit', 'Adjustable straps', 'Stylish'],
        cons: ['Took a while to ship'],
        isFeatured: true
      },
      {
        productId: leatherHarness.id,
        rating: 4,
        title: 'Love it but sizing runs small',
        content: 'Beautiful piece but definitely order a size up. The material is soft and the hardware is solid.',
        pros: ['Beautiful design', 'Quality hardware'],
        cons: ['Runs small', 'Sizing chart unclear'],
        isFeatured: false
      }
    );
  }

  if (rainbowBlanket) {
    reviews.push(
      {
        productId: rainbowBlanket.id,
        rating: 5,
        title: 'So soft and cozy!',
        content: 'This blanket is incredibly soft and the rainbow gradient is beautiful. Perfect for movie nights on the couch.',
        pros: ['Super soft', 'Beautiful colors', 'Large size', 'Machine washable'],
        cons: [],
        isFeatured: true
      }
    );
  }

  if (massageGun) {
    reviews.push(
      {
        productId: massageGun.id,
        rating: 5,
        title: 'Game changer for post-workout',
        content: 'After hitting the gym, this massage gun is a lifesaver. The different heads target different muscle groups perfectly.',
        pros: ['Powerful', 'Multiple speeds', 'Long battery life', 'Quiet operation'],
        cons: ['Case could be better'],
        isFeatured: true
      },
      {
        productId: massageGun.id,
        rating: 4,
        title: 'Great value for money',
        content: 'Works as well as the expensive brands. Battery lasts forever and it is quieter than I expected.',
        pros: ['Affordable', 'Effective', 'Quiet'],
        cons: ['Instructions unclear'],
        isFeatured: false
      }
    );
  }

  let reviewsCreated = 0;
  for (const reviewData of reviews) {
    const existing = await prisma.review.findFirst({
      where: {
        productId: reviewData.productId,
        title: reviewData.title
      }
    });

    if (!existing) {
      await prisma.review.create({ data: reviewData });
      reviewsCreated++;
    }
  }

  if (reviewsCreated > 0) {
    console.log(`✅ Created ${reviewsCreated} reviews`);
  }

  console.log('✨ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

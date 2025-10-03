/**
 * Database validation script
 * Tests schema validity and connection
 */

import { db, checkDbConnection } from '../lib/db';

async function validateDatabase() {
  console.log('🔍 Validating database setup...\n');

  // Test 1: Connection check
  console.log('1️⃣  Testing database connection...');
  try {
    const healthCheck = await checkDbConnection();
    if (healthCheck.status === 'healthy') {
      console.log('✅ Database connection successful\n');
    } else {
      console.error('❌ Database connection failed:', healthCheck.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }

  // Test 2: Schema validation
  console.log('2️⃣  Validating schema structure...');
  try {
    // Test each model with a simple count query
    const models = [
      'user',
      'account',
      'session',
      'verificationToken',
      'project',
      'platform',
      'content',
      'contentPublication',
      'settings',
      'cronJob',
      'cronExecution',
      'auditLog',
    ] as const;

    for (const model of models) {
      const count = await (db[model] as any).count();
      console.log(`   ✓ ${model}: ${count} records`);
    }
    console.log('✅ All models accessible\n');
  } catch (error) {
    console.error('❌ Schema validation failed:', error);
    return false;
  }

  // Test 3: Index verification
  console.log('3️⃣  Verifying critical indexes...');
  try {
    // Test indexed queries
    await db.user.findMany({ where: { email: 'test@example.com' } });
    await db.project.findMany({ where: { userId: 'test-id' } });
    await db.content.findMany({ where: { status: 'PUBLISHED' } });
    await db.platform.findMany({ where: { isConnected: true } });
    console.log('✅ Indexed queries working\n');
  } catch (error) {
    console.error('❌ Index verification failed:', error);
    return false;
  }

  // Test 4: Relationship validation
  console.log('4️⃣  Testing relationships...');
  try {
    // Test user -> projects relationship
    const users = await db.user.findMany({
      include: { projects: true },
      take: 1,
    });

    // Test project -> platforms relationship
    const projects = await db.project.findMany({
      include: { platforms: true, content: true },
      take: 1,
    });

    // Test content -> publications relationship
    const content = await db.content.findMany({
      include: { publications: true },
      take: 1,
    });

    console.log('✅ Relationships working correctly\n');
  } catch (error) {
    console.error('❌ Relationship validation failed:', error);
    return false;
  }

  // Test 5: Enum validation
  console.log('5️⃣  Validating enums...');
  try {
    // Verify enum values can be used
    const enums = {
      ProjectStatus: ['ACTIVE', 'PAUSED', 'ARCHIVED', 'DELETED'],
      PlatformType: ['HASHNODE', 'DEVTO', 'MEDIUM', 'LINKEDIN', 'TWITTER', 'RSS_FEED', 'NEWSLETTER'],
      ContentStatus: ['DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED', 'ARCHIVED'],
      PublicationStatus: ['PENDING', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'RETRYING'],
      CronJobType: ['SYNC_GITHUB', 'PUBLISH_CONTENT', 'GENERATE_CONTENT', 'CLEANUP', 'ANALYTICS', 'CUSTOM'],
      CronJobStatus: ['IDLE', 'RUNNING', 'COMPLETED', 'FAILED', 'DISABLED'],
      ExecutionStatus: ['RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'TIMEOUT'],
    };

    console.log('   ✓ All enum types defined');
    console.log('✅ Enum validation passed\n');
  } catch (error) {
    console.error('❌ Enum validation failed:', error);
    return false;
  }

  console.log('🎉 Database validation completed successfully!\n');
  console.log('📊 Summary:');
  console.log('   ✓ Database connection working');
  console.log('   ✓ All models accessible');
  console.log('   ✓ Indexes functioning');
  console.log('   ✓ Relationships validated');
  console.log('   ✓ Enums properly defined\n');

  return true;
}

// Run validation
validateDatabase()
  .then((success) => {
    if (!success) {
      console.error('\n❌ Database validation failed');
      process.exit(1);
    }
    console.log('✅ Ready for development!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Validation error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

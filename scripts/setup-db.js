// Database setup script for Vercel Postgres
// Run with: node scripts/setup-db.js

const { sql } = require('@vercel/postgres');

async function setupDatabase() {
  console.log('Setting up database tables...');

  try {
    // Create blog_posts table
    await sql`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        slug VARCHAR(500) UNIQUE NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        published_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL,
        tags TEXT[],
        github_activity_ids TEXT[],
        status VARCHAR(50) NOT NULL DEFAULT 'draft',
        metadata JSONB
      )
    `;
    console.log('✅ Created blog_posts table');

    // Create subscribers table
    await sql`
      CREATE TABLE IF NOT EXISTS subscribers (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        subscribed_at TIMESTAMP NOT NULL,
        unsubscribed_at TIMESTAMP,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        preferences JSONB
      )
    `;
    console.log('✅ Created subscribers table');

    // Create newsletters table
    await sql`
      CREATE TABLE IF NOT EXISTS newsletters (
        id VARCHAR(255) PRIMARY KEY,
        subject VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        html_content TEXT,
        sent_at TIMESTAMP,
        scheduled_for TIMESTAMP,
        status VARCHAR(50) NOT NULL DEFAULT 'draft',
        recipient_count INTEGER DEFAULT 0,
        open_rate DECIMAL(5,2),
        click_rate DECIMAL(5,2),
        activities JSONB
      )
    `;
    console.log('✅ Created newsletters table');

    // Create indexes for better performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
      CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
      CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published_at DESC);
      CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
      CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);
      CREATE INDEX IF NOT EXISTS idx_newsletters_status ON newsletters(status);
    `;
    console.log('✅ Created indexes');

    console.log('\n✨ Database setup complete!');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
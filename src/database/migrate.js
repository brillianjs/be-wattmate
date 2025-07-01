const { createTables, createDefaultUser } = require('./database');

async function migrate() {
  try {
    console.log('🚀 Starting database migration...');
    
    await createTables();
    await createDefaultUser();
    
    console.log('✅ Migration completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrate();
}

module.exports = { migrate };

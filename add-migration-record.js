const sequelize = require('./db');

async function addMigrationRecord() {
  try {
    console.log('🔍 Adding package migration to SequelizeMeta...\n');
    
    await sequelize.query(`
      INSERT INTO "SequelizeMeta" (name) 
      VALUES ('20250730203000-create-package-store-table.js') 
      ON CONFLICT (name) DO NOTHING;
    `);
    
    console.log('✅ Migration recorded in SequelizeMeta');
    
    // Verify it was added
    const [results] = await sequelize.query(`
      SELECT name FROM "SequelizeMeta" 
      WHERE name = '20250730203000-create-package-store-table.js';
    `);
    
    if (results.length > 0) {
      console.log('✅ Migration found in SequelizeMeta');
    } else {
      console.log('❌ Migration not found in SequelizeMeta');
    }
    
  } catch (error) {
    console.error('❌ Error adding migration record:', error.message);
  } finally {
    await sequelize.close();
  }
}

addMigrationRecord(); 
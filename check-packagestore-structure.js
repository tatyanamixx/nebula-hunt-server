const sequelize = require('./db');

async function checkPackageStoreStructure() {
  try {
    console.log('🔍 Checking PackageStore table structure...\n');
    
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'packagestores' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 PackageStore table columns:');
    results.forEach((row, index) => {
      console.log(`${index + 1}. ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkPackageStoreStructure(); 
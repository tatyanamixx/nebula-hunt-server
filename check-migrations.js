const sequelize = require('./db');

async function checkMigrations() {
  try {
    console.log('🔍 Checking applied migrations...\n');
    
    const [results] = await sequelize.query(`
      SELECT name FROM "SequelizeMeta" 
      ORDER BY name;
    `);
    
    console.log('📋 Applied migrations:');
    results.forEach((row, index) => {
      console.log(`${index + 1}. ${row.name}`);
    });
    
    console.log('\n🔍 Looking for package-related migrations:');
    const packageMigrations = results.filter(row => 
      row.name.toLowerCase().includes('package')
    );
    
    if (packageMigrations.length > 0) {
      packageMigrations.forEach(row => {
        console.log(`✅ Found: ${row.name}`);
      });
    } else {
      console.log('❌ No package-related migrations found');
    }
    
  } catch (error) {
    console.error('❌ Error checking migrations:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkMigrations(); 
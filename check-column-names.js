const sequelize = require('./db');

async function checkColumnNames() {
  try {
    console.log('🔍 Checking column names in userupgrades table...\n');
    
    const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'userupgrades' 
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 All columns in userupgrades table:');
    results.forEach((row, index) => {
      console.log(`${index + 1}. ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
    });
    
    console.log('\n🔍 Looking for upgrade-related columns:');
    const upgradeColumns = results.filter(row => 
      row.column_name.toLowerCase().includes('upgrade')
    );
    
    if (upgradeColumns.length > 0) {
      upgradeColumns.forEach(row => {
        console.log(`✅ Found: ${row.column_name}`);
      });
    } else {
      console.log('❌ No upgrade-related columns found');
    }
    
    console.log('\n🔍 Looking for node-related columns:');
    const nodeColumns = results.filter(row => 
      row.column_name.toLowerCase().includes('node')
    );
    
    if (nodeColumns.length > 0) {
      nodeColumns.forEach(row => {
        console.log(`✅ Found: ${row.column_name}`);
      });
    } else {
      console.log('❌ No node-related columns found');
    }
    
    console.log('\n🔍 Looking for template-related columns:');
    const templateColumns = results.filter(row => 
      row.column_name.toLowerCase().includes('template')
    );
    
    if (templateColumns.length > 0) {
      templateColumns.forEach(row => {
        console.log(`✅ Found: ${row.column_name}`);
      });
    } else {
      console.log('❌ No template-related columns found');
    }
    
  } catch (error) {
    console.error('❌ Error checking column names:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkColumnNames(); 
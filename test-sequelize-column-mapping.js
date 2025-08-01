const sequelize = require('./db');
const { UserUpgrade } = require('./models/models');

async function testColumnMapping() {
  try {
    console.log('🔍 Testing Sequelize column mapping...\n');
    
    // Check the model's attribute names
    console.log('📋 UserUpgrade model attributes:');
    Object.keys(UserUpgrade.rawAttributes).forEach(attr => {
      console.log(`- ${attr}`);
    });
    
    console.log('\n🔍 Checking specific attribute:');
    const upgradeNodeTemplateIdAttr = UserUpgrade.rawAttributes.upgradeNodeTemplateId;
    console.log('upgradeNodeTemplateId attribute:', upgradeNodeTemplateIdAttr);
    
    // Check what column name Sequelize would use
    console.log('\n🔍 Sequelize configuration:');
    console.log('underscored:', sequelize.options.define?.underscored);
    
    // Try to describe the table
    console.log('\n🔍 Describing table structure:');
    const [describeResults] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'userupgrades' 
      AND column_name LIKE '%upgrade%'
      ORDER BY column_name;
    `);
    
    console.log('Database columns with "upgrade" in name:');
    describeResults.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });
    
    // Test a simple query to see what error we get
    console.log('\n🔍 Testing UserUpgrade.findAll()...');
    try {
      const results = await UserUpgrade.findAll({
        limit: 1,
        raw: true
      });
      console.log('✅ Query successful, found', results.length, 'records');
    } catch (error) {
      console.log('❌ Query failed with error:', error.message);
      console.log('Full error:', error);
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error.message);
  } finally {
    await sequelize.close();
  }
}

testColumnMapping(); 
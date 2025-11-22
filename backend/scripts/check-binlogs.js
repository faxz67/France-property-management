/**
 * Script to check MariaDB binlogs for deleted records
 * This script attempts to recover deleted data from MariaDB binary logs
 * 
 * Requirements:
 * - MariaDB binary logging must be enabled
 * - Access to MariaDB server with appropriate permissions
 * - mysqlbinlog utility installed
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const fs = require('fs').promises;
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'property_management'
};

/**
 * Get list of binlog files
 */
async function getBinlogFiles() {
  try {
    const { stdout } = await execAsync(
      `mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p${dbConfig.password} -e "SHOW BINARY LOGS;" | tail -n +2 | awk '{print $1}'`
    );
    
    const files = stdout.trim().split('\n').filter(f => f.length > 0);
    console.log(`📋 Found ${files.length} binlog files`);
    return files;
  } catch (error) {
    console.error('❌ Error getting binlog files:', error.message);
    console.log('ℹ️  Make sure binary logging is enabled in MariaDB');
    return [];
  }
}

/**
 * Search binlogs for DELETE statements
 */
async function searchBinlogsForDeletes(tableName, startTime = null) {
  try {
    const binlogFiles = await getBinlogFiles();
    if (binlogFiles.length === 0) {
      console.log('⚠️  No binlog files found. Binary logging may not be enabled.');
      return [];
    }
    
    const deletedRecords = [];
    
    for (const binlogFile of binlogFiles) {
      try {
        // Use mysqlbinlog to extract DELETE statements
        const command = `mysqlbinlog --database=${dbConfig.database} --start-datetime="${startTime || '1970-01-01 00:00:00'}" /var/lib/mysql/${binlogFile} | grep -i "DELETE FROM.*${tableName}"`;
        
        const { stdout } = await execAsync(command, { maxBuffer: 10 * 1024 * 1024 });
        
        if (stdout) {
          const lines = stdout.split('\n').filter(l => l.includes('DELETE FROM'));
          console.log(`📝 Found ${lines.length} DELETE statements in ${binlogFile}`);
          
          // Parse DELETE statements (this is a simplified parser)
          lines.forEach(line => {
            // Extract table name and approximate timestamp from binlog
            const match = line.match(/DELETE FROM `?(\w+)`?/i);
            if (match && match[1].toLowerCase() === tableName.toLowerCase()) {
              deletedRecords.push({
                table: match[1],
                binlogFile,
                rawStatement: line
              });
            }
          });
        }
      } catch (error) {
        // Some binlog files may not be accessible, continue
        console.log(`⚠️  Could not read ${binlogFile}: ${error.message}`);
      }
    }
    
    return deletedRecords;
  } catch (error) {
    console.error('❌ Error searching binlogs:', error.message);
    return [];
  }
}

/**
 * Generate SQL restore script from binlog data
 * Note: This is a simplified version. Full recovery requires more complex parsing.
 */
async function generateRestoreScript(tableName, outputFile = null) {
  try {
    console.log(`🔍 Searching binlogs for deleted records in ${tableName}...`);
    
    const deletedRecords = await searchBinlogsForDeletes(tableName);
    
    if (deletedRecords.length === 0) {
      console.log('✅ No deleted records found in binlogs');
      return null;
    }
    
    console.log(`📊 Found ${deletedRecords.length} potential DELETE operations`);
    
    // Generate a basic restore script template
    const restoreScript = `-- Restore script for ${tableName}
-- Generated from MariaDB binlogs
-- WARNING: This script may need manual review before execution
-- Date: ${new Date().toISOString()}

-- Instructions:
-- 1. Review the binlog files manually using: mysqlbinlog /var/lib/mysql/[binlog-file]
-- 2. Extract the full INSERT statements from before the DELETE
-- 3. Execute the INSERT statements to restore the data

-- Found DELETE operations in the following binlog files:
${deletedRecords.map((r, i) => `-- ${i + 1}. ${r.binlogFile}`).join('\n')}

-- To manually recover:
-- 1. Use: mysqlbinlog --start-datetime="[timestamp]" --stop-datetime="[timestamp]" /var/lib/mysql/[binlog-file] > recovery.sql
-- 2. Search for INSERT statements before DELETE statements
-- 3. Extract and execute those INSERT statements

-- Example recovery command:
-- mysqlbinlog --start-datetime="2024-01-01 00:00:00" /var/lib/mysql/mariadb-bin.000001 | grep -A 50 "INSERT INTO \`${tableName}\`" > recovery_inserts.sql
`;

    if (outputFile) {
      await fs.writeFile(outputFile, restoreScript, 'utf8');
      console.log(`✅ Restore script written to ${outputFile}`);
    } else {
      console.log('\n' + restoreScript);
    }
    
    return restoreScript;
  } catch (error) {
    console.error('❌ Error generating restore script:', error.message);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const tableName = args[0] || 'tenants';
  const outputFile = args[1] || null;
  
  console.log('🔍 MariaDB Binlog Recovery Tool');
  console.log('================================');
  console.log(`Table: ${tableName}`);
  console.log(`Database: ${dbConfig.database}`);
  console.log('');
  
  const script = await generateRestoreScript(tableName, outputFile);
  
  if (script) {
    console.log('\n✅ Recovery script generated');
    console.log('⚠️  IMPORTANT: Review the script before executing!');
  } else {
    console.log('\n⚠️  Could not generate recovery script');
    console.log('ℹ️  This may mean:');
    console.log('   1. Binary logging is not enabled');
    console.log('   2. No DELETE operations found in binlogs');
    console.log('   3. Binlog files are not accessible');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  getBinlogFiles,
  searchBinlogsForDeletes,
  generateRestoreScript
};


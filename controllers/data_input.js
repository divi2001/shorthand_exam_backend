const fs = require('fs');
const fastCsv = require('fast-csv');
const pool = require("../config/db1");
const schema = require('../schema/schema');
const moment = require('moment');


exports.importCSV = async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const { tableName } = req.params;
  const csvFilePath = req.file.path;

  if (!tableName) {
    fs.unlinkSync(csvFilePath);
    return res.status(400).json({ error: 'Table name is required' });
  }

  try {
    const columns = await new Promise((resolve, reject) => {
      const stream = fs.createReadStream(csvFilePath)
        .pipe(fastCsv.parse({ headers: true }))
        .on('error', reject)
        .on('data', (row) => {
          stream.pause();
          resolve(Object.keys(row));
          stream.destroy();
        })
        .on('end', () => {
          reject(new Error('No data found in the CSV file'));
        });
    });

    const createTableQuery = `CREATE TABLE IF NOT EXISTS ?? (
      ${columns.map(column => {
        const fieldType = schema[tableName] && schema[tableName][column] ? schema[tableName][column] : 'LONGTEXT';
        return `\`${column}\` ${fieldType}`;
      }).join(', ')}
    )`

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      await connection.query(createTableQuery, [tableName]);
      await connection.query(`TRUNCATE TABLE ??`, [tableName]);

      const stream = fs.createReadStream(csvFilePath)
        .pipe(fastCsv.parse({ headers: true }))
        .on('error', (error) => {
          throw error;
        });

      const insertPromises = [];
      const chunkSize = 1000;
      let chunk = [];

      for await (const row of stream) {
        chunk.push(row);
        if (chunk.length >= chunkSize) {
          insertPromises.push(insertChunk(connection, tableName, columns, chunk));
          chunk = [];
        }
      }

      if (chunk.length > 0) {
        insertPromises.push(insertChunk(connection, tableName, columns, chunk));
      }

      await Promise.all(insertPromises);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    fs.unlinkSync(csvFilePath);
    res.json({ message: `CSV data imported into table '${tableName}' successfully` });
  } catch (error) {
    console.error('Error processing CSV:', error.message);
    fs.unlinkSync(csvFilePath);
    res.status(500).json({ error: error.message });
  }
};

async function insertChunk(connection, tableName, columns, chunk) {
  const insertQuery = `INSERT INTO ?? (${columns.map(column => `\`${column}\``).join(', ')}) VALUES ?`;
  const values = chunk.map(row => {
    const rowValues = columns.map(column => {
      let value = row[column];
      const fieldType = schema[tableName] && schema[tableName][column];

      // Process courseId and subjectId columns
      if (column === 'courseId' || column === 'subjectId') {
        if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
          value = parseInt(value.replace(/[\[\]\s]/g, ''), 10);
        }
      }

      // Process loggedin and done columns
      if (column === 'loggedin' || column === 'done') {
        return value && (value.toLowerCase() === 'yes' || value.toLowerCase() === 'true' || value === '1');
      }

      // Process time columns
      if (fieldType === 'TIME') {
        if (value) {
          const time = moment(value, ['h:mm A', 'HH:mm']);
          return time.isValid() ? time.format('HH:mm:ss') : null;
        }
        return null;
      }

      if (fieldType === 'BOOLEAN') {
        return value && (value.toLowerCase() === 'yes' || value.toLowerCase() === 'true' || value === '1');
      } else if (fieldType === 'INT' || fieldType === 'BIGINT') {
        return isNaN(parseInt(value, 10)) ? null : parseInt(value, 10);
      } else if (fieldType === 'DECIMAL') {
        return isNaN(parseFloat(value)) ? null : parseFloat(value);
      } else if (fieldType === 'DATE') {
        return value ? new Date(value) : null;
      } else if (fieldType === 'TIMESTAMP') {
        return value ? new Date(value) : null;
      } else {
        return value;
      }
    });
    return rowValues;
  });
  await connection.query(insertQuery, [tableName, values]);
}

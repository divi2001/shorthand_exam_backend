const connection = require('../config/db1');
const schema = require('../schema/schema');
const { encrypt, decrypt } = require('../config/encrypt'); // Importing the encrypt and decrypt functions

function generateCreateTableQuery(tableName) {
    if (!schema[tableName]) {
        throw new Error(`Table "${tableName}" not found in schema`);
    }
    const fields = Object.entries(schema[tableName])
        .map(([fieldName, fieldType]) => `${fieldName} ${fieldType}`)
        .join(', ');
    return `
        CREATE TABLE IF NOT EXISTS ${tableName} (
            ${fields}
        )
    `;
}

function generateSelectQuery(tableName, conditions = {}) {
    const whereClause = Object.keys(conditions).length > 0
        ? `WHERE ${Object.keys(conditions).map(key => `${key} = ?`).join(' AND ')}`
        : '';
    return `SELECT * FROM ${tableName} ${whereClause}`;
}

function generateInsertQuery(tableName, data) {
    const fields = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    return `INSERT INTO ${tableName} (${fields}) VALUES (${placeholders})`;
}

function generateCountQuery(tableName, conditions = {}) {
    const whereClause = Object.keys(conditions).length > 0
        ? `WHERE ${Object.keys(conditions).map(key => `${key} = ?`).join(' AND ')}`
        : '';
    return `SELECT COUNT(*) AS count FROM ${tableName} ${whereClause}`;
}

exports.loginCenter = async (req, res) => {
    console.log("Trying center login");
    const { centerId, centerPass, ipAddress, diskIdentifier, macAddress } = req.body;
    console.log(`Received data - centerId: ${centerId}, centerPass: ${centerPass}, ipAddress: ${ipAddress}, diskIdentifier: ${diskIdentifier}, macAddress: ${macAddress}`);

    const query1 = 'SELECT * FROM examcenterdb WHERE center = ?';

    try {
        console.log("Ensuring pcregistration table exists");
        // Ensure pcregistration table exists
        const createTableQuery = generateCreateTableQuery('pcregistration');
        await connection.query(createTableQuery);
        console.log("pcregistration table ensured");

        console.log("Querying examcenterdb for centerId");
        const selectCenterQuery = generateSelectQuery('examcenterdb', { center: centerId });
        const [results] = await connection.query(query1, [centerId]);

        if (results.length > 0) {
            const center = results[0];
            console.log(`Center found: ${JSON.stringify(center)}`);

            // Decrypt the stored centerPass
            let decryptedStoredCenterPass;
            try {
                console.log("Decrypting stored center pass");
                decryptedStoredCenterPass = decrypt(center.centerpass);
                console.log(`Decrypted stored center pass: '${decryptedStoredCenterPass}'`);
            } catch (error) {
                console.error('Error decrypting stored center pass:', error);
                res.status(500).send('Error decrypting stored center pass');
                return;
            }

            // Ensure both passwords are treated as strings
            const decryptedStoredCenterPassStr = String(decryptedStoredCenterPass).trim();
            const providedCenterPassStr = String(centerPass).trim();

            console.log(`Comparing passwords - stored: '${decryptedStoredCenterPassStr}', provided: '${providedCenterPassStr}'`);
            if (decryptedStoredCenterPassStr === providedCenterPassStr) {
                console.log("Passwords match");

                // Check if the PC is already registered
                const checkPcQuery = generateCountQuery('pcregistration', { 
                    center: centerId, 
                    ip_address: ipAddress, 
                    disk_id: diskIdentifier, 
                    mac_address: macAddress 
                });

                console.log("Checking if the PC is already registered");
                const [checkPcResults] = await connection.query(checkPcQuery, [centerId, ipAddress, diskIdentifier, macAddress]);
                const pcExists = checkPcResults[0].count;

                if (pcExists > 0) {
                    console.log("PC is already registered for the center");
                    res.status(403).send('This PC is already registered for the center');
                    return;
                }

                console.log("PC is not already registered");

                // Check the number of registered PCs for the center
                const countQuery = generateCountQuery('pcregistration', { center: centerId });
                console.log("Checking the number of registered PCs for the center");
                const [countResults] = await connection.query(countQuery, [centerId]);
                const pcCount = countResults[0].count;

                // Get the maximum allowed PCs for the center
                const maxPcQuery = generateSelectQuery('examcenterdb', { center: centerId });
                console.log("Getting the maximum allowed PCs for the center");
                const [maxPcResults] = await connection.query(maxPcQuery, [centerId]);
                const maxPcCount = maxPcResults[0].max_pc;

                console.log(`PC count: ${pcCount}, Max PC count: ${maxPcCount}`);
                if (pcCount < maxPcCount) {
                    console.log("Registering new PC");
                    // Insert PC registration log
                    const insertLogQuery = generateInsertQuery('pcregistration', {
                        center: centerId,
                        ip_address: ipAddress,
                        disk_id: diskIdentifier,
                        mac_address: macAddress
                    });
                    await connection.query(insertLogQuery, [centerId, ipAddress, diskIdentifier, macAddress]);
                    console.log("PC registered successfully");
                    res.status(200).send('PC registered successfully for the center!');
                } else {
                    console.log("The maximum number of PCs for this center has been reached");
                    res.status(403).send('The maximum number of PCs for this center has been reached');
                }
            } else {
                console.log("Invalid credentials for center");
                res.status(401).send('Invalid credentials for center');
            }
        } else {
            console.log("Center not found");
            res.status(404).send('Center not found');
        }
    } catch (err) {
        console.error('Database query error:', err);
        res.status(500).send('Internal server error');
    }
};

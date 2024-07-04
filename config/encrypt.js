const crypto = require('crypto');
require('dotenv').config();

// Replace with your own secure key (32 characters for AES-256)
const key = crypto.createHash('sha256').update(Buffer.from(process.env.SECRET_KEY, 'base64')).digest().slice(0, 32)

// Function to encrypt a JSON object using AES-256-CBC
function encrypt(obj) {
    // Convert the object to a JSON string
    const plainText = JSON.stringify(obj);
    
    // Generate a random IV
    const iv = crypto.randomBytes(16);

    // Create a cipher using the key and IV
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

    // Encrypt the plaintext
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return IV and encrypted data separated by a colon
    return `${iv.toString('base64')}:${Buffer.from(encrypted, 'hex').toString('base64')}`;
}

// Function to decrypt encrypted text to a JSON object using AES-256-CBC
function decrypt(encryptedText) {
    if (typeof encryptedText !== 'string') {
        throw new TypeError('encryptedText must be a string');
    }

    // Split the input string into IV and encrypted data
    const [ivBase64, encryptedBase64] = encryptedText.split(':');
    
    if (!ivBase64 || !encryptedBase64) {
        throw new Error('Invalid input format for decryption');
    }

    // Convert Base64 strings to buffers
    const iv = Buffer.from(ivBase64, 'base64');
    const encrypted = Buffer.from(encryptedBase64, 'base64');

    // Create a decipher using the key and IV
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    try {
        // Try to parse the decrypted text as JSON
        return JSON.parse(decrypted);
    } catch {
        // If parsing fails, return the decrypted text as is
        return decrypted;
    }
}


module.exports = { encrypt, decrypt };
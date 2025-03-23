const crypto = require('crypto');
require('dotenv').config();


// Función para cifrar un ID
const encryptID = (id) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(process.env.ALGORITHM, getKey(), iv);
    let encrypted = cipher.update(id.toString(), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`; // Retorna IV y datos cifrados juntos
};

// Función para descifrar un ID
const decryptID = (encryptedID) => {
    const [ivHex, encryptedData] = encryptedID.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(process.env.ALGORITHM, getKey(), iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

// Convertir la clave de seguridad en un buffer de 32 bytes
const getKey = () => crypto.createHash('sha256').update(process.env.SECURITY_KEY).digest();
module.exports = {encryptID,decryptID,getKey,};
const { google } = require('googleapis');
const multer = require('multer');
const stream = require('stream');
const path = require('path');
const jwt = require('jsonwebtoken');
const dbConect = require('./db');
const { decryptID } = require('./encryption');
require('dotenv').config(); // Cargar las variables de entorno

// Configurar multer para manejar la subida de archivos desde el frontend
const upload = multer().single('file');

// Función para crear una carpeta en Google Drive
async function createFolderInDrive(driveService, folderName, parentFolderId) {
    try {
        const response = await driveService.files.create({
            resource: {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [parentFolderId],
            },
            fields: 'id',
        });
        return response.data.id;
    } catch (err) {
        console.error('Error al crear la carpeta en Google Drive', err);
        throw err;
    }
}

// Función para subir el archivo a Google Drive
async function uploadFileToDrive(file, fileName, folderId) {
    try {
        // Autenticación con Google
        const auth = new google.auth.GoogleAuth({
            keyFile: path.join(__dirname, '../../src//googlekey.json'),
            scopes: ['https://www.googleapis.com/auth/drive'],
        });

        const driveService = google.drive({
            version: 'v3',
            auth,
        });

        // Crear un stream de lectura a partir del buffer del archivo
        const bufferStream = new stream.PassThrough();
        bufferStream.end(file.buffer);

        // Configurar los datos del archivo para Google Drive
        const fileMetaData = {
            name: fileName,
            parents: [folderId],
        };

        const media = {
            mimeType: file.mimetype,
            body: bufferStream,
        };

        // Subir el archivo a Google Drive
        const response = await driveService.files.create({
            resource: fileMetaData,
            media: media,
            fields: 'id',
        });

        return response.data.id;
    } catch (err) {
        console.error('Upload file error', err);
        throw err;
    }
}

// Controlador para procesar la subida desde el frontend
module.exports = {
    loadImg: (req, res) => {
        // Usamos multer para procesar el archivo recibido
        upload(req, res, async (err) => {
            if (err) return res.status(500).json({ message: 'Error al subir el archivo' });

            const file = req.file;

            // Extraer cookie y decodificar JWT
            const token = req.cookies.jwt;
            if (!token) return res.status(401).json({ message: 'Usuario no autenticado' });

            let userId;
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.id; // ID del usuario desde la cookie
            } catch (err) {
                return res.status(401).json({ message: 'Token inválido o expirado' });
            }

            // Desencriptar el ID que será el nombre del archivo
            const encryptedID = req.body.id;
            let decryptedID;
            try {
                decryptedID = decryptID(encryptedID);
            } catch (decryptError) {
                return res.status(500).json({ message: 'Error al procesar el ID encriptado' });
            }

            if (!file || !decryptedID) {
                return res.status(400).json({ message: 'Archivo o ID no proporcionado' });
            }

            try {
                // Autenticación con Google
                const auth = new google.auth.GoogleAuth({
                    keyFile: path.join(__dirname, '../../src//googlekey.json'),
                    scopes: ['https://www.googleapis.com/auth/drive'],
                });

                const driveService = google.drive({
                    version: 'v3',
                    auth,
                });

                // Verificar si la carpeta del usuario ya existe
                const userFolderName = userId; // Carpeta con el ID del usuario
                let userFolderId;

                const folderResponse = await driveService.files.list({
                    q: `'${process.env.GOOGLE_API_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and name='${userFolderName}'`,
                    fields: 'files(id, name)',
                });

                if (folderResponse.data.files.length > 0) {
                    userFolderId = folderResponse.data.files[0].id; // Carpeta ya existente
                } else {
                    // Crear carpeta si no existe
                    userFolderId = await createFolderInDrive(driveService, userFolderName, process.env.GOOGLE_API_FOLDER_ID);
                }

                // Renombrar el archivo con el ID desencriptado
                const fileName = `${decryptedID}${file.originalname.substring(file.originalname.lastIndexOf('.'))}`;

                // Subir el archivo a Google Drive dentro de la carpeta del usuario
                const driveFileId = await uploadFileToDrive(file, fileName, userFolderId);

                // Generar enlace público
                const publicUrl = `https://drive.google.com/uc?export=view&id=${driveFileId}`;

                // Actualizar base de datos con el enlace público
                dbConect.query('UPDATE pedidos SET Cliente = ? WHERE id = ?', [`<a href="${publicUrl}" target="_blank">Foto subida</a>`, decryptedID], (err) => {
                    if (err) return res.status(500).json({ error: 'Error al actualizar Cliente' });

                    // Notificar éxito al cliente
                    res.json({ message: 'Archivo subido y cliente actualizado exitosamente', link: publicUrl });
                });
            } catch (error) {
                res.status(500).json({ message: 'Error al procesar la solicitud', error });
            }
        });
    },
};

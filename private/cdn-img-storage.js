const { google } = require('googleapis');
const multer = require('multer');
const stream = require('stream');
const path = require('path');
require('dotenv').config(); // Cargar las variables de entorno

// Google Drive folder ID
const GOOGLE_API_FOLDER_ID = process.env.GOOGLE_API_FOLDER_ID;

// Configurar multer para manejar la subida de archivos desde el frontend
const upload = multer().single('file');

// Función para subir el archivo a Google Drive
async function uploadFileToDrive(file, fileName) {
    try {
        // Autenticación con Google
        const auth = new google.auth.GoogleAuth({
            keyFile: path.join(__dirname, '../../src//googlekey.json'),
            scopes: ['https://www.googleapis.com/auth/drive']
        });

        const driveService = google.drive({
            version: 'v3',
            auth
        });

        // Configurar metadatos del archivo
        const fileMetaData = {
            'name': fileName,
            'parents': [GOOGLE_API_FOLDER_ID]
        };

        // Crear un stream de lectura a partir del buffer del archivo
        const bufferStream = new stream.PassThrough();
        bufferStream.end(file.buffer);

        // Configurar los datos del archivo para Google Drive
        const media = {
            mimeType: file.mimetype,
            body: bufferStream
        };

        // Subir el archivo a Google Drive
        const response = await driveService.files.create({
            resource: fileMetaData,
            media: media,
            fields: 'id'
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
            //Desencriptar el id q va a ser el nuevo nombre del archivo
            const id = decryptID(req.body.id);

            if (!file || !id) {
                return res.status(400).json({ message: 'Archivo o ID no proporcionado' });
            }

            try {
                // Renombrar el archivo con el ID
                const fileName = `${id}${file.originalname.substring(file.originalname.lastIndexOf('.'))}`;

                // Subir el archivo a Google Drive
                const driveFileId = await uploadFileToDrive(file, fileName);

                // Generar enlace público
                const publicUrl = `https://drive.google.com/uc?export=view&id=${driveFileId}`;

                // Actualizar base de datos con el enlace público
                dbConect.query('UPDATE pedidos SET Cliente = ? WHERE id = ?', [`<a href="${publicUrl}" target="_blank">Foto subida</a>`, id], (err) => {
                    if (err) return res.status(500).json({ error: 'Error al actualizar Cliente' });

                    // Notificar éxito al cliente
                    res.json({ message: 'Archivo subido y cliente actualizado exitosamente', link: publicUrl });
                });

            } catch (error) {
                res.status(500).json({ message: 'Error al subir el archivo a Google Drive', error });
            }
        });
    }
};

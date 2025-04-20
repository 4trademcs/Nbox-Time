const nodemailer = require('nodemailer');
module.exports = mailControl = {
  handleMail: async(req,res)=>{
    const updatedData = req.body;
    //toma los datos recibidos de front (correo y telefono) y hace una consulta a db a ver si existen
    try {                    
      dbConect.query("SELECT * FROM usuarios WHERE email = ?, Telefono = ?", [updatedData.email], [updatedData.phone], (error, result) => {
        if (error) { return res.status(500).json({ message: "Error, verifique que los datos enviados sean correctos", error }); }    
        if (result.length > 0) { 
          //logica para enviar una plantilla con el email usando logica de creacion de un token q expire pasada 1h
          const destiny = result[0].email;
          // Configura el transporte SMTP
          const transporter = nodemailer.createTransport({
            host: 'smtp.hostinger.com', // Host SMTP de Hostinger
            port: 587, // Puerto SMTP (puedes usar 465 para SSL)
            secure: false, // true para 465, false para otros puertos
            auth: {
              user: 'nboxtime.services@gmail.com', // El correo electrónico de Hostinger
              pass: 'tucontraseña' // La contraseña la cuenta de correo configurada en Hostinger
            }
          });
          // Configura el correo electrónico
          const mailOptions = {
            from: 'nboxtime.services@gmail.com', // Remitente
            to: destiny, // Destinatario
            subject: 'Solicitud de cambio de password',
            text: 'Contenido del correo en texto plano',//sustituir por un texto generico de sms de cambio de pass y un enlace q lleve al sitio
            html: '<b>Contenido del correo en HTML</b>'
          };
          // Envía el correo
          transporter.sendMail(mailOptions, (error, info) => { 
            if (error) return res.status(400).json({ message: "Falló el envío del email, vuelva a intentarlo" }, info.messageId/*q es el mensaje id y como aprovecharlo para tokenizar o mostrarlo*/);
            else return res.status(200).json({ message: "Se envió un email con los pasos para resetear password" }, info.messageId);
          });
        }                   
      });
    }
    catch (error) { console.log(error); res.status(500).json({ message: "Error al procesar la solicitud", error }); }
  }
}
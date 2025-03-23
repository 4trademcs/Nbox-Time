const dbConect = require('./db'); //---acceso a conexion en db
const fs = require('fs'); //---manejo de archivos html
const path = require('path'); //---manejo de directorios, direcciones
const bcryptjs = require('bcryptjs');//---encriptar datos
const jwt = require('jsonwebtoken');//----auth de usuarios por jwt
const { promisify } = require('util');
const moment = require('moment');//----crear fechas con formato de AA:MM:HH:MM:SS
const crypto = require('crypto');//-------------encriptado reversible
require('dotenv').config();
const { encryptID,decryptID,getKey } = require('./encryption');
// ------sin usar aun--------
const email = require ('./mailer') //-----acceso a enviar emails automaticos

//Completada🟢 Pendiente🔴 Enviando🟡
module.exports =  routesController = {
    handleInsert: async (req, res) => {
        // Verificar si el usuario está logueado
        const cookie = desencriptarCookie(req);       
        if (!cookie) { return res.status(401).json({ message: 'Debe iniciar sesión primero', redirectUrl: "/auth" }); }
    
        const { id,userRole } = cookie;
        const updatedData = req.body;
        updatedData.idCliente = id; 
        const date = moment();
    
        // Determina la tabla en donde insertar la data
        const tableName = updatedData.email ? "usuarios" : "pedidos";    
        // Validación sobre quienes pueden solicitar 'pedidos'
        if (tableName === "pedidos" && (!["Admin", "Cliente"].includes(userRole))) return res.status(403).json({ message: "No tiene permiso para añadir remesas" });           
         // Validación sobre quienes pueden añadir 'usuarios'
        if (tableName === "usuarios" && (!["Admin", "Gestor"].includes(userRole)))  return res.status(403).json({ message: "No tiene permiso para añadir usuarios" });  
        // Creacion del Id personalizado
        updatedData.id = tableName === "usuarios" ? `Boxess${date.format("YYYYMMDDHHMMSS")}` : `Pedidos${date.format("YYYYMMDDHHMMSS")}`;    
        // Encripta la contraseña si es un usuario
        if (tableName === "usuarios" && updatedData.pass) { updatedData.pass = await bcryptjs.hash(updatedData.pass, 8); }
        // Subfuncion para insertar
        const insertarDatos = ()=> {
            // Construye la consulta SQL de manera dinámica
            const columns = Object.keys(updatedData).join(", ");
            const campos = Object.keys(updatedData).map(() => "?").join(", ");
            const values = Object.values(updatedData);            
            const query = `INSERT INTO ${tableName} (${columns}) VALUES (${campos})`;

            dbConect.query(query, values, (error, results) => {
                if (error) { res.status(500).json({ message: `Error al insertar en ${tableName}`, error }); } 
                else { res.status(200).json({ message: "Solicitud enviada correctamente", tableName }); }
            });
        }

        // Verificar si el correo ya existe
        try {
            if (tableName === "usuarios" && updatedData.email) {                
                dbConect.query("SELECT * FROM usuarios WHERE email = ?", [updatedData.email], (error, results) => {
                    if (error) { return res.status(500).json({ message: "Error en la consulta a la base de datos", error }); }    
                    if (results.length > 0) { return res.status(400).json({ message: "El correo ya está registrado" }); }                   
                    insertarDatos(); 
                });
            } else { insertarDatos();}}// Si es un pedido no hay necesidad de verificar correo      
        catch (error) { console.log(error);            
            res.status(500).json({ message: "Error al procesar la solicitud", error });
        }
    },    
    
   
    handleDelete: (req, res) => {
        // Verificar si el usuario está logueado
        const cookie = desencriptarCookie(req);    
        if (!cookie) { return res.status(401).json({ message: 'Debe iniciar sesión primero', redirectUrl: '/auth' }); }
        const { userRole } = cookie;
        
        //Restringir usuarios
        if (userRole == 'Procesador') { return res.status(403).json({ message: 'Usted no tiene permisos para Eliminar' });}

        // Desencriptar el ID
        const { id: encryptedId } = req.body;
        const id = decryptID(encryptedId);
        if (!id) return res.status(400).json({ message: 'ID inválido' });
    
        const tableName = seleccionarTabla(id);
        
        // Función auxiliar para eliminar
        const realizarEliminacion = () => {
            const deleteQuery = `DELETE FROM ${tableName} WHERE id = ?`;
            dbConect.query(deleteQuery, [id], (error) => {
                if (error) {
                    return res.status(500).json({ message: `Error al eliminar el ${tableName.slice(0, -1)}`, error });
                }
                res.status(200).json({ message: `El ${tableName.slice(0,-1)} se ha eliminado con éxito `, tableName });
            });
        };
    
        // Lógica según el nombre de la tabla
        switch (tableName) {
            case 'pedidos':
                dbConect.query('SELECT Estado, Gestor FROM pedidos WHERE id = ?', [id], (err, results) => {
                    if (err) return res.status(500).json({ message: 'Error al verificar el estado.', error: err });
                    if (!results?.length) return res.status(404).json({ message: 'No se encontró el pedido.' });
    
                    const { Estado, Gestor } = results[0];
                    if (Estado != 'Pendiente' || Gestor != 'Pendiente') {
                        return res.status(400).json({ message: 'Imposible eliminar. El pedido está procesado.' });
                    }
                    realizarEliminacion(); // Proceder con la eliminación
                });
                break;
    
            case 'usuarios':
                if (userRole !== 'Admin') {
                    return res.status(403).json({ message: 'Usted no tiene permisos para esta operación' });
                }
                realizarEliminacion(); // Proceder con la eliminación
                break;
    
            default:
                res.status(400).json({ message: 'Operación no válida para la tabla especificada.' });
        }
    },
    
    
    handleEdit: (req, res) => {
        // Verificar si el usuario está logueado
        const cookie = desencriptarCookie(req);    
        if (!cookie) return res.status(401).json({ message: 'Debe iniciar sesión primero', redirectUrl: '/auth' });    
        const { userRole } = cookie;


        const { id: encryptedId, pass, ...updatedData } = req.body;    
        const id = decryptID(encryptedId);
        if (!id) return res.status(400).json({ message: 'ID inválido' });
    
        const tableName = seleccionarTabla(id);
        const filteredData = Object.fromEntries(Object.entries(updatedData).filter(([_, value]) => value !== '' && value !== false));
    
        if (!Object.keys(filteredData).length) return res.status(400).json({ message: 'No hay datos válidos para actualizar.' });
    
        // Función auxiliar para realizar la edición
        const realizarEdicion = (data) => {
            const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
            const updateQuery = `UPDATE ${tableName} SET ${setClause} WHERE id = ?`;
            const values = [...Object.values(data), id];
    
            dbConect.query(updateQuery, values, (error) => {
                if (error) return res.status(500).json({ message: `Error al actualizar ${tableName.slice(0, -1)}`, error });
                res.status(200).json({ message: 'Editado y guardado en Base de Datos', tableName });
            });
        };
    
        // Switch con dos variables: tableName y userRole
        switch (`${tableName}-${userRole}`) {
            case 'pedidos-Procesador':
            case 'pedidos-Gestor':
                return res.status(403).json({ message: 'Usted no tiene permisos para editar' });
    
            case 'pedidos-Admin':
                return realizarEdicion(filteredData);
    
            case 'pedidos-Cliente':
                dbConect.query('SELECT Estado, Gestor FROM pedidos WHERE id = ?', [id], (err, results) => {
                    if (err) return res.status(500).json({ message: 'Error al verificar el estado.', error: err });
                    if (!results?.length) return res.status(404).json({ message: 'No se encontró la remesa.' });
    
                    const { Estado, Gestor } = results[0];
                    if (Estado == 'Completada' || Gestor == 'Completado') 
                        return res.status(400).json({ message: 'Imposible editar. Esta remesa ya está procesándose.' });
    
                    realizarEdicion(filteredData);
                });
                break;
    
            case 'usuarios-Admin':
            case 'usuarios-Gestor':
                if (pass) {
                    return bcryptjs.hash(pass, 8, (err, hash) => {
                        if (err) return res.status(500).json({ message: 'Error al encriptar la contraseña.', error: err });
                        realizarEdicion({ ...filteredData, pass: hash });
                    });
                }
                realizarEdicion(filteredData);
                break;
    
            default:
                res.status(400).json({ message: 'Operación no válida o permisos insuficientes.' });
        }
    },
    
    handleComprobante: async (req, res) => {
        try {
            // 1. Verificación de autenticación
            const cookie = desencriptarCookie(req);
            if (!cookie) return res.status(401).json({message: "Debe iniciar sesión primero", redirectUrl: "/auth"});
            
            // 2. Extraer datos del usuario
            const { id: userId, userRole } = cookie;
            const { id: encryptedId } = req.body;

            // 3. Validar permisos de acceso
            const allowedRoles = ["Admin", "Procesador", "Cliente"];
            if (!allowedRoles.includes(userRole))  return res.status(403).json({message: "No autorizado"});        
            // 4. Validación de ID recibido
            if (!encryptedId) return res.status(400).json({message: "ID no recibido en la solicitud"});
            // 5. Desencriptar ID del pedido
            const pedidoId = decryptID(encryptedId);
            if (!pedidoId) return res.status(400).json({message: "ID inválido o corrupto"});
            // 6. Verificar existencia del pedido en DB
            const [results] = await dbConect.promise().query("SELECT idCliente FROM pedidos WHERE id = ?",[pedidoId]);        
            if (!results.length) return res.status(404).json({message: "No se encontró el pedido solicitado" });

            // 7. Control de acceso para clientes
            const { idCliente } = results[0];
            if (userRole === "Cliente" && idCliente !== userId) {
                return res.status(403).json({ message: "Acceso restringido a documentos de otros clientes" 
                });
            }

            // 8. Construir ruta de la imagen
            const uploadsDir = path.join( __dirname, `../private/img/uploads/${idCliente}` );
            
            // 9. Buscar archivo con extensiones válidas
            const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
            let imagePath;
            
            for (const ext of allowedExtensions) {
                const possiblePath = path.join(uploadsDir, `${pedidoId}${ext}`);
                if (fs.existsSync(possiblePath)) {
                    imagePath = possiblePath;
                    break;
                }
            }

            // 10. Manejar imagen no encontrada
            if (!imagePath) return res.status(404).json({ message: "Comprobante no encontrado para este pedido" 
            });

            // 11. Determinar tipo MIME
            const mimeTypes = {'.jpg': 'image/jpeg','.jpeg': 'image/jpeg','.png': 'image/png','.webp': 'image/webp'};
            
            const fileExt = path.extname(imagePath).toLowerCase();
            const contentType = mimeTypes[fileExt] || 'application/octet-stream';

            // 12. Enviar imagen al frontend
            res.set('Content-Type', contentType);
            res.sendFile(imagePath, (err) => {
                if (err) return res.status(500).json({ message: "Error al cargar el comprobante" });
                
            });

        } catch (error) {
            return res.status(500).json({ 
                message: "Error crítico al procesar la solicitud",
                error: error.message 
            });
        }
    },    
            
        
    handleConfirm: (req, res) => {
        // Verificar si el usuario está logueado
        const cookie = desencriptarCookie(req);          
        if (!cookie) return res.status(401).json({ message: 'Debe iniciar sesión primero', redirectUrl: "/auth" });            
        const { userRole } = cookie;
    
        // Desencriptar el ID    
        const { id: encryptedId } = req.body;    
        const id = decryptID(encryptedId);
        if (!id) { return res.status(400).json({ message: 'ID inválido' }); }
    
        // Buscar pedido en la base de datos
        dbConect.query('SELECT Estado, Gestor, Cliente FROM pedidos WHERE id = ?', [id], (err, result) => {
            if (err) return res.status(500).json({ error: 'Error al verificar el pedido' });    
            if (result.length === 0) return res.status(404).json({ message: 'Pedido no encontrado' });            
    
            const { Estado, Gestor, Cliente } = result[0];    
            console.log(Cliente, Gestor, Estado);
    
            switch (userRole) {
                case 'Cliente':                
                    if (Gestor === 'Completado' && Cliente === 'Comprobante Subido' && Estado === 'Enviando') { 
                        // Actualizar Cliente
                        dbConect.query('UPDATE pedidos SET Cliente = "Completado" WHERE id = ?', [id], (err) => {
                            if (err) return res.status(500).json({ error: 'Error al actualizar Cliente' });
                            verificarEstado(id); // Actualizar estado general
                            return res.status(200).json({ message: 'Usted confirma que el cliente recibió la remesa', tableName: 'pedidos' });
                        });
                    } else {
                        return res.status(400).json({ message: 'Para poder confirmar el pedido debe estar en "Enviando" y el Gestor debe haber confirmado la entrega' });
                    }
                    break;
    
                case 'Procesador':    
                    if (Cliente === 'Comprobante Subido') {
                        // Establecer el Estado como "Pagado"
                        dbConect.query('UPDATE pedidos SET Estado = "Pagado" WHERE id = ?', [id], (err) => {
                            if (err) return res.status(500).json({ error: 'Error al establecer el estado como Pagado' });
                            return res.status(200).json({ message: 'El estado del pedido se ha establecido como "Pagado"', tableName: 'pedidos' });
                        });
                    } else {
                        return res.status(400).json({ message: 'El cliente debe subir la foto tipo comprobante primero' });
                    }
                    break;
    
                case 'Gestor':                
                    if (Estado !== 'Pagado') {
                        return res.status(400).json({ message: 'El Procesador no ha confirmado este pago' });
                    }
    
                    // Actualizar Gestor y Estado
                    dbConect.query('UPDATE pedidos SET Gestor = "Completado", Estado = "Enviando" WHERE id = ?', [id], (err) => {
                        if (err) return res.status(500).json({ error: 'Error al actualizar Gestor' });
                        verificarEstado(id); // Actualizar estado general
                        return res.status(200).json({ message: 'Gestor confirma que entregó la remesa', tableName: 'pedidos' });
                    });
                    break;
    
                case 'Admin': 
                    if (Gestor == "Completado" && Estado == "Enviando" && Cliente == 'Comprobante Subido') {
                        // Actualizar Remesa a completada
                        dbConect.query('UPDATE pedidos SET Gestor = "Completado", Cliente = "Completado", Estado = "Completada" WHERE id = ?', [id], (err) => {
                            if (err) return res.status(500).json({ error: 'Error al actualizar Gestor' });
                            verificarEstado(id); // Actualizar estado general
                            return res.status(200).json({ message: 'Remesa completada', tableName: 'pedidos' });
                        });
                    }
                    else if (Cliente === 'Comprobante Subido') {
                        // Actualizar Gestor y Estado
                        dbConect.query('UPDATE pedidos SET Gestor = "Completado", Estado = "Enviando" WHERE id = ?', [id], (err) => {
                            if (err) return res.status(500).json({ error: 'Error al actualizar Gestor' });
                            verificarEstado(id); // Actualizar estado general
                            return res.status(200).json({ message: 'Gestor confirma que entregó la remesa', tableName: 'pedidos' });
                        });
                    } 
                    break;
    
                default:  
                    return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' });
            }
        });
    },
    
    
    handleLogin: async (req, res) => {
        const { nombre, pass, email } = req.body;
        console.log("Datos recibidos en el backend:", req.body);
    
        try {
            if (!email || !pass || !nombre) {
                return res.status(400).json({ message: 'Por favor, ingrese email, contraseña y nombre' });
            }
    
            dbConect.query('SELECT * FROM usuarios WHERE email = ?', [email], async (error, results) => {
                if (error) {
                    return res.status(500).json({ message: 'Error en la consulta a la base de datos', error });
                } 
                
                if (results.length === 0) {
                    return res.status(401).json({ message: 'Email no registrado' });
                }
    
                const user = results[0];
                console.log("Resultado de la consulta:", user);
    
                // Verificar el nombre
                if (user.Nombre !== nombre) {
                    return res.status(401).json({ message: 'El nombre de usuario proporcionado no coincide con el guardado para este email' });
                }
    
                // Verificar la contraseña
                const validPassword = await bcryptjs.compare(pass, user.Pass);
                if (!validPassword) {
                    return res.status(401).json({ message: 'Contraseña incorrecta' });
                }
    
                const id = user.Id;
                const userRole = user.Rol;
                console.log(`cookie creada ${id}, ${userRole} `);
                // Generando token
                const token = jwt.sign({ id, userRole }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES_IN,
                });
    
                // Configurando cookie
                res.cookie('jwt', token, {
                    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
                    httpOnly: true,
                });
    
                return res.status(200).json({ message: 'Login exitoso', token, redirectUrl: "/backoffice" });
            });
        } catch (error) {
            console.log("Error en el Proceso de login:", error);
            return res.status(500).json({ message: 'Error en el Proceso de login', error });
        }
    }, 
  

    handleLogout: (req, res) => {
        console.log(`se ejecuto un logout`);
        res.clearCookie('jwt');
        res.status(200).json({ message: 'Logout exitoso', redirectUrl:"/" });
    },   

    
    handleTable: async (req, res) => {   
        // Verificar si el usuario está logueado
        const cookie = desencriptarCookie(req);
        if (!cookie) { return res.status(401).json({ message: 'Debe iniciar sesión primero', redirectUrl: "/auth" }); }    
        const { id, userRole } = cookie;

        const tableName = req.query.table;
        let query = '';
        let preserveID = false; // Decidir si se manda a Frontend el campo ID
        const params = (userRole === 'Cliente' || userRole === 'Gestor') ? [id] : [];
    
        // Configurar consulta  según el rol del usuario
        switch (userRole) {
            case 'Cliente':
                query = tableName === 'usuarios'
                    ? `SELECT Nombre, Telefono, Email FROM usuarios WHERE Patrocinador = ? ORDER BY numb DESC`
                    : `SELECT Nombre, Titular, Telefono, Tipo, Direccion, Tarjeta, Id, Monto, Cliente, Gestor, Estado FROM pedidos WHERE idCliente = ? ORDER BY numb DESC`;
                break;
    
            case 'Gestor':
                query = tableName === 'usuarios'
                    ? `SELECT Nombre, Telefono, Direccion, Email, Patrocinador, Rol, Bono, Id, Carnet FROM usuarios WHERE Patrocinador = ? ORDER BY numb DESC`
                    : `SELECT Nombre, Titular, Telefono, Tipo, Direccion, Tarjeta, Id, Monto, idCliente, Cliente, Gestor, Estado FROM pedidos WHERE Patrocinador IN (?,'Google','Remesa') ORDER BY numb DESC`;
                preserveID = true;
                break;
    
            case 'Procesador':
                if (tableName === 'usuarios') {
                    return res.status(403).json({ message: 'No tiene permisos para visualizar usuarios' });
                }
                query = `SELECT Nombre, Titular, Telefono, Tipo, Direccion, Tarjeta, Id, Monto, idCliente, Cliente, Gestor, Estado FROM pedidos WHERE Estado != 'Completada' ORDER BY numb DESC`;
                break;
    
            case 'Admin':
                query = tableName === 'usuarios'
                    ? `SELECT Nombre, Telefono, Direccion, Email, Patrocinador, Rol, Bono, Id, Carnet FROM usuarios ORDER BY numb DESC`
                    : `SELECT Nombre, Titular, Telefono, Tipo, Direccion, Tarjeta, Id, Monto, idCliente, Patrocinador, Cliente, Gestor, Estado FROM pedidos ORDER BY numb DESC`;
                preserveID = true;
                break;
    
            default:
                return res.status(403).json({ message: 'No tiene permisos para acceder a esta tabla' });
        }
    
        dbConect.query(query, params, async (error, results) => {
            if (error) {
                return res.status(500).json({ message: `Error al obtener datos en la tabla ${tableName}`, error });
            }
    
            try {
                // Procesar resultados con IDs protegidos
                const processedResults = await Promise.all(results.map(async (row) => {
                    if (!row.Id) return { ...row, protectedId: null };
                    const protectedId = encryptID(row.Id.toString());
                    return { ...row, protectedId };
                }));
    
                // Decidir si se elimina el campo `Id` según `preserveID`
                const responseData = preserveID ? processedResults : processedResults.map(({ Id, ...rest }) => rest);
    
                return res.status(200).json({
                    data: responseData,
                    userRole,
                    tableName
                });
            } catch (hashError) {
                return res.status(500).json({ message: 'Error al procesar identificadores', error: hashError });
            }
        });
    },
    
    
    handlePago: async (req, res) => {
        try {
          // Ruta del archivo JSON en el backend
          const jsonFilePath = path.join(__dirname, '/data.json');          
          const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));// Leer el archivo JSON
    
          // Si hay datos en el cuerpo de la solicitud, actualiza el JSON
          if (req.body && Object.keys(req.body).length > 0) {
            Object.assign(jsonData, req.body);            
            fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), 'utf-8');// Escribir los cambios en el archivo JSON
          }    
          // Enviar la respuesta al frontend
          res.status(200).json(jsonData);

        } catch (error) {
          console.error('Error al manejar la solicitud:', error);
          res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

         
    isAuthenticated : async (req, res, next) => {        
            // Verificar si el token existe
            if (req.cookies.jwt) {
                try {
                    // Verificar el token JWT
                    const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
                    
                    // Buscar al usuario en la base de datos por su ID
                    dbConect.query('SELECT * FROM usuarios WHERE id = ?', [decoded.id], (error, results) => {
                        if (error) { return res.status(500).json({ message: 'Error en el servidor', error }); }
        
                        if (results.length === 0) {
                            // El usuario no existe en la base de datos
                            return res.status(401).json({
                                message: 'El usuario no existe. Intente loguearse o verifique sus credenciales',
                                redirectUrl: "/auth" // URL de redirección en caso de error
                            });
                        }
        
                        // Usuario encontrado, tiene acceso
                        req.user = results[0];
                        next();
                    });
                } catch (error) {
                    // Token expirado o inválido
                    return res.status(401).json({
                        message: 'Se requiere iniciar sesión.',
                        error,
                        redirectUrl: "/auth" // URL de redirección en caso de sesión expirada
                    });
                }
            } else {
                // No hay token en las cookies
                return res.status(401).json({
                    message: 'No autorizado, se requiere iniciar sesión.',
                    redirectUrl: "/auth" // URL de redirección en caso de no estar autenticado
                });
            }
        }
};


// ---------------------------------------------- Sub-functions -----------------------------------------------------------


const seleccionarTabla = (id) => {
    if (id.includes('Boxess')) { return 'usuarios';
    } else if (id.includes('Pedido')) { return 'pedidos';
    } else { throw new Error('ID no válido.');  }
}

async function verificarEstado(id) {
    try {
        // Obtener información del pedido
        const [[{ Cliente, Gestor, idCliente, Monto, Estado }]] = await dbConect.promise().query('SELECT Cliente, Gestor, idCliente, Monto, Estado FROM pedidos WHERE id = ?',[id]);

        // Verificar si el estado puede actualizarse a "Completada"
        if (Cliente === 'Completado' && Gestor === 'Completado' && Estado !== 'Completada') {
            await dbConect.promise().query('UPDATE pedidos SET Estado = "Completada" WHERE id = ?', [id]);
            // Obtener patrocinador y bono actual
            const [[{ Patrocinador }]] = await dbConect.promise().query('SELECT Patrocinador FROM usuarios WHERE id = ?',[idCliente]);
            const [[{ Bono }]] = await dbConect.promise().query('SELECT Bono FROM usuarios WHERE id = ?',[Patrocinador]);
            // Calcular el nuevo bono, agregando el 10% de Monto al bono existente y limitarlo a 2 decimales
            const bonoIncrementado = parseFloat((Bono + Monto / 10).toFixed(2));
            // Actualizar el bono del patrocinador
            await dbConect.promise().query('UPDATE usuarios SET Bono = ? WHERE id = ?',[bonoIncrementado, Patrocinador]);
        }

    } catch (error) {
        console.error('Error en la función verificarEstado:', error);
    }
}

const desencriptarCookie = (req) => {
    const token = req.cookies.jwt;   
    try {
        // Desencripta y devuelve los datos del usuario
        const { id, userRole, iat, exp } = jwt.verify(token, process.env.JWT_SECRET);
        return { id, userRole, iat, exp }; // Retorna un JSON con los datos    
    } catch (error) {
        return false;
    }
};
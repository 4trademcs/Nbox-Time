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

module.exports =  routesController = {
    handleInsert: async (req, res) => {
        const cookie = desencriptarCookie(req);   
        const { id } = cookie;
        const updatedData = req.body;
        const date = moment();            
        // Determina la tabla y asigna un ID de manera dinámica
        const tableName = updatedData.email ? 'usuarios' : 'pedidos';
    
        if (!cookie && tableName == "pedidos") {
            return res.status(200).json({ message: 'Usted debe iniciar sesión primero', redirectUrl: "/auth" });
        }
    
        updatedData.id = tableName === 'usuarios' ? `Boxess${date.format('YYYYMMDDHHMMSS')}` : `Pedidos${date.format('YYYYMMDDHHMMSS')}`;
        
        // Si la tabla es 'pedidos', asigna el idCliente del cookie
        if (tableName === 'pedidos') {
            updatedData.idCliente = id;
        }
    
        // Si es un usuario y tiene una contraseña, encripta la contraseña
        if (tableName === 'usuarios' && updatedData.pass) {
            updatedData.pass = await bcryptjs.hash(updatedData.pass, 8);
        }
    
        try {
            if (tableName === 'usuarios' && updatedData.email) {
                // Verificar si el correo ya existe
                dbConect.query('SELECT * FROM usuarios WHERE email = ?', [updatedData.email], (error, results) => {
                    if (error) {
                        return res.status(500).json({ message: 'Error en la consulta a la base de datos', error });
                    }
    
                    if (results.length > 0) {
                        return res.status(400).json({ message: 'El correo ya está registrado' });
                    }
    
                    // Si el correo no existe, continuar con la inserción
                    insertarDatos();
                });
            } else {
                // Si no es un usuario o no tiene correo, continuar con la inserción
                insertarDatos();
            }
    
            function insertarDatos() {
                // Obtiene las columnas y los valores de manera dinámica
                const columns = Object.keys(updatedData).join(', ');
                const placeholders = Object.keys(updatedData).map(() => '?').join(', ');
                const values = Object.values(updatedData);
    
                // Construye la consulta SQL de manera dinámica
                const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
                console.log(query);
    
                dbConect.query(query, values, (error, results) => {
                    if (error) {
                        res.status(500).json({ message: `Error al insertar en ${tableName}`, error });
                    } else {
                        res.status(200).json({ message: 'Solicitud enviada correctamente', tableName });
                    }
                });
            }
        } catch (error) {
            res.status(500).json({ message: 'Error al procesar la solicitud', error });
        }
    },
    
   
    handleDelete: (req, res) => {
        const { id: encryptedId } = req.body;
    
        // Desencriptar el ID
        const id = decryptID(encryptedId);
        if (!id) return res.status(400).json({ message: 'ID inválido' });
    
        const tableName = seleccionarTabla(id);
        const cookie = desencriptarCookie(req);
        const { userRole } = cookie || {};
    
        if (!cookie) {
            return res.status(401).json({ message: 'Debe iniciar sesión primero', redirectUrl: '/auth' });
        }
    
        // Función reutilizable para eliminar
        const realizarEliminacion = () => {
            const deleteQuery = `DELETE FROM ${tableName} WHERE id = ?`;
            dbConect.query(deleteQuery, [id], (error) => {
                if (error) {
                    return res.status(500).json({ message: `Error al eliminar el ${tableName.slice(0, -1)}`, error });
                }
                res.status(200).json({ message: 'Registro eliminado de la Base de Datos', tableName });
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
        const { id: encryptedId, ...updatedData } = req.body;
    
        const id = decryptID(encryptedId);
        if (!id) return res.status(400).json({ message: 'ID inválido' });
    
        const tableName = seleccionarTabla(id);
        const cookie = desencriptarCookie(req);
        const { userRole } = cookie || {};
    
        if (!cookie) {
            return res.status(401).json({ message: 'Debe iniciar sesión primero', redirectUrl: '/auth' });
        }
    
        const filteredData = Object.fromEntries(
            Object.entries(updatedData).filter(([_, value]) => value !== '' && value !== false)
        );
    
        if (!Object.keys(filteredData).length) {
            return res.status(400).json({ message: 'No hay datos válidos para actualizar.' });
        }
    
        const realizarEdicion = (data) => {
            const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
            const updateQuery = `UPDATE ${tableName} SET ${setClause} WHERE id = ?`;
            const values = [...Object.values(data), id];
    
            dbConect.query(updateQuery, values, (error) => {
                if (error) {
                    return res.status(500).json({ message: `Error al actualizar el ${tableName.slice(0, -1)}`, error });
                }
                res.status(200).json({ message: 'Editado y guardado en Base de Datos', tableName });
            });
        };
    
        // Lógica según el nombre de la tabla
        switch (tableName) {
            case 'pedidos':
                dbConect.query('SELECT Estado, Gestor FROM pedidos WHERE id = ?', [id], (err, results) => {
                    if (err) return res.status(500).json({ message: 'Error al verificar el estado.', error: err });
                    if (!results?.length) return res.status(404).json({ message: 'No se encontró la remesa.' });
    
                    const { Estado, Gestor } = results[0];
                    if (Estado === 'Completada' || Gestor === 'Completado') {
                        return res.status(400).json({ message: 'Imposible editar. Esta remesa ya está procesándose.' });
                    }
    
                    realizarEdicion(filteredData); // Proceder con la edición
                });
                break;
    
            case 'usuarios':
                if (userRole !== 'Admin' && userRole !== 'Gestor') {
                    return res.status(403).json({ message: 'Usted no tiene permisos para esta operación' });
                }
    
                if (updatedData.pass) {
                    return bcryptjs.hash(updatedData.pass, 8, (err, hash) => {
                        if (err) return res.status(500).json({ message: 'Error al encriptar la contraseña.', error: err });
                        filteredData.pass = hash;
                        realizarEdicion(filteredData); // Proceder con la edición
                    });
                }
    
                realizarEdicion(filteredData); // Proceder con la edición
                break;
    
            default:
                res.status(400).json({ message: 'Operación no válida para la tabla especificada.' });
        }
    },
            
    
    
    
    handleGestor: (req, res) => {
        const { id: encryptedId } = req.body;
        const { userRole } = req.cookies || {}; // Verificar rol desde la cookie
    
        if (userRole !== 'Admin' && userRole !== 'Gestor') {
            return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' });
        }
    
        // Desencriptar el ID
        const id = decryptID(encryptedId);
        if (!id) {
            return res.status(400).json({ message: 'ID inválido' });
        }
    
        // Verificar si el estado es "Pagado"
        dbConect.query('SELECT Estado FROM pedidos WHERE id = ?', [id], (err, result) => {
            if (err) return res.status(500).json({ error: "Error al verificar el estado del pedido" });
    
            const { Estado } = result[0];
            if (Estado !== 'Pagado') {
                return res.status(400).json({ message: 'El pedido debe estar en estado "Pagado" para realizar esta acción' });
            }
    
            // Actualizar Gestor y Estado
            dbConect.query('UPDATE pedidos SET Gestor = "Completado", Estado = "Enviando.." WHERE id = ?', [id], (err) => {
                if (err) return res.status(500).json({ error: "Error al actualizar Gestor" });
                verificarEstado(id); // Verificar si puede actualizar el estado general
                res.status(200).json({ message: 'Gestor confirma que entregó la remesa', tableName: 'pedidos' });
            });
        });
    },
    
    handleCliente: (req, res) => {
        const { id: encryptedId } = req.body;
        const { userRole } = req.cookies || {}; // Verificar rol desde la cookie
    
        if (userRole !== 'Admin' && userRole !== 'Cliente') {
            return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' });
        }
    
        // Desencriptar el ID
        const id = decryptID(encryptedId);
        if (!id) {
            return res.status(400).json({ message: 'ID inválido' });
        }
    
        // Verificar si el estado es "Pagado"
        dbConect.query('SELECT Estado, Gestor FROM pedidos WHERE id = ?', [id], (err, result) => {
            if (err) return res.status(500).json({ error: "Error al verificar el estado del pedido" });
    
            const { Estado, Gestor } = result[0];
            if (Estado !== 'Pagado') {
                return res.status(400).json({ message: 'El pedido debe estar "Pagado" para confirmar' });
            }
    
            if (Gestor !== 'Completado') {
                return res.status(400).json({ message: "El Gestor debe completar primero el pedido" });
            }
    
            // Actualizar Cliente
            dbConect.query('UPDATE pedidos SET Cliente = "Completado" WHERE id = ?', [id], (err) => {
                if (err) return res.status(500).json({ error: "Error al actualizar Cliente" });
                verificarEstado(id); // Verificar si puede actualizar el estado general
                res.status(200).json({ message: 'Usted confirma que el cliente recibió la remesa', tableName: 'pedidos' });
            });
        });
    },
    
    handlePaymentProcessor: (req, res) => {
        const { id: encryptedId } = req.body;
        const { userRole } = req.cookies || {}; // Verificar rol desde la cookie
    
        if (userRole !== 'Admin' && userRole !== 'Procesador') {
            return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' });
        }
    
        // Desencriptar el ID
        const id = decryptID(encryptedId);
        if (!id) {
            return res.status(400).json({ message: 'ID inválido' });
        }
    
        // Establecer el estado como "Pagado"
        dbConect.query('UPDATE pedidos SET Estado = "Pagado" WHERE id = ?', [id], (err) => {
            if (err) return res.status(500).json({ error: "Error al establecer el estado como Pagado" });
            res.status(200).json({ message: 'El estado del pedido se ha establecido como "Pagado"', tableName: 'pedidos' });
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
        const tableName = req.query.table;
        const cookie = desencriptarCookie(req);
    
        // Verificar si el usuario está logueado
        if (!cookie) {
            return res.status(401).json({ message: 'Debe iniciar sesión primero', redirectUrl: "/auth" });
        }
    
        const { id, userRole } = cookie;
    
        let query = '';
        const params = userRole === 'Cliente' || userRole === 'Gestor' ? [id] : [];
    
        switch (userRole) {
            case 'Cliente':
                query = tableName === 'usuarios'
                    ? `SELECT Nombre, Telefono, Email FROM usuarios WHERE Patrocinador = ? ORDER BY numb DESC`
                    : `SELECT Nombre, Titular, Telefono, Tipo, Direccion, Tarjeta, Id, Monto, idCliente, Cliente, Gestor, Estado FROM pedidos WHERE idCliente = ? ORDER BY numb DESC`;
                break;
    
            case 'Gestor':
                query = tableName === 'usuarios'
                    ? `SELECT Nombre, Telefono, Direccion, Email, Patrocinador, Rol, Bono, Id, Carnet FROM usuarios WHERE Patrocinador = ? ORDER BY numb DESC`
                    : `SELECT Nombre, Titular, Telefono, Tipo, Direccion, Tarjeta, Id, Monto, idCliente, Cliente, Gestor, Estado FROM pedidos WHERE Patrocinador = ? ORDER BY numb DESC`;
                break;
    
            case 'Procesador':
                if (tableName === 'usuarios') {
                    return res.status(403).json({ message: 'No tiene permisos para acceder a esta tabla' });
                }
                query = `SELECT Nombre, Titular, Telefono, Tipo, Direccion, Tarjeta, Id, Monto, idCliente, Cliente, Gestor, Estado FROM pedidos WHERE Estado != 'Completada'`;
                break;
    
            case 'Admin':
                query = tableName === 'usuarios'
                    ? `SELECT Nombre, Telefono, Direccion, Email, Patrocinador, Rol, Bono, Id, Carnet FROM usuarios ORDER BY numb DESC`
                    : `SELECT Nombre, Titular, Telefono, Tipo, Direccion, Tarjeta, Id, Monto, idCliente, Cliente, Gestor, Estado FROM pedidos ORDER BY numb DESC`;
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
    
                // Eliminar campo "Id" para roles Cliente y Gestor
                const responseData = userRole === 'Admin'
                    ? processedResults // Admin conserva el campo Id
                    : processedResults.map(({ Id, ...rest }) => rest); // Cliente/Gestor elimina el campo Id
    
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

          // Leer el archivo JSON
          const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
    
          // Si hay datos en el cuerpo de la solicitud, actualiza el JSON
          if (req.body && Object.keys(req.body).length > 0) {
            Object.assign(jsonData, req.body);
    
            // Escribir los cambios en el archivo JSON
            fs.writeFileSync(jsonFilePath, JSON.stringify(jsonData, null, 2), 'utf-8');
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
                        if (error) {
                            // Error en la consulta a la base de datos
                            return res.status(500).json({ message: 'Error en el servidor', error });
                        }
        
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

function seleccionarTabla(id) {
    if (id.includes('Boxess')) {
        return 'usuarios';
    } else if (id.includes('Pedido')) {
        return 'pedidos';
    } else {
        throw new Error('ID no válido.');
    }
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


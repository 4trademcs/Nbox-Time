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
            if (!cookie) {
                return res.status(200).json({ message: 'Usted debe iniciar sesión primero', redirectUrl: "/auth" });
            }
    
            const { id } = cookie;
            const updatedData = req.body;
            const date = moment();
            
            // Determina la tabla y asigna un ID de manera dinámica
            const tableName = updatedData.email ? 'usuarios' : 'pedidos';
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
                        res.status(200).json({ message: 'Guardado en Base de Datos',tableName});
                    }
                });
            } catch (error) {
                res.status(500).json({ message: 'Error al procesar la solicitud', error });
            }
        },
   
        handleDelete: (req, res) => {
            const { id: encryptedId } = req.body;
        
            // Desencriptar el ID
            const id = decryptID(encryptedId);
            if (!id) {
                return res.status(400).json({ message: 'ID inválido' });
            }
        
            const tableName = seleccionarTabla(id);
            const cookie = desencriptarCookie(req);
            const { userRole } = cookie;
        
            // Verificar si el usuario está logueado
            if (!cookie) {
                return res.status(200).json({ message: 'Usted debe iniciar sesión primero', redirectUrl: "/auth" });
            }
        
            // Verificar permisos
            if (tableName === 'usuarios' && userRole !== 'Admin') {
                return res.status(200).json({ message: 'Usted no tiene permisos para esta operación' });
            }
        
            const deleteQuery = `DELETE FROM ${tableName} WHERE id = ?`;
            dbConect.query(deleteQuery, [id], (error, results) => {
                if (error) {
                    return res.status(500).json({ message: `Error al eliminar el ${tableName.slice(0, -1)}`, error });
                } else {
                    res.status(200).json({ message: 'Registro eliminado de la Base de Datos', tableName });
                }
            });
        },
        
        handleEdit: async (req, res) => {
            const { id: encryptedId, ...updatedData } = req.body;
        
            // Desencriptar el ID
            const id = decryptID(encryptedId);
            if (!id) {
                return res.status(400).json({ message: 'ID inválido' });
            }
        
            const tableName = seleccionarTabla(id);
            const cookie = desencriptarCookie(req);
            const { userRole } = cookie;
        
            try {
                // Verificar si el usuario está logueado
                if (!cookie) {
                    return res.status(200).json({ message: 'Usted debe iniciar sesión primero', redirectUrl: "/auth" });
                }
        
                // Restringir editar usuarios a Admin y Gestores
                if (tableName === 'usuarios' && (userRole !== 'Admin' && userRole !== 'Gestor')) {
                    return res.status(200).json({ message: 'Usted no tiene permisos para esta operación' });
                }
        
                // Encriptar contraseña si es la tabla usuarios
                if (tableName === 'usuarios' && updatedData.pass) {
                    updatedData.pass = await bcryptjs.hash(updatedData.pass, 8);
                }
        
                const filteredData = Object.fromEntries(
                    Object.entries(updatedData).filter(([key, value]) => value !== '' && value !== false)
                );
        
                if (Object.keys(filteredData).length === 0) {
                    return res.status(400).json({ message: "No hay datos válidos para actualizar." });
                }
        
                const setClause = Object.keys(filteredData).map(key => `${key} = ?`).join(', ');
                const updateQuery = `UPDATE ${tableName} SET ${setClause} WHERE id = ?`;
        
                const values = [...Object.values(filteredData), id];
                dbConect.query(updateQuery, values, (error, results) => {
                    if (error) {
                        return res.status(500).json({ message: `Error al actualizar el ${tableName.slice(0, -1)}`, error });
                    } else {
                        res.status(200).json({ message: 'Editado y guardado en Base de Datos', tableName });
                    }
                });
        
            } catch (error) {
                res.status(500).json({ message: 'Error al procesar la solicitud', error });
            }
        },
        
        handleGestor: (req, res) => {
            const { id: encryptedId } = req.body;
        
            // Desencriptar el ID
            const id = decryptID(encryptedId);
            if (!id) {
                return res.status(400).json({ message: 'ID inválido' });
            }
        
            dbConect.query('UPDATE pedidos SET Gestor = "Completado", Estado = "Enviando.." WHERE id = ?', [id], (err) => {
                if (err) return res.status(500).json({ error: "Error al actualizar Gestor" });
                verificarEstado(id); // Verificar si puede actualizar el estado general
                res.status(200).json({ message: 'Gestor confirma que entregó la remesa', tableName: 'pedidos' });
            });
        },
        
        handleCliente: (req, res) => {
            const { id: encryptedId } = req.body;
        
            // Desencriptar el ID
            const id = decryptID(encryptedId);
            if (!id) {
                return res.status(400).json({ message: 'ID inválido' });
            }
        
            dbConect.query('SELECT Gestor FROM pedidos WHERE id = ?', [id], (err, result) => {
                if (err) return res.status(500).json({ error: "Error al verificar estado del Gestor" });
                const { Gestor } = result[0];
                if (Gestor !== 'Completado') {
                    return res.status(400).json({ message: "El Gestor debe completar primero el pedido" });
                }
        
                dbConect.query('UPDATE pedidos SET Cliente = "Completado" WHERE id = ?', [id], (err) => {
                    if (err) return res.status(500).json({ error: "Error al actualizar Cliente" });
                    verificarEstado(id); // Verificar si puede actualizar el estado general
                    res.status(200).json({ message: 'Usted confirma que el cliente recibió la remesa', tableName: 'pedidos' });
                });
            });
        },
        
    

    handleLogin: async (req, res) => {
        const { pass, email } = req.body;
        console.log("Datos recibidos en el backend:", req.body);
    
        try {
            if (!email || !pass) {
                res.status(400).json({ message: 'Por favor, ingrese email y contraseña' });
            } else {
                dbConect.query('SELECT * FROM usuarios WHERE email = ?', [email], async (error, results) => {
                    if (error) {
                        res.status(500).json({ message: 'Error en la consulta a la base de datos:', error });
                    } else if (results.length === 0) {
                        res.status(401).json({ message: 'Email no registrado' });
                    } else {
                        // Verificar si el campo 'pass' está presente en los resultados
                        console.log("Resultado de la consulta:", results[0]);                     
                        const validPassword = await bcryptjs.compare(pass, results[0].Pass);
                        if (!validPassword) {
                            res.status(401).json({ message: 'Contraseña incorrecta' });
                        } else {
                            const id = results[0].Id;
                            const userRole = results[0].Rol;
                            //Generando Token
                            const token = jwt.sign({ id, userRole }, process.env.JWT_SECRET, {
                                expiresIn: process.env.JWT_EXPIRES_IN,
                            });
                            // Configurando cookie...
                            res.cookie('jwt', token, {
                                expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
                                httpOnly: true,
                            });
                            res.status(200).json({ message: 'Login exitoso', token, redirectUrl:"/backoffice" });
                        }
                    }
                });
            }
    
        } catch (error) {
            console.log("Error en el Proceso de login:", error);
            res.status(500).json({ message: 'Error en el Proceso de login', error });
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
    
        // Verificar permisos según el rol y la tabla
        if (tableName === 'usuarios' && userRole !== 'Admin') {
            return res.status(401).json({ message: 'No tiene permisos para realizar esta acción' });
        }
    
        // Construcción de la consulta SQL según el rol del usuario
        switch (userRole) {
            case 'Cliente':
                query = `SELECT Nombre, Titular, Telefono, Tipo, Direccion, Tarjeta, Id, Monto, idCliente, Cliente, Gestor, Estado 
                         FROM pedidos 
                         WHERE idCliente = ?`;
                break;
            case 'Gestor':
            case 'Admin':
                query = tableName === 'usuarios'
                    ? `SELECT Nombre, Telefono, Direccion, Email, Patrocinador, Rol, Bono, Id, Carnet FROM usuarios`
                    : `SELECT Nombre, Titular, Telefono, Tipo, Direccion, Tarjeta, Id, Monto, idCliente, Cliente, Gestor, Estado FROM pedidos`;
                break;
            default:
                return res.status(403).json({ message: 'No tiene permisos para acceder a esta tabla' });
        }
    
        // Ejecutar la consulta SQL
        dbConect.query(query, userRole === 'Cliente' ? [id] : [], async (error, results) => {
            if (error) {
                return res.status(500).json({ message: `Error al obtener datos en la tabla ${tableName}`, error });
            }
    
            try {
                // Usar bcryptjs.hash de forma asíncrona para proteger el ID
                const processedResults = await Promise.all(results.map(async (row) => {
                        if (!row.Id) { return { ...row, protectedId: null }; }
                        const protectedId = encryptID (row.Id.toString());
                        return { ...row, protectedId };
                    })
                );
    
                // Eliminar campo "Id" para roles Cliente y Gestor
                const responseData =
                    userRole === 'Admin'
                        ? processedResults // Admin conserva el campo Id
                        : processedResults.map(({ Id, ...rest }) => rest); // Cliente/Gestor elimina el campo Id
    
                // Enviar respuesta con `tableData` como un único objeto
                return res.status(200).json({
                    tableData: {
                        table: tableName, data: responseData,
                        userRole:userRole },
                    message: 'Datos obtenidos correctamente',
                    tableName
                });
            } catch (hashError) {
                return res.status(500).json({ message: 'Error al procesar identificadores', error: hashError });
            }
        });
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
                        message: 'Su sesión ha expirado, se requiere iniciar sesión nuevamente.',
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


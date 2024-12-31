// ===============================================================================================
// ============================ Funciones Globales para enviar solicitudes =======================
// ===============================================================================================

//Variables globales
var action;
var idActual;

// Cargar texto en modal que funciona como notificación.
const notificacionFront = (data) => {
    console.log(data)
    if (data.redirectUrl) {
        setTimeout(()=>{
            //cerrar todods los dialogs abiertos
            const dialogs = document.querySelectorAll('dialog[open="true"]');
            dialogs.forEach(dialog=>{
                dialog.removeAttribute('open');});
            //redirigir a la url    
            window.location.href = data.redirectUrl}
        ,3000);
    }
    const dialog = document.getElementById('alert-ok');
    const textoElement = document.querySelector('.texto');
    textoElement.innerHTML = '';
    textoElement.textContent = data.message;
    dialog.setAttribute('open', true);
    if (data.tableName) {
        // Llamar a `solicitarData` solo si `data.tableName` existe
        data.tableName === 'usuarios' ? solicitarData('usuarios') : solicitarData('pedidos');}
};


// Procesamiento antes de llamar métodos de solicitudes al servidor
function solicitarDelete(e) { 
    const dialog = document.getElementById('alert-re-confirm');
    document.getElementById('alert-message').innerText = "¿Seguro que deseas eliminar del registro?";
    dialog.open = true; 
    idActual = e.target.classList[0];
    action = 'delete';
}

function solicitarEdit(e) {
    idActual = e.target.classList[0];
    if (tableDatos.table == 'usuarios') lanzarModal('user-edit'); 
    else if (tableDatos.table == "pedidos") lanzarModal('consignment-edit'); 
    action = 'editar';    
}

function confirmacionPago(e) {
        const dialog = document.getElementById('alert-re-confirm');
        document.getElementById('alert-message').innerText = "Usted esta a punto de confirmar que se recibió el pago.¿Está seguro?";
        dialog.open = true; 
        idActual = e.target.classList[0];
        action = 'confirmar-pago';
}


// Funciones que envían solicitudes POST GET PUT DELETE

function actionToDo(e) { // Obtener confirmación para borrar o confirmar entrega
    action == 'delete' ? solicitud('DELETE', 'delete', { id: idActual }) 
                       : solicitud('PATCH', 'client/confirm', { id: idActual });  
}

function editFrom_DB(e) { // Abrir ventana modal para editar
    const id = e.target.classList[0];
    solicitud('PUT','edit', {id});
}


function confirmarGestor(e) {
    const id = e.target.classList[0];
    solicitud('PATCH','manager/confirm', {id});
}


function uploadImg(e) {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('id', e.target.classList[0]);
    
    solicitud('POST', 'upload', formData, null); // null para archivos
}


// ==============================================================================
// ================================ Métodos =====================================
// ==============================================================================


// funcion generica para hacer solicitudes GET, POST, PUT, PATCH y enviar notificacion
async function solicitud(method, ruta, objeto, contentType = 'application/json') {
    const options = {
        method,
        headers: contentType ? { 'Content-Type': contentType } : undefined, // Si hay contentType, asignamos el header
        body: contentType ? JSON.stringify(objeto) : objeto // Si hay contentType, serializamos como JSON, si no, usamos FormData
    };

    try {
        const response = await fetch(`/${ruta}`, options);
        const responseType = response.headers.get('Content-Type');

        // Procesar respuesta si es JSON
        if (responseType?.includes('application/json')) {
            const data = await response.json();
            if (data.message) notificacionFront(data);
        } else {
            window.location.href = `/${ruta}`;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}


//_________________________________MANEJO DE TABLA_____________________________________
// Variables globales
let tableDatos = [], indice = 0, entradastoshow = 10;

// Función para solicitar datos del backend
const solicitarData = async (tableName) => {
    if (!tableName) {
        console.error('Nombre de tabla no válido');
        return;
    }

    try {
        const response = await fetch(`/show?table=${tableName}`);
        const result = await response.json();
        console.log('Respuesta del backend:', result);

        // Verificar si la respuesta contiene `tableData` con estructura válida
        if (!result.tableData || !Array.isArray(result.tableData.data)) {
            console.error('Estructura de datos inválida recibida del backend.');
            return;
        }

        // Guardar el objeto completo del backend en `tableDatos`
        tableDatos = result.tableData;

        if (tableDatos.data.length === 0) {
            tableDatos.data = [{ mensaje: 'No se encontraron datos' }];
            console.log('Tabla vacía, asignando mensaje predeterminado');
        }

        // Reiniciar índice y renderizar la tabla con `data`
        indice = 0;
        imprimirDatos(tableDatos.table, tableDatos.data,tableDatos.userRole);
    } catch (error) {
        console.error('Error al obtener los datos:', error);
    }
};




// Función para renderizar datos en la tabla 
const imprimirDatos = (tableName, data, userRole) => {
    if (!data.length) { return notificacionFront({ message: 'No hay coincidencias' }); }

    // Construcción de cabeceras
    console.log(tableName);

    const tableHeaders = Object.keys(data[0]).filter(key => key !== 'protectedId').map(key =>
        `<th style="position: sticky; top: 0; background-color: #fff; z-index: 2;">${key}</th>`).join('');
    const headerRow = `<tr>${tableHeaders}                            
                         <th style="position: sticky; top: 0; background-color: #fff; z-index: 2;">Acciones</th>
                       </tr>`;

    // Construcción de filas de datos
    const tableRows = data.slice(indice, indice + entradastoshow).map(row => {
        const rowData = Object.keys(row).filter(key => key !== 'protectedId').map(key => {
            if (key === 'Cliente') {
                return `<td>${generarBotonesProceso(row, userRole, 'Cliente')}</td>`;
            }
            if (key === 'Gestor') {
                return `<td>${generarBotonesProceso(row, userRole, 'Gestor')}</td>`;
            }
            return `<td>${row[key]}</td>`;
        }).join('');

        const accionesCell = `
            <td>
                <div style="display: flex;">
                    <button class="${row.protectedId} page-button action-edit" onclick="solicitarEdit(event)">Editar</button>
                    <button class="${row.protectedId} page-button action-delete" onclick="solicitarDelete(event)">Eliminar</button>
                </div>
            </td>`;
        return `<tr>${rowData}${accionesCell}</tr>`;
    }).join('');

    // Contenedor de la tabla
    const tableContainer = document.getElementById('tables-container');
    tableContainer.style.display = 'flex';
    tableContainer.innerHTML = `<table>
                                    <thead>${headerRow}</thead>
                                    <tbody>${tableRows}</tbody>
                                </table>`;
    // Controles adicionales
    actualizarControles(data, tableName);
};

// Función para generar botones según el rol y columna
const generarBotonesProceso = (row, userRole, column) => {
    if (column === 'Cliente') {
        if (userRole === 'Cliente') {
            return row.Gestor !== 'Completado'
                ? row.Cliente !== 'Pendiente'
                    ? `<p>${row.Cliente}</p>`
                    : `<label for="file-input-${row.protectedId}" class="page-button process">📥 Subir Foto</label>
                       <input class="${row.protectedId} hidden" id="file-input-${row.protectedId}" type="file" name="file" onchange="uploadImg(event)"/>`
                : `<button class="${row.protectedId} page-button process" onclick="confirmacionPago(event)">Confirmar</button>`;
        }
    } else if (column === 'Gestor') {
        if (userRole === 'Gestor' || userRole === 'Admin') {
            return row.Gestor === 'Completado'
                ? `<p>✔</p>`
                : `<button class="${row.protectedId} page-button process" onclick="confirmarGestor(event)">Gestor Done</button>`;
        }
    }
    return `<p>${row[column]}</p>`;
};



// Función para actualizar controles de navegación y filtrado
const actualizarControles = (data, tableName) => {
    const botonesFiltrado = `
        <div class="filtred-navigation">      
            <select id="filterKey" onchange="displaySelectedOption()">
                ${Object.keys(data[0]).slice(0, -1).map(key => `<option value="${key}">${key}</option>`).join('')}
            </select>
            <input type="text" id="filterValue" placeholder="🔍..buscar" oninput="debouncedFilter('${tableName}')">
            <button class="table-navigation" onclick="applyFilter('${tableName}')">Filtrar</button>                         
        </div>`;
    const botonesNavegacion = `
        <div class="navigation"> 
            <button class="table-navigation" onclick="cambiarPagina(-1, '${tableName}')">Anterior</button>
            <button class="table-navigation" onclick="cambiarPagina(1, '${tableName}')">Siguiente</button>
        </div>`;

    const tableContainer = document.getElementById('tables-container');
    const filter = document.querySelector('.filtred-navigation');
    const navigation = document.querySelector('.navigation');

    filter?.remove();
    navigation?.remove();

    tableContainer.insertAdjacentHTML('beforebegin', botonesFiltrado);
    tableContainer.insertAdjacentHTML('afterend', botonesNavegacion);
};

const displaySelectedOption = () => {
    const select = document.getElementById('filterKey');
    select.setAttribute('title', select.options[select.selectedIndex].text);
};

const cambiarPagina = (direccion, tableName) => {
    const nuevoIndice = indice + direccion * entradastoshow;
    if (nuevoIndice >= 0 && nuevoIndice < tableDatos.length) {
        indice = nuevoIndice;
        imprimirDatos(tableName, tableDatos);
    }
};

let debounceTimer;
const debouncedFilter = (tableName) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => applyFilter(tableName), 1000);
};

const applyFilter = (tableName) => {
    const filterKey = document.getElementById('filterKey').value;
    const filterValue = document.getElementById('filterValue').value.toLowerCase();
    const filteredData = filterValue
        ? tableDatos.filter(row => String(row[filterKey]).toLowerCase().includes(filterValue))
        : tableDatos;
    indice = 0;
    imprimirDatos(tableName, filteredData);
};

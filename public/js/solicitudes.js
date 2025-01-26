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
      // Llamar a `solicitarData` solo si `data.tableName` existe
    if(document.title=='Nbox Time-Backoffice'&& data.tableName){
      refreshBackoffice(data.tableName); 
    }   
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
    if (tableDatos.tableName == 'usuarios') lanzarModal('user-edit'); 
    else if (tableDatos.tableName == "pedidos") lanzarModal('consignment-edit'); 
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
    if (!file) {
        console.error('No se seleccionó ningún archivo');
        return;
    }

    const className = e.target.classList[0]; // Obtener la primera clase
    if (!className) {
        console.error('El elemento input no tiene clases definidas');
        return;
    }

    const formData = new FormData();
    const newFileName = className + file.name.substring(file.name.lastIndexOf('.'));
    formData.append('file', new File([file], newFileName)); // Renombrar archivo
    formData.append('id', className); // Agregar la clase como ID

    console.log('Datos que se envían al backend:');
    console.log('Nombre del archivo:', formData.get('file').name);
    console.log('ID:', formData.get('id'));

    solicitud('POST', 'upload', formData, null); // null para archivos
}




// ==============================================================================
// ================================ Métodos =====================================
// ==============================================================================


// funcion generica para hacer solicitudes GET, POST, PUT, PATCH y enviar notificacion
async function solicitud(method, ruta, objeto = null, contentType = 'application/json') {
    const options = {
        method,
        headers: contentType ? { 'Content-Type': contentType } : undefined,
        body: method !== 'GET' && objeto ? (contentType ? JSON.stringify(objeto) : objeto) : undefined // No incluir body en GET
    };

    try {
        const response = await fetch(`/${ruta}`, options);
        const responseType = response.headers.get('Content-Type');
        let data = null;

        // Procesar respuesta si es JSON
        if (responseType?.includes('application/json')) {
            data = await response.json();
            if (data.message) notificacionFront(data); // Notificación si hay mensaje
        } else {
            window.location.href = `/${ruta}`;
        }

        console.log('Datos obtenidos:', data);
        console.log('Objeto de respuesta:', response);

        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error; // Lanza el error para que pueda manejarse en el llamado
    }
}



//_________________________________MANEJO DE TABLA_____________________________________
// Variables globales
let tableDatos = [], indice = 0, entradastoshow = 10;

// Función para solicitar datos del backend
const solicitarData = async (tableName) => {

    try {
        const response = await fetch(`/show?table=${tableName}`);
        const result = await response.json();
        console.log('Respuesta del backend:', result);
        // Verificar si la respuesta contiene `tableData` con estructura válida
        if (result.data && !Array.isArray(result.data)) {
            result.message = 'Ocurrió un problema sin definir al procesar la solicitud.';
            notificacionFront(result);
        }
            
        // Guardar el objeto completo del backend en `tableDatos`
        tableDatos = result;      
     
    } catch (error) {
        console.error('Error al obtener los datos:', error);
    }
};


const estadistica = async (tableName) => {
    // Verificar si `tableDatos` está vacío o no tiene datos
    if (!tableDatos.data || tableDatos.data.length === 0) {
        await solicitarData(tableName);
    }

    if (tableName == 'pedidos'){
    const data = tableDatos.data;
    const totalEnviado = calcularTotalEnviado(data);
    const remesas = contarRemesas(data);
    const porcentajeCompletadas = calcularPorcentajeCompletadas(data);
    const distribucionPorTipo = calcularDistribucionPorTipo(data);
    const topClientes = calcularTopClientes(data);

    // Generar el contenido HTML
    smartCard(...totalEnviado,...remesas,...porcentajeCompletadas,...distribucionPorTipo,...topClientes );
    }else if (tableName == 'usuarios'){
        console.log('estadisticas usuarios');
    }
};


// Función para renderizar datos en la tabla 
const imprimirDatos = async (tableName = 'pedidos') => {
    
    const data = tableDatos.data;
    const userRole = tableDatos.userRole;
    if (!tableDatos.data ) notificacionFront(tableDatos);     
    if (tableDatos.data.length == 0 || !tableDatos.data){
        const table = document.getElementById('tablas');
        table.innerHTML = `<h4>Aquí aparecerá una tabla detallada con las operaciones que realices con nosotros. Por ahora no hay ${tableDatos.tableName} que mostrar 
                           <div id="tables-container" class=" tablas-dinamicas">`;
    } else {
        const tableHeaders = Object.keys(data[0]).filter(key => key !== 'protectedId').map(key =>
            `<th>${key}</th>`).join('');
        const headerRow = `<tr>${tableHeaders}<th>Acciones</th></tr>`;

        // Construcción de filas de datos
        const tableRows = data.slice(indice, indice + entradastoshow).map(row => {
            const rowData = Object.keys(row).filter(key => key !== 'protectedId').map(key => {
                if (key === 'Cliente')return `<td>${generarBotonesProceso(row, userRole, 'Cliente')}</td>`;                
                if (key === 'Gestor')return `<td>${generarBotonesProceso(row, userRole, 'Gestor')}</td>`;                
                return `<td>${row[key]}</td>`;
            }).join('');
            const accionesCell = `<td>
                                    <div style="display: flex;">
                                        <button class="${row.protectedId} page-button action-edit" onclick="solicitarEdit(event)">Editar</button>
                                        <button class="${row.protectedId} page-button action-delete" onclick="solicitarDelete(event)">Eliminar</button>
                                    </div>
                                </td>`;
            return `<tr>${rowData}${accionesCell}</tr>`;
        }).join('');   
    
    // Contenedor de la tabla
    const tableContainer = document.getElementById('tablas');
    tableContainer.innerHTML = `<div class="card-office-title">Historial de ${tableDatos.tableName}</div>
                                <div id="tables-container" class=" tablas-dinamicas">
                                    <table>
                                        <thead>${headerRow}</thead>
                                        <tbody>${tableRows}</tbody>
                                    </table>
                                </div> `;

     // Controles adicionales
     actualizarControles(data, tableName);
     estadistica(tableName); 
    }
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

// --------cambiar paginas-------
const cambiarPagina = (direccion, tableName) => {
    const nuevoIndice = indice + direccion * entradastoshow;

    if (nuevoIndice >= 0 && nuevoIndice < tableDatos.data.length) {
        indice = nuevoIndice; 
        imprimirDatos(tableName);
    } else {
        notificacionFront({ message: direccion > 0? 'No hay más datos para mostrar.': 'Estás en la primera página.', });
    }
};




// --------------- filtros -------------
const applyFilter = (tableName) => {
    const filterKey = document.getElementById('filterKey').value.trim();
    const filterValue = document.getElementById('filterValue').value.trim().toLowerCase();

    if (!filterKey || !filterValue) { notificacionFront({ message: 'Ingrese un valor válido para filtrar.' });
        return;
    }
    // Filtrar directamente en `tableDatos.data`
    const filteredData = tableDatos.data.filter(row =>
        String(row[filterKey]).toLowerCase().includes(filterValue)
    );

    if (filteredData.length === 0) { notificacionFront({ message: 'No hay coincidencias.' });
        return;
    }

    // Actualizar índice y mostrar datos filtrados
    indice = 0;
    const originalData = tableDatos.data;
    tableDatos.data = filteredData;
    imprimirDatos(tableName);
    tableDatos.data = originalData;
};


// ----------tiempo de demora-------
let debounceTimer;
const debouncedFilter = (tableName) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => applyFilter(tableName), 2000);
};

const refreshBackoffice = async (tableName) => {
    await solicitarData(tableName);
    if (!tableName.message){
    await imprimirDatos(tableName);
    await estadistica(tableName);}
}
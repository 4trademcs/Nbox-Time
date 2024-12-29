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
        data.tableName === 'usuarios' ? solicitarData('show-users') : solicitarData('show-consignment');}
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
    if (idActual.includes("Boxess")) lanzarModal('user-edit'); 
    else if (idActual.includes("Pedido")) lanzarModal('consignment-edit'); 
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

// Obtener JSON del servidor 
const solicitarData = async (id) => {
    const tableName = id === 'show-users' ? 'usuarios' : id === 'show-consignment' ? 'pedidos' : null;
    if (!tableName) return console.error('ID no válido');

    try {
        const response = await fetch(`/show?table=${tableName}`);
        const data = await response.json();
        if (data.message) return notificacionFront(data);

        tableDatos = data.length ? data : [];
        indice = 0;
        imprimirDatos(tableName, tableDatos.length ? tableDatos : [{ mensaje: 'No se encontraron datos' }]);
    } catch (error) {
        console.error('Error al obtener los datos:', error);
    }
};

// Imprimir los datos en la tabla
const imprimirDatos = (tableName, data) => {
    // Si no hay datos, muestra una notificación y termina la función
    !data.length ? notificacionFront({ message: 'no hay coincidencias' }) : (() => {
            const [tableHeaders, tableRows] = [ Object.keys(data[0]).map(key => `<th>${key}</th>`).join(''),data.slice(indice, indice + entradastoshow).map(row =>
                    `<tr>${Object.values(row).map(val => `<td>${val}</td>`).join('')}</tr>`).join('')];

            const buttonsFilter = `
                <div class="filtred-navigation">      
                    <select id="filterKey" onchange="displaySelectedOption()">
                        ${Object.keys(data[0]).slice(0, -1).map(key => `<option value="${key}">${key}</option>`).join('')}
                    </select>
                    <input type="text" id="filterValue" placeholder="🔍..buscar" oninput="debouncedFilter('${tableName}')">
                    <button class="table-navigation" onclick="applyFilter('${tableName}')">Filtrar</button>                         
                </div>`;

            const buttonsNav = 
                `<div class="navigation"> 
                    <button class="table-navigation" onclick="cambiarPagina(-1, '${tableName}')">Anterior</button>
                    <button class="table-navigation" onclick="cambiarPagina(1, '${tableName}')">Siguiente</button>
                </div> `;

            const tableContainer = document.getElementById(`tables-container`);
            tableContainer.style.display = 'flex';
            tableContainer.innerHTML = `<table><tr>${tableHeaders}</tr>${tableRows}</table>`;
            const filter = document.querySelector('.filtred-navigation');
            const navigation = document.querySelector('.navigation');
            filter ? (filter.remove(), tableContainer.insertAdjacentHTML('beforebegin', buttonsFilter)) : tableContainer.insertAdjacentHTML('beforebegin', buttonsFilter);
            navigation ? (navigation.remove(), tableContainer.insertAdjacentHTML('afterend', buttonsNav)) : tableContainer.insertAdjacentHTML('afterend', buttonsNav);
        })(); // Función autoejecutable
};


// Mostrar la opción seleccionada en el select
const displaySelectedOption = () => {
    const select = document.getElementById('filterKey');
    select.setAttribute('title', select.options[select.selectedIndex].text); // Mostrar la opción seleccionada
};

// Cambiar de página
const cambiarPagina = (direccion, tableName) => {
    const nuevoIndice = indice + direccion * entradastoshow;
    if (nuevoIndice >= 0 && nuevoIndice < tableDatos.length) {
        indice = nuevoIndice;
        imprimirDatos(tableName, tableDatos);
    }
};

// Filtro de búsqueda con retardo
let debounceTimer;
const debouncedFilter = (tableName) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => applyFilter(tableName), 1000);
};

// Aplicar el filtro de búsqueda
const applyFilter = (tableName) => {
    const filterKey = document.getElementById('filterKey').value;
    const filterValue = document.getElementById('filterValue').value.toLowerCase();
    
    // Mostrar todos los datos si el campo de búsqueda está vacío
    const filteredData = filterValue ? tableDatos.filter(row => String(row[filterKey]).toLowerCase().includes(filterValue)) : tableDatos;    indice = 0;
    imprimirDatos(tableName, filteredData);
};
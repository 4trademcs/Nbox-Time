
// ======================================== Variables Globales ========================================
class Usuario {
    constructor(nombre = '', telefono = '', direccion = '', email = '', pass = '', patrocinador = '', rol = 'Cliente', bono = '0', id = '', carnet = '') {
        this.nombre = nombre;
        this.telefono = telefono;
        this.direccion = direccion;
        this.email = email;
        this.pass = pass;
        this.patrocinador = patrocinador;
        this.rol = rol;
        this.bono = bono;
        this.id = id;
        this.carnet =carnet;
    }
}

class Pedido {
    constructor(nombre = '', titular = '', telefono = '', direccion = '', tipo, tarjeta = '', id = '', monto = '', idCliente = '', Cliente = 'Pendiente', Gestor = 'Pendiente', Estado = 'Pendiente') {
        this.nombre = nombre;
        this.titular = titular;
        this.telefono = telefono;
        this.tipo = tipo;
        this.direccion = direccion;
        this.tarjeta = tarjeta;
        this.id = id;
        this.monto = monto;
        this.idCliente = idCliente;
        this.Cliente = Cliente; 
        this.Gestor = Gestor;  
        this.Estado = Estado; 
    }
}

// +===================================== Manejo de usuarios =====================================+
function guardarPersona() {

    const persona = new Usuario;
    // Asignar valores a las propiedades del objeto persona
    persona.nombre = document.forms['contact']['contact-name'].value;
    persona.email = document.forms['contact']['contact-email'].value;
    persona.pass = document.forms['contact']['contact-pass'].value;
    persona.telefono = document.forms['contact']['contact-tel'].value;
    persona.direccion = document.forms['contact']['contact-direction'].value;
    persona.carnet = document.forms['contact']['contact-dni'].value;
    persona.rol = "Cliente";

     // Asignar valor al campo dinámico si existe
    persona.patrocinador = document.forms['contact']['contact-sponsor'].value !== "Patrocinador" ?
                           document.forms['contact']['contact-sponsor'].value :
                           document.forms['contact']['contact-bono'].value    
    persona.bono = '0';
   
    //verificar si se trata de editar a un usuario
    if (action == 'editar') {
        persona.id = idActual;  
        console.log(`enviar a backend: `,JSON.stringify(persona));          
        solicitud('PUT','edit', persona);
        eliminarHTML("form-container");      
    } 
    
    //verificar si se trata de ingresar nuevo usuario valido
    else { 
        console.log(`enviar a backend: `,JSON.stringify(persona));           
        solicitud('POST','sign', persona);
        eliminarHTML("form-container");      
    }  
 
} 


// ================================= Manejo de remesa ===============================
function guardarRemesa() {

    const remesa = new Pedido;
    remesa.nombre = document.forms['remesa']['remesa-name'].value;
    remesa.titular = document.forms['remesa']['remesa-owner'].value;
    remesa.telefono = document.forms['remesa']['remesa-tel'].value;
    remesa.monto = document.forms['remesa']['remesa-monto'].value;
    remesa.tipo = document.forms['remesa']['remesa-type'].value;


    // Asignar valores a los campos dinámicos
    const directionField = document.getElementById('remesa-direction');
    const cardField = document.getElementById('remesa-card');
    if (directionField)  remesa.direccion = directionField.value; 
    if (cardField)  remesa.tarjeta = cardField.value;
   

    //verificar si se trata de editar a un pedido
    if (action == 'editar') {
        remesa.id = idActual;  
        console.log(`enviar a backend: `,JSON.stringify(remesa));          
        solicitud('PUT','edit', remesa);
        eliminarHTML("form-container");     
    } 
    
    //verificar si se trata de ingresar nuevo pedido valido
    else { 
        console.log(`enviar a backend: `,JSON.stringify(remesa));           
        solicitud('POST','sign', remesa);
        eliminarHTML("form-container");      
    }    
}

// ======================== Manejo del Login ==============================
function sendLogin(event) {
        event.preventDefault();
    
        // Validar los campos del formulario
        const isValid = validateStep("slide-page", "email", "password", "confirmPassword"/*, "name"*/);
        if (!isValid) {
            console.log("Validación fallida. Verifica los campos.");
            return; // Detener la ejecución si la validación falla
        }
    
        // Crear el objeto login solo si la validación es exitosa
        const login = {
            nombre: document.getElementById('login-name').value,
            pass: document.getElementById('login-pass').value,
            email: document.getElementById('login-email').value,
        };
    
        console.log("Datos a enviar:", login);
    
        // Llamar a la función para enviar los datos
        solicitud('POST', 'login', login);
    };
    

// ======================== Manejo de solicitudes de forms(logout) ==============================
const form=document.querySelector('.form-get');
    if(form){
    form.addEventListener('submit',async(event)=>{
        event.preventDefault();
        console.log(event.target.method);
        console.log(event.target.classList[1])
        solicitud(event.target.method,event.target.classList[1]);
    });}

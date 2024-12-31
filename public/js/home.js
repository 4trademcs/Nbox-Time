document.addEventListener('DOMContentLoaded', () => {

    // Verificar si 'darkMode' existe en localStorage al cargar
    localStorage.getItem('darkMode') === null ? localStorage.setItem('darkMode', 'false'):
    localStorage.getItem('darkMode') === 'true' && document.body.classList.add('dark-mode');

    // Escuchar el evento click en el botón para Toggle del modo oscuro
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    darkModeToggle.addEventListener('click', () => {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        localStorage.setItem('darkMode', !isDarkMode ? 'true' : 'false');    
        document.body.classList.toggle('dark-mode', !isDarkMode);
    });

// ------------------------- Home menu ----------------------------
        
    const menu = document.getElementById('menu');
    const show = document.getElementById('show-users');
    const background = document.getElementById('tuto-capa');
    const tables = document.getElementById('tables-container');
    const logo = document.querySelector('.logo.flexbox');
    const services = document.querySelectorAll('.services');
    const aside = document.querySelector('.aside');    
    const banner = document.querySelector('.banner.index');

    // Menu toggle
    menuToggle.addEventListener('click', (event) => {
        event.stopPropagation();
        menu.classList.toggle('hidden');
        background.classList.toggle('capa');
        aside.classList.toggle('scroll-x');
        menuToggle.querySelector('.icon').textContent = menu.classList.contains('hidden') ? '☰' : '✕';
    });

    // Cerrar menú al hacer clic fuera de él
    document.addEventListener('click', (event) => {
        if (!menu.contains(event.target) && !menuToggle.contains(event.target)) {
            menu.classList.add('hidden');
            background.classList.contains('capa')?background.classList.remove('capa'):null;
            aside.classList.add('scroll-x');
            menuToggle.querySelector('.icon').textContent = '☰';
        }
    });
    //Abrir y Cerrar menu lateral aside
    logo.addEventListener('click', (event) => {
        event.stopPropagation();
        aside.classList.toggle('scroll-x');
        background.classList.toggle('capa');        
    });

    //desplegar servicios
    services.forEach(service => {
        service.addEventListener('click', (event) => {
            event.stopPropagation();            
            document.querySelectorAll('.services-content').forEach(content => {
                content.classList.toggle('hidden');
            });
        });
    });

    // Mostrar tabla de usuarios
    if(show){
    show.addEventListener('click', () => {
        tables.style.display = 'table';
        menu.classList.add('hidden');
        menuToggle.querySelector('.icon').textContent = '☰';
    });}

     //mostrar banner
        document.getElementById('modal-form').addEventListener('click', (event) => {
        banner.style.setProperty('--trigger','running');
    });
    
}); 

// // ---------------------rotacion de iluminacion----------------------
 const animateOnView = (() => {
     let anim;
     const animate = (angle = 0) => {
       document.getElementById('nbox-rotate').style.setProperty('--rotation', `${angle}deg`);
       anim = requestAnimationFrame(() => animate((angle + .3) % 360));
     };
     return new IntersectionObserver(
       ([entry]) => entry.isIntersecting 
         ? !anim && animate() 
         : (cancelAnimationFrame(anim), anim = null)
     ).observe(document.getElementById('nbox-rotate'));
   })();
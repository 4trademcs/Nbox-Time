document.addEventListener('DOMContentLoaded', () => {
    // Verificar si 'darkMode' existe en localStorage al cargar
    localStorage.getItem('darkMode') === null ? localStorage.setItem('darkMode', 'false'):
    localStorage.getItem('darkMode') === 'true' && document.body.classList.add('dark-mode');

    //mostrar banner despues de unos segundos
    switch(document.title) {
        case 'Nbox Time-Backoffice':
            setTimeout(() => {document.querySelector('.banner').style.position='relative'},6000);  
            break;
        case 'Nbox Time':
            const modalLoader = document.getElementById('modal-form');
            modalLoader ? modalLoader.addEventListener('click', (event) => {
                document.querySelector('.banner.index').style.setProperty('--trigger','running');
                setTimeout(() => {document.querySelector('.banner').style.position='relative'},6500);         
                }):null;
            break;    
    }    
});
// ------------------------- Home menu ----------------------------     
const menu = document.getElementById('menu');
const background = document.getElementById('tuto-capa');
const logo = document.querySelector('.logo.flexbox');
const aside = document.querySelector('.aside');    

// Abrir todos los Menus
const showMenu=() => {   
    menu.classList.toggle('hidden'); //abre menu mobile
    background.classList.toggle('capa');
    aside.classList.toggle('scroll-x'); //abre menu pc
    menuToggle.querySelector('.icon').textContent = menu.classList.contains('hidden') ? '☰' : '✕';
};

// Cerrar menú al hacer clic fuera de él
const closeMenu = () => {        
    menu.classList.add('hidden');
    background.classList.contains('capa')?background.classList.remove('capa'):null;
    aside.classList.add('scroll-x');
    menuToggle.querySelector('.icon').textContent = '☰';        
};

//desplegar servicios
const showServices=()=>{
    document.querySelectorAll('.services-content').forEach(content => {
        content.classList.toggle('hidden');
    });
};
    
//Togglear modo oscuro    
  const darkModeToggle = () => {
      const isDarkMode = localStorage.getItem('darkMode') === 'true';
      localStorage.setItem('darkMode', !isDarkMode ? 'true' : 'false');    
      document.body.classList.toggle('dark-mode', !isDarkMode);
};
// control de los sliders
// const slider = (id,direction)=> {   
//     const slider = document.getElementById(id); 
//     const number =  slider.style.getPropertyValue(--itemsNumber);
//     direction =="foward" ? number++ : number--;
//     if(number >= 10) number = 1;
//     const element = document.getElementById(`slide-pos${number}`);
//     element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });   


// control de los sliders
let currentSlideIndex = 0; // Variable global para gestionar el índice actual
const slider = (id, direction) => {
    const sliderContainer = document.getElementById(id);
    const slides = sliderContainer.querySelectorAll('.slider-static img');
    const navLinks = sliderContainer.querySelectorAll('.nav-link');

    // Calcular el nuevo índice según la dirección
    if (direction === "forward") currentSlideIndex = (currentSlideIndex + 1) % slides.length;
    else if (direction === "backward")  currentSlideIndex = (currentSlideIndex - 1 + slides.length) % slides.length;
    
    console.log(currentSlideIndex)
    // Desplazarse al nuevo slide
    const element = slides[currentSlideIndex];
    element.scrollIntoView({behavior: 'smooth', block: 'center', inline: 'center'});
    // Actualizar los indicadores visuales
    navLinks.forEach((link, index) => {link.classList.toggle('active', index === currentSlideIndex);});
};

const focused = (event) => {
    const clickedLink = event.currentTarget;
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    clickedLink.classList.add('active');
};
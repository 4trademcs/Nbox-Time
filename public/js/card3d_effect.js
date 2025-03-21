window.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.card-3d');    
    // Valores ajustados en px
    [SHADOW_MAX_OFFSET,BORDER_MAX_SIZE,ROTATION_MAX,SCALE_MAX] =[15,9,30,1.2];
    const scale = (val, inMin, inMax, outMin, outMax)=> { return outMin + (val - inMin) * (outMax - outMin) / (inMax - inMin); }

    const Move = (card, reflection, chip, clientX, clientY)=> {
        const cardRect = card.getBoundingClientRect();
        const cardCenterX = cardRect.left + cardRect.width / 2;
        const cardCenterY = cardRect.top + cardRect.height / 2;
        const percentX = (clientX - cardCenterX) / (cardRect.width / 2);
        const percentY = (clientY - cardCenterY) / (cardRect.height / 2);

        // Calcular rotación 
        const rotateX = Math.round(Math.max(-ROTATION_MAX, Math.min(ROTATION_MAX, percentY * 30))); 
        const rotateY = Math.round(Math.max(-ROTATION_MAX, Math.min(ROTATION_MAX, -percentX * 30)));
        // Calcular sombra 
        const shadowOffsetX = Math.round((rotateY / ROTATION_MAX) * SHADOW_MAX_OFFSET);
        const shadowOffsetY = Math.round((rotateX / ROTATION_MAX) * SHADOW_MAX_OFFSET);
        // Calcular bordes 
        const absX = Math.abs(percentX);
        const absY = Math.abs(percentY);
        const borderSizeX = Math.round(Math.min(BORDER_MAX_SIZE, absX * BORDER_MAX_SIZE));
        const borderSizeY = Math.round(Math.min(BORDER_MAX_SIZE, absY * BORDER_MAX_SIZE));
        // Calcular reflexión
        const relX = (clientX - cardRect.left) / cardRect.width;
        const relY = (clientY - cardRect.top) / cardRect.height;
        const lightX = Math.round(scale(relX, 0, 1, 150, -50));
        const lightY = Math.round(scale(relY, 0, 1, 30, -100));
        const lightOpacity = Math.round(scale(Math.min(Math.max(relY, 0.3), 0.7), 0.3, 1, 1, 0) * 255);
        const lightShade = `rgba(${lightOpacity}, ${lightOpacity}, ${lightOpacity}, 1)`;
        const lightShadeBlack = `rgba(0, 0, 0, 1)`;
        reflection.style.backgroundImage = `radial-gradient(circle at ${lightX}% ${lightY}%, ${lightShade} 50%, ${lightShadeBlack})`;
        reflection.style.opacity = '1';
        // Aplicar estilos dinámicos
        card.classList.remove('animated');
        card.classList.add('active');
        card.style.setProperty('--rotateX', `${rotateX}deg`);
        card.style.setProperty('--rotateY', `${rotateY}deg`);
        card.style.setProperty('--shadowOffsetX', `${shadowOffsetX}px`);
        card.style.setProperty('--shadowOffsetY', `${shadowOffsetY}px`);
        card.style.setProperty('--scale', SCALE_MAX);        
        // Aplicar bordes dinámicos
        card.classList.add('border');
        (absX > absY) 
            ? // Movimiento horizontal            
            (card.style.setProperty('--borderTop', '0'),
            card.style.setProperty('--borderBottom', '0'),
            card.style.setProperty('--borderLeft', percentX < 0 ? `${borderSizeX}px` : '0'),
            card.style.setProperty('--borderRight', percentX > 0 ? `${borderSizeX}px` : '0'))
            :// Movimiento vertical            
            (card.style.setProperty('--borderLeft', '0'),
            card.style.setProperty('--borderRight', '0'),
            card.style.setProperty('--borderTop', percentY < 0 ? `${borderSizeY}px` : '0'),
            card.style.setProperty('--borderBottom', percentY > 0 ? `${borderSizeY}px` : '0'));       
        //Efectos luminosidad del chip
        if (chip) chip.style.backgroundImage = `linear-gradient(140deg, rgba(${lightOpacity}, ${lightOpacity}, ${lightOpacity}, .6) 10%, ${lightShade} 50%, rgba(${lightOpacity}, ${lightOpacity}, ${lightOpacity}, 0.3))`;        
    }

    const Interaction = (event, card, reflection, chip)=> {
        const clientX = event.touches ? event.touches[0].clientX : event.clientX;
        const clientY = event.touches ? event.touches[0].clientY : event.clientY;
        Move(card, reflection, chip, clientX, clientY);
    }

    const Leave = (card, reflection, chip)=> {
        card.classList.remove('active','border');
        reflection.style.opacity = '0';
        if (chip) { chip.style.backgroundImage = ''; }
        setTimeout(() => { card.classList.add('animated')}, 400); 
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const card = entry.target;
                const chipElement = card.querySelector('.chip');
                const reflection = card.querySelector('.reflection');
                card.addEventListener('touchstart', (event) => { event.preventDefault(); }, { passive: false });
                card.addEventListener('mousemove', (event) => Interaction(event, card, reflection, chipElement));
                card.addEventListener('touchmove', (event) => { event.preventDefault(); Interaction(event, card, reflection, chipElement); }, { passive: false });
                card.addEventListener('mouseleave', () => Leave(card, reflection, chipElement));
                card.addEventListener('touchend', () => Leave(card, reflection, chipElement));
            }
        });
    }, { threshold: 0.1 });

    cards.forEach((card) => {
        card.insertAdjacentHTML('afterbegin', '<div class="reflection"></div>');
        observer.observe(card);
    });
});

const rotateCard = (event)=> {
    document.querySelectorAll('.rotate-card-box.active').forEach(e=>e.classList.remove('active'));
    const card = event.target.closest('.rotate-card-box');
    card.classList.add('active');    
    document.addEventListener('click',(event)=>{
        card.contains(event.target) ? null : card.classList.remove('active') ;
    });
    setTimeout(() => { card.classList.remove('active') },7000);
}
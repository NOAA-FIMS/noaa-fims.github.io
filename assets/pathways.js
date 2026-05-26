document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Interactive Pathway Pills ---
    const pathwayPills = document.querySelectorAll('.fims-pill');
    pathwayPills.forEach(pill => {
        pill.addEventListener('click', (e) => {
            e.preventDefault(); 
            pathwayPills.forEach(el => el.classList.remove('is-active'));
            pill.classList.add('is-active');
        });
    });

    // --- 2. Interactive Timeline Logic ---
    const timelineItems = document.querySelectorAll('.fims-timeline-item');
    if (timelineItems.length > 0 && !document.querySelector('.fims-timeline-item.is-active')) {
        timelineItems[0].classList.add('is-active');
    }

    timelineItems.forEach(item => {
        item.addEventListener('click', () => {
            timelineItems.forEach(el => el.classList.remove('is-active'));
            item.classList.add('is-active');
        });
    });

    // --- 3. Horizontal Scroll Dragging ---
    const scrollContainer = document.querySelector('.fims-horizontal-scroll');
    if (scrollContainer) {
        let isDown = false;
        let startX;
        let scrollLeft;

        scrollContainer.addEventListener('mousedown', (e) => {
            isDown = true;
            scrollContainer.style.scrollSnapType = 'none'; 
            startX = e.pageX - scrollContainer.offsetLeft;
            scrollLeft = scrollContainer.scrollLeft;
        });

        scrollContainer.addEventListener('mouseleave', () => {
            isDown = false;
            scrollContainer.style.scrollSnapType = 'x mandatory'; 
        });

        scrollContainer.addEventListener('mouseup', () => {
            isDown = false;
            scrollContainer.style.scrollSnapType = 'x mandatory'; 
        });

        scrollContainer.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - scrollContainer.offsetLeft;
            const walk = (x - startX) * 2; 
            scrollContainer.scrollLeft = scrollLeft - walk;
        });
    }
});
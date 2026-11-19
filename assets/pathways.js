document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Interactive Timeline Logic ---
    const timelineItems = document.querySelectorAll('.fims-timeline-item');

    function setActiveItem(targetItem) {
        timelineItems.forEach(el => {
            const isActive = el === targetItem;
            el.classList.toggle('is-active', isActive);
            el.setAttribute('aria-expanded', isActive ? 'true' : 'false');
        });
    }

    if (timelineItems.length > 0) {
        timelineItems.forEach((item, idx) => {
            item.setAttribute('role', 'button');
            item.setAttribute('tabindex', '0');

            const heading = item.querySelector('h4');
            if (heading) {
                if (!heading.id) {
                    heading.id = `fims-step-heading-${idx}`;
                }
                item.setAttribute('aria-labelledby', heading.id);
            }

            const isActive = item.classList.contains('is-active');
            item.setAttribute('aria-expanded', isActive ? 'true' : 'false');

            item.addEventListener('click', (e) => {
                // If a link/button within the active card was clicked, let it navigate normally
                if (e.target.closest('a, button')) {
                    return;
                }
                setActiveItem(item);
            });

            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    if (e.target.closest('a, button')) {
                        return;
                    }
                    e.preventDefault();
                    setActiveItem(item);
                }
            });
        });

        if (!document.querySelector('.fims-timeline-item.is-active')) {
            setActiveItem(timelineItems[0]);
        }
    }

    // --- 2. Horizontal Scroll Dragging ---
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
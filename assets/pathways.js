document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Interactive Timeline Logic ---
    const timelineItems = document.querySelectorAll('.fims-timeline-item');

    function setActiveItem(targetItem) {
        timelineItems.forEach(el => {
            const isActive = el === targetItem;
            el.classList.toggle('is-active', isActive);
            const toggle = el.querySelector('.fims-step-toggle');
            if (toggle) {
                toggle.setAttribute('aria-expanded', isActive ? 'true' : 'false');
            }
        });
    }

    if (timelineItems.length > 0) {
        timelineItems.forEach((item, idx) => {
            const heading = item.querySelector('h4');
            const content = item.querySelector('.fims-step-content');
            const contentId = `fims-step-content-${idx}`;

            if (content && !content.id) {
                content.id = contentId;
            }

            if (heading) {
                // Prevent Quarto's AnchorJS from injecting anchor links into timeline step headings
                heading.classList.remove('anchored');

                const isActive = item.classList.contains('is-active');
                const toggleBtn = document.createElement('button');
                toggleBtn.type = 'button';
                toggleBtn.className = 'fims-step-toggle';
                toggleBtn.setAttribute('aria-expanded', isActive ? 'true' : 'false');
                if (content) {
                    toggleBtn.setAttribute('aria-controls', content.id);
                }

                // Move all children except any anchor links into toggleBtn
                const children = Array.from(heading.childNodes);
                children.forEach(child => {
                    if (child.nodeType === Node.ELEMENT_NODE && (child.tagName === 'A' || child.classList.contains('anchorjs-link'))) {
                        return;
                    }
                    toggleBtn.appendChild(child);
                });

                // Find anchor link if already present to preserve it outside the button
                const existingAnchor = heading.querySelector('a.anchorjs-link, a');
                heading.innerHTML = '';
                heading.appendChild(toggleBtn);
                if (existingAnchor) {
                    heading.appendChild(existingAnchor);
                }

                // If AnchorJS runs later, watch for and relocate any newly added anchor links outside toggleBtn
                const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        mutation.addedNodes.forEach((node) => {
                            if (node.nodeType === Node.ELEMENT_NODE && (node.tagName === 'A' || node.classList.contains('anchorjs-link'))) {
                                heading.appendChild(node);
                            }
                        });
                    });
                });
                observer.observe(toggleBtn, { childList: true });

                toggleBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    setActiveItem(item);
                });
            }

            item.addEventListener('click', (e) => {
                if (e.target.closest('a, button')) {
                    return;
                }
                setActiveItem(item);
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
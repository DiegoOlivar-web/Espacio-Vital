tailwind.config = {
    theme: {
        extend: {
            colors: {
                slate900: '#0f172a',
                charcoal: '#181f2a',
                darkgray: '#1e293b',
                carddark: '#243044',
                gold: {
                    400: '#facc15',
                    500: '#eab308',
                    600: '#ca8a04',
                    accent: '#d4af37',
                    light: '#fef08a'
                }
            },
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'sans-serif'],
                serif: ['Cinzel', 'serif']
            }
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const container = document.querySelector(".map-container");

    if (container) {
        container.addEventListener("mouseenter", () => {
            container.classList.add("active");
        });
        container.addEventListener("mouseleave", () => {
            container.classList.remove("active");
        });
    }
});
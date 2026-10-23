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
        // Al pasar el mouse por encima del contenedor
        container.addEventListener("mouseenter", () => {
            container.classList.add("active");
        });

        // Al retirar el mouse del contenedor
        container.addEventListener("mouseleave", () => {
            container.classList.remove("active");
        });
    }
});
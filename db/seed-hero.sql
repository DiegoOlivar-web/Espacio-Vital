-- Seed inicial del Hero Slider
BEGIN;

INSERT INTO hero_slides(orden, imagen_url, eyebrow, titulo, parrafo, boton_texto, boton_href, activo)
VALUES
(
    1,
    'https://lh3.googleusercontent.com/d/1Jcvb1ujR265ljrUSFVZHFerWMNfkvUJg',
    'Bienestar en tu equipo',
    'MASAJES PARA EMPRESAS',
    'Bienestar para tu equipo: masajes en silla ergonómica o camilla. Elige la cantidad de personas y solicita una cotización personalizada.',
    '💬 COTIZAR AHORA',
    'https://wa.me/51932200162?text=Hola%20Espacio%20Vital%2C%20quisiera%20cotizar%20masajes%20para%20mi%20empresa.',
    TRUE
),
(
    2,
    'https://lh3.googleusercontent.com/d/1mOa8Sr6T5lwNNrPGAvXJjX2kKFWwskO-',
    'Comodidad en tu hogar',
    'MASAJES A DOMICILIO',
    'Nosotros llevamos lo necesario para tu sesión. Tú solo dedícate a relajarte en casa con atención personalizada.',
    'VER MÁS →',
    'domicilio.html',
    TRUE
),
(
    3,
    'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1900&q=88',
    'Vuelve a sentirte bien',
    'BIENESTAR QUE SE SIENTE',
    'Encuentra tu momento de calma con nuestra selección de masajes, reflexología, terapia física y bienestar integral.',
    'EXPLORAR SERVICIOS →',
    'servicios.html',
    TRUE
);

COMMIT;

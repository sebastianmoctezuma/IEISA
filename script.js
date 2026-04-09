/* =============================================================
   PEGAR AQUI EL LINK DE TU EXCEL (CSV)
   ============================================================= */
const ID_SHEET = "https://docs.google.com/spreadsheets/d/10dH5ZUcnn3RKgPI0eG42U0QTawXOPWR9AI-77ZSoJWo/export?format=csv&gid=0";
// Este truco agrega un número aleatorio al final para obligar a actualizar el caché
const URL_DE_TU_EXCEL = ID_SHEET + "&cache=" + Date.now();

let todosLosProductos = []; 

// ==========================================
// 1. CARGA DEL CATÁLOGO DESDE EXCEL
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const contenedorProductos = document.getElementById('productos-container');
    const contenedorFiltros = document.getElementById('filtros-container');

    Papa.parse(URL_DE_TU_EXCEL, {
        download: true,
        header: true,
        skipEmptyLines: true,
        transformHeader: function(h) { return h.trim().replace(/^\ufeff/, ""); },
        complete: function(resultados) {
            todosLosProductos = resultados.data;
            
            // 1. Crear Filtros (Restringido a tus 3 categorías)
            crearFiltros(contenedorFiltros);
            
            // 2. Mostrar la primera categoría por defecto (Fuego y gas)
            mostrarProductos("Fuego y gas");
        },
        error: function(err) {
            console.error("Error CSV:", err);
            contenedorProductos.innerHTML = '<p>Error al cargar el catálogo.</p>';
        }
    });

    /* --- CREAR BOTONES DE FILTRO (SOLO 3) --- */
    function crearFiltros(contenedor) {
        contenedor.innerHTML = ''; 
        // Categorías estrictas según tu solicitud
        const categoriasFijas = ["Fuego y gas", "Humo", "Analizadores"];

        categoriasFijas.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'btn-filter'; 
            btn.textContent = cat;
            
            // Que el primero empiece activo
            if(cat === "Fuego y gas") btn.classList.add('active');

            btn.addEventListener('click', () => {
                // Quitar activo a los demás
                document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                mostrarProductos(cat);
            });

            contenedor.appendChild(btn);
        });
    }

    /* --- MOSTRAR PRODUCTOS EN LA PÁGINA --- */
    function mostrarProductos(filtro) {
        contenedorProductos.innerHTML = '';

        const filtrados = todosLosProductos.filter(p => {
            const cat = p.Categoria ? p.Categoria.trim().toLowerCase() : "";
            return cat === filtro.toLowerCase();
        });

        if (filtrados.length === 0) {
            contenedorProductos.innerHTML = '<p>No hay productos en esta categoría por el momento.</p>';
            return;
        }

        filtrados.forEach(producto => {
            const titulo = producto.Titulo || producto.titulo || ''; 
            const precio = producto.Precio || producto.precio || 'Consultar'; 
            const desc = producto.Descripcion || producto.descripcion || ''; 
            const imgRaw = producto.Imagen || producto.imagen || ''; 
            const link = producto.Link || producto.link || '#contacto';

            if(titulo) {
                // Lógica para procesar la imagen de Drive o Web
                let imagenSrc = 'https://via.placeholder.com/300?text=Sin+Imagen';
                if (imgRaw) {
                    if (imgRaw.includes('drive.google.com')) {
                        try {
                            const idArchivo = imgRaw.split('/d/')[1].split('/')[0];
                            imagenSrc = `https://drive.google.com/thumbnail?id=${idArchivo}&sz=w400`;
                        } catch (e) {}
                    } else {
                        imagenSrc = imgRaw;
                    }
                }

                const tarjeta = document.createElement('div');
                tarjeta.classList.add('product-card');
                tarjeta.style.animation = "fadeIn 0.5s";

                tarjeta.innerHTML = `
                    <img src="${imagenSrc}" alt="${titulo}" class="product-img">
                    <div class="product-info">
                        <h3 class="product-title">${titulo}</h3>
                        <p class="product-desc">${desc}</p>
                        <span class="product-price">${precio}</span>
                        <a href="${link}" target="_blank" class="btn-buy">
                            Ver Detalle <i class="fas fa-external-link-alt"></i>
                        </a>
                    </div>
                `;
                contenedorProductos.appendChild(tarjeta);
            }
        });
    }
});

// Estilo de animación para las tarjetas
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
`;
document.head.appendChild(styleSheet);


/* =============================================================
   2. CEREBRO DEL CHATBOT IEISA - VERSION FINAL
   ============================================================= */

// Diccionario de sinónimos
const INTENCIONES = {
    saludo: ['hola', 'buenos', 'buenas', 'que tal', 'hey', 'inicio', 'comenzar'],
    menu: ['menu', 'volver', 'regresar', 'opciones', 'atras', 'principal'], // <--- NUEVA OPCIÓN PARA REGRESAR
    ubicacion: ['donde', 'ubicacion', 'direccion', 'mapa', 'calle', 'local', 'ciudad', 'pais', 'lugar', 'encuentran'],
    contacto: ['telefono', 'celular', 'correo', 'email', 'llamar', 'whatsapp', 'contacto', 'hablar', 'asesor', 'humano'],
    servicios: ['servicios', 'hacen', 'dedican', 'ofrecen', 'mantenimiento', 'instalacion', 'construccion', 'ingenieria'],
    catalogo: ['catalogo', 'productos', 'venden', 'lista', 'inventario', 'ver', 'muestrame', 'que tienes'],
    horario: ['horario', 'hora', 'abierto', 'abren', 'cierran', 'dias', 'cuando'],
    cotizacion: ['cotizar', 'cotizacion', 'precio', 'presupuesto', 'costo', 'comprar']
};

function toggleChat() {
    const chat = document.getElementById('chat-widget');
    const btn = document.getElementById('chat-toggle-btn');
    if (chat.style.display === 'flex') {
        chat.style.display = 'none';
        btn.style.display = 'block';
    } else {
        chat.style.display = 'flex';
        btn.style.display = 'none';
        document.getElementById('chat-input').focus();
    }
}

function handleKeyPress(e) { if (e.key === 'Enter') sendMessage(); }

function procesarOpcion(opcion) {
    let texto = "";
    if(opcion === 'catalogo') texto = "catalogo";
    else if(opcion === 'ubicacion') texto = "donde estan";
    else if(opcion === 'contacto') texto = "contacto";
    else if(opcion === 'cotizacion' || opcion.includes('WhatsApp')) {
        // ABRIR WHATSAPP AUTOMÁTICAMENTE PARA COTIZACIÓN
        window.open('https://wa.me/528331234567?text=Hola,%20me%20gustar%C3%ADa%20solicitar%20una%20cotizaci%C3%B3n.', '_blank');
        return;
    }
    else if(opcion.includes('Menú Principal')) {
        // SI LE PICAN A REGRESAR, MANDAMOS LA PALABRA "MENU" AL BOT
        texto = "menu";
    }
    else texto = opcion; 

    document.getElementById('chat-input').value = texto;
    sendMessage();
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (msg === "") return;

    agregarMensaje(msg, 'user-message');
    input.value = '';

    const loadingId = mostrarEscribiendo();

    setTimeout(() => {
        eliminarMensaje(loadingId);
        responderBot(msg);
    }, 600); 
}

function responderBot(mensajeUsuario) {
    const msg = mensajeUsuario.toLowerCase();
    
    // Detectar intención general
    let intencionDetectada = null;
    for (const [intencion, palabras] of Object.entries(INTENCIONES)) {
        if (palabras.some(p => msg.includes(p))) {
            intencionDetectada = intencion;
            break;
        }
    }

    // --- RESPUESTAS PRE-PROGRAMADAS ---

    // SI ES SALUDO O SI EL USUARIO PIDE REGRESAR AL MENÚ
    if (intencionDetectada === 'saludo' || intencionDetectada === 'menu') {
        const msj = intencionDetectada === 'menu' ? "Aquí tienes las opciones principales: 👇" : "¡Hola! Soy el asistente de IEISA. ⚡<br>¿En qué te puedo ayudar hoy?";
        agregarMensaje(msj, 'bot-message');
        mostrarOpciones(['📦 Catálogo', '📝 Cotización', '📍 Ubicación', '📞 Contacto']);
        return;
    }

    if (intencionDetectada === 'ubicacion') {
        agregarMensaje("📍 Estamos en <b>Ciudad Madero, Tamaulipas</b>. Atendemos proyectos en toda la república.", 'bot-message');
        agregarMensaje("<a href='#contacto' onclick='toggleChat()' style='color:#0056b3; font-weight:bold;'>Click aquí para ver el mapa</a>", 'bot-message');
        mostrarOpciones(['🏠 Menú Principal']); // <--- Botón de regreso agregado
        return;
    }

    if (intencionDetectada === 'contacto') {
        agregarMensaje("Aquí tienes nuestros datos directos:<br>📞 <b>Oficina:</b> +52 (833) 123-4567<br>📧 <b>Email:</b> contacto@ieisacv.com.mx", 'bot-message');
        mostrarOpciones(['💬 Hablar por WhatsApp', '🏠 Menú Principal']); // <--- Botón de regreso agregado
        return;
    }

    if (intencionDetectada === 'cotizacion') {
        agregarMensaje("Con gusto preparamos tu presupuesto. Haz clic abajo para enviarnos un WhatsApp directo.", 'bot-message');
        mostrarOpciones(['📝 Cotización', '🏠 Menú Principal']); // <--- Botón de regreso agregado
        return;
    }

    if (intencionDetectada === 'servicios') {
        agregarMensaje("IEISA se especializa en:<br>• Proyectos de Alta Tensión<br>• Mantenimiento Industrial<br>• Pruebas y Mediciones", 'bot-message');
        mostrarOpciones(['🏠 Menú Principal']); // <--- Botón de regreso agregado
        return;
    }

    if (intencionDetectada === 'catalogo') {
        agregarMensaje(`📦 Actualmente contamos con estos equipos:`, 'bot-message');
        mostrarOpciones(["Fuego y gas", "Humo", "Analizadores", "🏠 Menú Principal"]); // <--- Botón de regreso agregado
        return;
    }

    // --- BÚSQUEDA INTELIGENTE DE PRODUCTOS ---
    if (typeof Fuse !== 'undefined') {
        const opcionesFuse = {
            includeScore: true,
            keys: [
                { name: 'Titulo', weight: 0.5 },
                { name: 'Categoria', weight: 0.3 },
                { name: 'Descripcion', weight: 0.2 }
            ],
            threshold: 0.4,
            ignoreLocation: true
        };

        const fuse = new Fuse(todosLosProductos, opcionesFuse);
        const resultadosFuse = fuse.search(mensajeUsuario);
        const productosEncontrados = resultadosFuse.map(resultado => resultado.item);

        if (productosEncontrados.length > 0) {
            let intro = `Encontré <b>${productosEncontrados.length}</b> coincidencias para "${mensajeUsuario}":`;
            agregarMensaje(intro, 'bot-message');
            
            productosEncontrados.slice(0, 3).forEach(crearTarjetaChat);

            if (productosEncontrados.length > 3) {
                agregarMensaje(`<small>...y otros ${productosEncontrados.length - 3} más.</small>`, 'bot-message');
            }
            // Agregamos opción de regresar después de buscar productos
            mostrarOpciones(['🏠 Menú Principal']);
        } else {
            agregarMensaje("No encontré nada parecido en el catálogo. 🤔 ¿Podrías intentar con otra palabra o contactar a un asesor?", 'bot-message');
            mostrarOpciones(['📦 Catálogo', '💬 Hablar por WhatsApp', '🏠 Menú Principal']);
        }
    } else {
        const resultados = todosLosProductos.filter(p => {
            const textoBusqueda = (p.Titulo + " " + p.Descripcion + " " + p.Categoria).toLowerCase();
            return textoBusqueda.includes(msg);
        });

        if (resultados.length > 0) {
            let intro = `Encontré <b>${resultados.length}</b> productos relacionados con "${mensajeUsuario}":`;
            agregarMensaje(intro, 'bot-message');
            resultados.slice(0, 3).forEach(crearTarjetaChat);
            if (resultados.length > 3) {
                agregarMensaje(`<small>...y otros ${resultados.length - 3} más.</small>`, 'bot-message');
            }
            mostrarOpciones(['🏠 Menú Principal']);
        } else {
            agregarMensaje("No encontré información exacta sobre eso. 🤔 ¿Podrías intentar con otra palabra o contactarnos directo?", 'bot-message');
            mostrarOpciones(['📦 Catálogo', '💬 Hablar por WhatsApp', '🏠 Menú Principal']);
        }
    }
}

// ==========================================
// 3. UTILIDADES VISUALES DEL CHAT
// ==========================================
function agregarMensaje(texto, clase, id = null) {
    const container = document.getElementById('chat-messages');
    
    const opcionesViejas = document.getElementById('chat-options');
    if(opcionesViejas) opcionesViejas.remove();

    const div = document.createElement('div');
    div.className = `message ${clase}`;
    if(id) div.id = id;
    div.innerHTML = texto;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function mostrarOpciones(listaOpciones) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = 'chat-options';
    div.id = 'chat-options';

    listaOpciones.forEach(op => {
        const btn = document.createElement('button');
        btn.textContent = op;
        btn.onclick = () => procesarOpcion(op);
        div.appendChild(btn);
    });
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function crearTarjetaChat(producto) {
    let img = 'https://via.placeholder.com/50';
    if(producto.Imagen && producto.Imagen.includes('drive')) {
            try { img = `https://drive.google.com/thumbnail?id=${producto.Imagen.split('/d/')[1].split('/')[0]}&sz=w100`; } catch(e){}
    } else if (producto.Imagen) { img = producto.Imagen; }

    const linkDestino = producto.Link || '#contacto';

    const html = `
        <div class="chat-product-img">
            <img src="${img}" style="width:100%; height:100%; object-fit:cover; border-radius:5px;">
        </div>
        <div class="chat-product-info">
            <div>${producto.Titulo}</div>
            <span class="chat-product-price">${producto.Precio || 'Consultar'}</span>
            <a href="${linkDestino}" target="_blank" class="chat-whatsapp-link" style="background:var(--secondary-color);">
                Ver Detalle <i class="fas fa-external-link-alt"></i>
            </a>
        </div>
    `;
    
    const div = document.createElement('div');
    div.className = 'chat-product-card';
    div.innerHTML = html;
    document.getElementById('chat-messages').appendChild(div);
}

function mostrarEscribiendo() {
    const id = 'loading-' + Date.now();
    agregarMensaje('<i class="fas fa-ellipsis-h fa-fade"></i>', 'bot-message', id);
    return id;
}

function eliminarMensaje(id) {
    const el = document.getElementById(id);
    if(el) el.remove();
}
// Interacciones del frontend.
// La ubicación se usa durante la búsqueda y no se guarda.
let mapaActual = null;
let marcadorUbicacion = null;
let circuloPrecision = null;
let marcadoresRestaurantes = null;
let idSeguimiento = null;
let relojUbicacion = null;
let mejorPrecision = Infinity;
let ultimaPosicion = null;
let restaurantesActuales = [];
let restauranteSeleccionado = null;

const CLAVE_RESENAS = "sabor-resena-resenas";

document.addEventListener("DOMContentLoaded", () => {
  configurarMenu();
  configurarMostrarContrasena();
  configurarInicioSesion();
  configurarRegistro();
  configurarRecuperacion();
  configurarUbicacion();
  configurarDireccionManual();
  configurarResenas();
});

function configurarMenu() {
  const boton = document.querySelector("#boton-menu");
  const menu = document.querySelector("#menu-principal");

  if (!boton || !menu) return;

  boton.addEventListener("click", () => {
    const menuAbierto = menu.classList.toggle("abierto");
    boton.setAttribute("aria-expanded", String(menuAbierto));
  });

  menu.querySelectorAll("a").forEach((enlace) => {
    enlace.addEventListener("click", () => {
      menu.classList.remove("abierto");
      boton.setAttribute("aria-expanded", "false");
    });
  });
}

function configurarMostrarContrasena() {
  document.querySelectorAll(".boton-contrasena").forEach((boton) => {
    boton.addEventListener("click", () => {
      const campo = document.querySelector(`#${boton.dataset.campo}`);
      if (!campo) return;

      const sePuedeLeer = campo.type === "text";
      campo.type = sePuedeLeer ? "password" : "text";
      boton.textContent = sePuedeLeer ? "👁" : "🙈";
      boton.setAttribute("aria-label", sePuedeLeer ? "Mostrar contraseña" : "Ocultar contraseña");
    });
  });
}

function configurarInicioSesion() {
  const formulario = document.querySelector("#formulario-inicio-sesion");
  const mensaje = document.querySelector("#mensaje-inicio-sesion");

  if (!formulario || !mensaje) return;

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    mensaje.textContent = "Vista previa: el acceso se conectará en una fase posterior.";
  });
}

function configurarRegistro() {
  const formulario = document.querySelector("#formulario-registro");
  const mensaje = document.querySelector("#mensaje-registro");
  const contrasena = document.querySelector("#contrasena-registro");
  const confirmarContrasena = document.querySelector("#confirmar-contrasena");

  if (!formulario || !mensaje || !contrasena || !confirmarContrasena) return;

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();

    if (contrasena.value !== confirmarContrasena.value) {
      mensaje.textContent = "Las contraseñas no coinciden.";
      return;
    }

    mensaje.textContent = "Vista previa: el registro se conectará en una fase posterior.";
  });
}

function configurarRecuperacion() {
  const enlace = document.querySelector("#enlace-contrasena-olvidada");
  const mensaje = document.querySelector("#mensaje-inicio-sesion");

  if (!enlace || !mensaje) return;

  enlace.addEventListener("click", () => {
    mensaje.textContent = "La recuperación de contraseña se agregará con el sistema de cuentas.";
  });
}

function configurarUbicacion() {
  const boton = document.querySelector("#boton-ubicacion");
  const mensaje = document.querySelector("#mensaje-ubicacion");
  const zona = document.querySelector("#zona-ubicacion");
  const precision = document.querySelector("#precision-ubicacion");
  const coordenadas = document.querySelector("#coordenadas-ubicacion");
  const direccion = document.querySelector("#direccion-ubicacion");
  const lista = document.querySelector("#lista-restaurantes");

  if (!boton || !mensaje || !zona || !precision || !coordenadas || !direccion || !lista) return;

  lista.addEventListener("click", (evento) => {
    const botonDetalle = evento.target.closest("[data-restaurante-id]");
    if (!botonDetalle) return;

    const restaurante = restaurantesActuales.find(
      (elemento) => elemento.id === botonDetalle.dataset.restauranteId
    );

    if (restaurante) mostrarDetalle(restaurante);
  });

  boton.addEventListener("click", () => {
    if (!navigator.geolocation) {
      mensaje.textContent = "Este navegador no permite obtener la ubicación.";
      return;
    }

    detenerSeguimiento();
    mejorPrecision = Infinity;
    ultimaPosicion = null;
    restaurantesActuales = [];
    boton.disabled = true;
    boton.textContent = "Buscando ubicación...";
    mensaje.textContent = "Buscando la señal más precisa. Puede tardar unos segundos.";
    zona.hidden = false;
    ocultarDetalle();
    lista.innerHTML = "<h3>Restaurantes cercanos</h3><p class=\"cargando-restaurantes\">Esperando una ubicación más precisa...</p>";

    idSeguimiento = navigator.geolocation.watchPosition(
      (posicion) => recibirPosicion(posicion, boton, mensaje, precision, coordenadas, direccion, lista),
      (error) => mostrarErrorUbicacion(error, boton, mensaje),
      { enableHighAccuracy: true, timeout: 60000, maximumAge: 0 }
    );

    relojUbicacion = setTimeout(() => finalizarUbicacion(boton, mensaje, precision, coordenadas, direccion, lista), 15000);
  });
}

function configurarDireccionManual() {
  const boton = document.querySelector("#boton-direccion-manual");
  const campo = document.querySelector("#direccion-manual");
  const mensaje = document.querySelector("#mensaje-direccion-manual");
  const zona = document.querySelector("#zona-ubicacion");
  const precision = document.querySelector("#precision-ubicacion");
  const coordenadas = document.querySelector("#coordenadas-ubicacion");
  const direccion = document.querySelector("#direccion-ubicacion");
  const lista = document.querySelector("#lista-restaurantes");

  if (!boton || !campo || !mensaje || !zona || !precision || !coordenadas || !direccion || !lista) return;

  boton.addEventListener("click", () => {
    const texto = campo.value.trim();

    if (!texto) {
      mensaje.textContent = "Escribe una dirección antes de buscar.";
      return;
    }

    boton.disabled = true;
    mensaje.textContent = "Buscando esa dirección...";

    const consulta = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(texto)}`;

    fetch(consulta, { headers: { Accept: "application/json" } })
      .then((respuesta) => {
        if (!respuesta.ok) throw new Error("No se encontró la dirección");
        return respuesta.json();
      })
      .then((lugares) => {
        if (!lugares.length) throw new Error("No se encontró la dirección");

        const lugar = lugares[0];
        const latitud = Number(lugar.lat);
        const longitud = Number(lugar.lon);
        const posicion = { coords: { latitude: latitud, longitude: longitud, accuracy: 30 } };

        detenerSeguimiento();
        ultimaPosicion = posicion;
        mejorPrecision = 30;
        zona.hidden = false;
        actualizarMapa(posicion, precision, coordenadas);
        precision.textContent = "Ubicación seleccionada desde la dirección escrita";
        coordenadas.textContent = `Coordenadas: ${latitud.toFixed(6)}, ${longitud.toFixed(6)}`;
        direccion.textContent = `Dirección encontrada: ${lugar.display_name || texto}`;
        mensaje.textContent = "Usando la dirección seleccionada. Revisa el punto en el mapa.";
        buscarRestaurantes(latitud, longitud, lista);
      })
      .catch(() => {
        mensaje.textContent = "No encontramos esa dirección. Agrega ciudad y país.";
      })
      .finally(() => {
        boton.disabled = false;
      });
  });
}

function configurarResenas() {
  const formulario = document.querySelector("#formulario-resena");
  const mensaje = document.querySelector("#mensaje-resena");

  if (!formulario || !mensaje) return;

  formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();

    if (!restauranteSeleccionado) {
      mensaje.textContent = "Primero selecciona un restaurante.";
      return;
    }

    const datos = new FormData(formulario);
    const nuevaResena = {
      idRestaurante: restauranteSeleccionado.id,
      nombre: datos.get("nombre").trim(),
      calificacion: Number(datos.get("calificacion")),
      comentario: datos.get("comentario").trim(),
      fecha: new Date().toISOString()
    };

    const resenas = leerResenas();
    resenas.push(nuevaResena);
    guardarResenas(resenas);
    formulario.reset();
    mensaje.textContent = "Reseña guardada en este navegador.";
    mostrarResenas(restauranteSeleccionado.id);
  });
}

function recibirPosicion(posicion, boton, mensaje, precision, coordenadas, direccion, lista) {
  const exactitud = posicion.coords.accuracy;

  if (exactitud >= mejorPrecision) return;

  mejorPrecision = exactitud;
  ultimaPosicion = posicion;
  actualizarMapa(posicion, precision, coordenadas);
  mensaje.textContent = `Señal encontrada. Buscando una ubicación mejor... (${Math.round(exactitud)} metros de margen)`;

  if (exactitud <= 30) {
    finalizarUbicacion(boton, mensaje, precision, coordenadas, direccion, lista);
  }
}

function finalizarUbicacion(boton, mensaje, precision, coordenadas, direccion, lista) {
  if (!ultimaPosicion) {
    mostrarErrorUbicacion({ code: 3 }, boton, mensaje);
    return;
  }

  if (ultimaPosicion.coords.accuracy > 300) {
    detenerSeguimiento();
    boton.disabled = false;
    boton.textContent = "📍 Intentar de nuevo";
    mensaje.textContent = "La ubicación no es suficientemente precisa. Activa la ubicación precisa o usa el mapa manualmente.";
    return;
  }

  detenerSeguimiento();
  boton.disabled = false;
  boton.textContent = "📍 Actualizar mi ubicación";
  consultarDireccion(ultimaPosicion.coords.latitude, ultimaPosicion.coords.longitude, direccion);

  const exactitud = Math.round(ultimaPosicion.coords.accuracy);
  precision.textContent = `Margen aproximado: ${exactitud} metros`;
  coordenadas.textContent = `Coordenadas: ${ultimaPosicion.coords.latitude.toFixed(6)}, ${ultimaPosicion.coords.longitude.toFixed(6)}`;
  direccion.textContent = "Dirección aproximada: consultando...";
  mensaje.textContent = exactitud <= 50
    ? "Ubicación obtenida con buena precisión."
    : exactitud <= 200
      ? "Ubicación obtenida con precisión aproximada."
      : "La señal no es muy precisa. Activa el GPS o prueba desde otro lugar.";

  buscarRestaurantes(ultimaPosicion.coords.latitude, ultimaPosicion.coords.longitude, lista);
}

function detenerSeguimiento() {
  if (idSeguimiento !== null) {
    navigator.geolocation.clearWatch(idSeguimiento);
    idSeguimiento = null;
  }

  if (relojUbicacion !== null) {
    clearTimeout(relojUbicacion);
    relojUbicacion = null;
  }
}

function actualizarMapa(posicion, precision, coordenadas) {
  const latitud = posicion.coords.latitude;
  const longitud = posicion.coords.longitude;
  const exactitud = posicion.coords.accuracy;

  if (!mapaActual) {
    mapaActual = L.map("mapa").setView([latitud, longitud], calcularZoom(exactitud));

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; Colaboradores de OpenStreetMap"
    }).addTo(mapaActual);

    marcadoresRestaurantes = L.layerGroup().addTo(mapaActual);
    marcadorUbicacion = L.marker([latitud, longitud])
      .addTo(mapaActual)
      .bindPopup("Tu ubicación actual");

    circuloPrecision = L.circle([latitud, longitud], {
      radius: exactitud,
      color: "#2f6f68",
      fillColor: "#63a49b",
      fillOpacity: 0.2,
      weight: 2
    }).addTo(mapaActual);
  } else {
    mapaActual.setView([latitud, longitud], calcularZoom(exactitud));
    marcadorUbicacion.setLatLng([latitud, longitud]);
    circuloPrecision.setLatLng([latitud, longitud]);
    circuloPrecision.setRadius(exactitud);
  }

  precision.textContent = `Buscando mejor señal... ${Math.round(exactitud)} metros de margen`;
  coordenadas.textContent = `Coordenadas: ${latitud.toFixed(6)}, ${longitud.toFixed(6)}`;
  mapaActual.invalidateSize();
}

function calcularZoom(exactitud) {
  if (exactitud <= 50) return 17;
  if (exactitud <= 150) return 16;
  return 15;
}

function mostrarErrorUbicacion(error, boton, mensaje) {
  detenerSeguimiento();
  boton.disabled = false;
  boton.textContent = "📍 Intentar de nuevo";

  if (error.code === 1) {
    mensaje.textContent = "No se concedió permiso para usar la ubicación.";
  } else if (error.code === 2) {
    mensaje.textContent = "No fue posible encontrar tu ubicación.";
  } else {
    mensaje.textContent = "No se obtuvo una señal a tiempo. Intenta de nuevo.";
  }
}

function consultarDireccion(latitud, longitud, elemento) {
  const direccion = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitud}&lon=${longitud}&zoom=18&addressdetails=1`;

  fetch(direccion, { headers: { Accept: "application/json" } })
    .then((respuesta) => {
      if (!respuesta.ok) throw new Error("No se pudo consultar la dirección");
      return respuesta.json();
    })
    .then((datos) => {
      elemento.textContent = `Dirección aproximada: ${datos.display_name || "Dirección no disponible"}`;
    })
    .catch(() => {
      elemento.textContent = "Dirección aproximada: Dirección no disponible";
    });
}

function buscarRestaurantes(latitud, longitud, lista) {
  const consulta = `[out:json][timeout:25];nwr[amenity~"restaurant|fast_food|cafe|bar"](around:3000,${latitud},${longitud});out center tags;`;
  const direccion = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(consulta)}`;

  fetch(direccion)
    .then((respuesta) => {
      if (!respuesta.ok) throw new Error("No se pudo consultar el listado");
      return respuesta.json();
    })
    .then((datos) => mostrarRestaurantes(datos.elements, latitud, longitud, lista))
    .catch(() => {
      lista.innerHTML = "<h3>Restaurantes cercanos</h3><p class=\"cargando-restaurantes\">No se pudo cargar el listado. Intenta nuevamente.</p>";
    });
}

function mostrarRestaurantes(lugares, latitud, longitud, lista) {
  const lugaresUnicos = filtrarRestaurantesDuplicados(lugares);

  restaurantesActuales = lugaresUnicos
    .map((lugar) => {
      const datos = lugar.tags || {};
      const lugarLatitud = lugar.lat ?? lugar.center?.lat;
      const lugarLongitud = lugar.lon ?? lugar.center?.lon;

      return {
        id: construirIdentificadorLugar(lugar, datos),
        nombre: datos.name || "Restaurante sin nombre",
        direccion: construirDireccion(datos),
        horario: formatearHorario(datos.opening_hours),
        categoria: datos.cuisine || datos.amenity || "Lugar de comida",
        sitioWeb: datos.website || datos["contact:website"] || "",
        latitud: lugarLatitud,
        longitud: lugarLongitud,
        distancia: calcularDistancia(latitud, longitud, lugarLatitud, lugarLongitud)
      };
    })
    .filter((restaurante) => Number.isFinite(restaurante.latitud) && Number.isFinite(restaurante.longitud))
    .filter((restaurante) => restaurante.distancia <= 3)
    .sort((a, b) => a.distancia - b.distancia)
    .slice(0, 20)
    .filter((restaurante, indice, lista) => lista.findIndex((otro) => otro.id === restaurante.id) === indice);

  lista.innerHTML = "<h3>Restaurantes cercanos</h3>";

  if (restaurantesActuales.length === 0) {
    lista.innerHTML += "<p class=\"cargando-restaurantes\">No encontramos restaurantes en un radio de 3 kilómetros.</p>";
    return;
  }

  mostrarMarcadoresRestaurantes(restaurantesActuales);

  restaurantesActuales.forEach((restaurante) => {
    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta-restaurante";
    tarjeta.innerHTML = construirTarjeta(restaurante);
    lista.appendChild(tarjeta);
  });
}

function filtrarRestaurantesDuplicados(lugares) {
  const lugaresUnicos = [];

  lugares.forEach((lugar) => {
    const datos = lugar.tags || {};
    const nombre = normalizarNombre(datos.name || "Restaurante sin nombre");
    const latitud = lugar.lat ?? lugar.center?.lat;
    const longitud = lugar.lon ?? lugar.center?.lon;

    if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) return;

    const repetido = lugaresUnicos.some((guardado) => {
      const datosGuardados = guardado.tags || {};
      const nombreGuardado = normalizarNombre(datosGuardados.name || "Restaurante sin nombre");
      const latitudGuardada = guardado.lat ?? guardado.center?.lat;
      const longitudGuardada = guardado.lon ?? guardado.center?.lon;

      return nombre && nombre === nombreGuardado
        && calcularDistancia(latitud, longitud, latitudGuardada, longitudGuardada) < 0.12;
    });

    if (!repetido) lugaresUnicos.push(lugar);
  });

  return lugaresUnicos;
}

function normalizarNombre(nombre) {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function construirIdentificadorLugar(lugar, datos) {
  const nombre = normalizarNombre(datos.name || "sin-nombre");
  const latitud = lugar.lat ?? lugar.center?.lat;
  const longitud = lugar.lon ?? lugar.center?.lon;
  return `${nombre}-${Number(latitud).toFixed(5)}-${Number(longitud).toFixed(5)}`;
}

function mostrarMarcadoresRestaurantes(restaurantes) {
  if (!marcadoresRestaurantes) return;

  marcadoresRestaurantes.clearLayers();

  restaurantes.forEach((restaurante) => {
    L.marker([restaurante.latitud, restaurante.longitud])
      .bindPopup(`<strong>${escaparTexto(restaurante.nombre)}</strong><br>${formatearDistancia(restaurante.distancia)}`)
      .addTo(marcadoresRestaurantes);
  });
}

function construirTarjeta(restaurante) {
  return `
    <div class="contenido-tarjeta-restaurante">
      <p class="categoria-restaurante">${escaparTexto(restaurante.categoria)}</p>
      <h4>${escaparTexto(restaurante.nombre)}</h4>
      <p>${escaparTexto(restaurante.direccion)}</p>
      <p><strong>Horario:</strong> ${escaparTexto(restaurante.horario)}</p>
      <p>Aproximadamente a ${formatearDistancia(restaurante.distancia)}</p>
      <button class="boton boton-secundario boton-detalle" type="button" data-restaurante-id="${escaparAtributo(restaurante.id)}">Ver restaurante</button>
    </div>
  `;
}

function mostrarDetalle(restaurante) {
  restauranteSeleccionado = restaurante;
  const detalle = document.querySelector("#detalle-restaurante");
  const contenido = document.querySelector("#contenido-detalle");

  if (!detalle || !contenido) return;

  const enlaceMapa = `https://www.openstreetmap.org/?mlat=${restaurante.latitud}&mlon=${restaurante.longitud}#map=18/${restaurante.latitud}/${restaurante.longitud}`;
  const sitioWeb = restaurante.sitioWeb
    ? `<a class="enlace-mapa" href="${escaparAtributo(restaurante.sitioWeb)}" target="_blank" rel="noopener">Visitar sitio web</a>`
    : "";

  contenido.innerHTML = `
    <div class="encabezado-detalle">
      <div>
        <p class="categoria-restaurante">${escaparTexto(restaurante.categoria)}</p>
        <h3 id="titulo-detalle">${escaparTexto(restaurante.nombre)}</h3>
        <p>${escaparTexto(restaurante.direccion)}</p>
        <p><strong>Horario:</strong> ${escaparTexto(restaurante.horario)}</p>
        <p>Aproximadamente a ${formatearDistancia(restaurante.distancia)}</p>
        <div class="enlaces-detalle">
          <a class="enlace-mapa" href="${enlaceMapa}" target="_blank" rel="noopener">Abrir en OpenStreetMap</a>
          ${sitioWeb}
        </div>
      </div>
    </div>
  `;

  detalle.hidden = false;
  mostrarResenas(restaurante.id);
  detalle.scrollIntoView({ behavior: "smooth", block: "start" });
}

function ocultarDetalle() {
  const detalle = document.querySelector("#detalle-restaurante");
  if (detalle) detalle.hidden = true;
  restauranteSeleccionado = null;
}

function mostrarResenas(idRestaurante) {
  const lista = document.querySelector("#lista-resenas");
  if (!lista) return;

  const resenas = leerResenas().filter((resena) => resena.idRestaurante === idRestaurante);
  lista.innerHTML = "";

  if (resenas.length === 0) {
    lista.innerHTML = "<p class=\"cargando-restaurantes\">Todavía no hay reseñas. Sé la primera persona en escribir una.</p>";
    return;
  }

  resenas.slice().reverse().forEach((resena) => {
    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta-resena";
    tarjeta.innerHTML = `
      <div class="encabezado-resena">
        <strong>${escaparTexto(resena.nombre)}</strong>
        <span class="estrellas-resena" aria-label="${resena.calificacion} de 5 estrellas">${"★".repeat(resena.calificacion)}${"☆".repeat(5 - resena.calificacion)}</span>
      </div>
      <p>${escaparTexto(resena.comentario)}</p>
      <small>${formatearFecha(resena.fecha)}</small>
    `;
    lista.appendChild(tarjeta);
  });
}

function leerResenas() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_RESENAS)) || [];
  } catch (error) {
    return [];
  }
}

function guardarResenas(resenas) {
  localStorage.setItem(CLAVE_RESENAS, JSON.stringify(resenas));
}

function formatearFecha(fecha) {
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(new Date(fecha));
}

function construirDireccion(datos) {
  const partes = [
    [datos["addr:street"], datos["addr:housenumber"]].filter(Boolean).join(" "),
    datos["addr:suburb"],
    datos["addr:city"] || datos["addr:town"] || datos["addr:village"]
  ].filter(Boolean);

  return partes.join(", ") || datos["addr:full"] || datos["addr:place"] || "Dirección no disponible";
}

function formatearHorario(horario) {
  if (!horario) return "Horario no disponible";
  return horario.replace(/Mo-Fr/g, "Lun-Vie").replace(/Sa/g, "Sáb").replace(/Su/g, "Dom").replace(/PH/g, "festivos");
}

function calcularDistancia(latitudUno, longitudUno, latitudDos, longitudDos) {
  const radioTierra = 6371;
  const diferenciaLatitud = gradosARadianes(latitudDos - latitudUno);
  const diferenciaLongitud = gradosARadianes(longitudDos - longitudUno);
  const calculo = Math.sin(diferenciaLatitud / 2) ** 2 + Math.cos(gradosARadianes(latitudUno)) * Math.cos(gradosARadianes(latitudDos)) * Math.sin(diferenciaLongitud / 2) ** 2;
  return radioTierra * 2 * Math.atan2(Math.sqrt(calculo), Math.sqrt(1 - calculo));
}

function gradosARadianes(grados) {
  return grados * Math.PI / 180;
}

function formatearDistancia(distancia) {
  return distancia < 1 ? `${Math.round(distancia * 1000)} metros` : `${distancia.toFixed(1)} kilómetros`;
}

function escaparTexto(texto) {
  const elemento = document.createElement("div");
  elemento.textContent = texto;
  return elemento.innerHTML;
}

function escaparAtributo(texto) {
  return escaparTexto(texto).replace(/`/g, "&#96;");
}

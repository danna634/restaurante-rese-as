SABOR & RESEÑA — FRONTEND

Proyecto frontend escrito con HTML, CSS y JavaScript básico.
No usa Python, Flask, PostgreSQL, Node.js ni cuentas reales.

PARA VERLO

1. Abre esta carpeta en Visual Studio Code.
2. Inicia Live Server sobre index.html.

También puedes usar un servidor local:

python3 -m http.server 4173

Abre después:

http://127.0.0.1:4173/index.html

FUNCIONES

- Página de inicio y menú adaptable.
- Registro e inicio de sesión visuales.
- Mapa pequeño con Leaflet y OpenStreetMap.
- Búsqueda de restaurantes cercanos mediante Overpass.
- Tarjetas con nombre, categoría, dirección, horario y distancia.
- Detalle individual del restaurante.
- Reseñas guardadas solamente en el navegador.
- Búsqueda manual de una ubicación mediante OpenStreetMap.

LIMITACIONES IMPORTANTES

La ubicación automática depende de la señal entregada por el navegador y el dispositivo.
Un computador puede entregar una ubicación aproximada basada en Wi-Fi o red, no una posición GPS exacta.
Si la posición automática es incorrecta, se puede escribir una ubicación manual y revisar el punto en el mapa.

La dirección automática es aproximada y no se presenta como verificada.
OpenStreetMap puede no tener horarios completos o actualizados para todos los lugares.
Cuando falta un horario, se muestra "Horario no disponible".

Los restaurantes repetidos se agrupan por nombre normalizado y cercanía aproximada.
Esto reduce duplicados que OpenStreetMap puede devolver como punto y área del mismo lugar.

La búsqueda manual no guarda la dirección escrita en archivos ni en localStorage.

Las reseñas son una demostración local. Solo se ven en el mismo navegador y dispositivo.
No se copian reseñas de Google ni de otras plataformas.

ARCHIVOS

- index.html: página principal, ubicación, mapa, restaurantes y reseñas.
- registro.html: pantalla visual de creación de cuenta.
- css/estilos.css: diseño, colores y adaptación móvil.
- js/principal.js: interacciones, ubicación, mapa, restaurantes y reseñas locales.

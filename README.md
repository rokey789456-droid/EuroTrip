# Portal del viaje

Sitio estático para organizar un viaje de 3 personas con cronograma, reservas descargables, gastos y notas.

## Cómo editar el viaje

1. Abre `data.json`.
2. Cambia título, fechas, destino, personas, cronograma, reservas, checklist y contactos.
3. Sube tus PDF a la carpeta `reservas/`.
4. Asegúrate de que cada archivo mencionado en `data.json` exista en esa carpeta.

## Cómo publicarlo en GitHub Pages

1. Crea un repositorio en GitHub, por ejemplo `portal-viaje`.
2. Sube estos archivos al repositorio.
3. En GitHub: Settings → Pages.
4. En Source selecciona `Deploy from a branch`.
5. En Branch selecciona `main` y carpeta `/root`.
6. Guarda y abre la URL que GitHub te muestre.

## Privacidad

GitHub Pages publica un sitio web estático. No subas reservas reales con pasaportes, teléfonos, direcciones, códigos QR, números de reserva o datos personales si el sitio será público.

## Notas técnicas

- Los gastos y notas personales se guardan en el navegador con `localStorage`.
- No hay base de datos ni login.
- Para compartir datos en tiempo real entre personas haría falta un backend, por ejemplo Firebase o Supabase.

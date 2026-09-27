# Guion del video (≤ 3 min)

Graba la pantalla del teléfono o del navegador en modo móvil. Una toma por bloque; lo que va entre comillas es la narración.

| Tiempo | Pantalla | Qué decir |
|---|---|---|
| 0:00–0:20 | Landing `sepuente.vercel.app`, baja al comprobante de ejemplo | "Si una wallet de Stellar quiere ofrecer pesos mexicanos, hoy tiene que integrar la API de cada banco o proveedor. SEPuente es un anchor abierto y sin custodia: convierte SPEI en el estándar SEP-24 de Stellar, así cualquier wallet lo usa con una sola integración." |
| 0:20–0:35 | Baja al extracto de `stellar.toml` con los puntajes | "Implementa SEP-1, 10, 24 y 38, y pasa 75 de 76 pruebas de la suite oficial de SDF contra producción." |
| 0:35–1:05 | `/demo` → **Con mi correo** → escribe tu correo → **Enviar código** → pega el código | "Para probarlo no hace falta instalar nada. Entro con mi correo: Pollar me manda un código, crea mi wallet de Stellar y paga las comisiones de red." |
| 1:05–1:25 | **Activar pesos digitales** → **Conectar mi wallet** | "Activo el token de pesos, TMXN, uno a uno con el peso, y me conecto al anchor firmando un reto SEP-10. SEPuente nunca ve mi llave." |
| 1:25–2:00 | **Depositar** → `250` → **Ver cotización** → **Confirmar** → **Simular SPEI recibido** → toca **Ver en stellar.expert** | "Deposito 250 pesos. El anchor cotiza con 0.5 % de comisión y me da la CLABE y la referencia. El SPEI es simulado en esta demo, pero el pago en Stellar es real: aquí está la transacción en testnet." |
| 2:00–2:35 | **Retirar** → `100` → **Usar CLABE de prueba** → **Confirmar** → **Enviar 100 TMXN desde mi wallet** → "Retiro completado" | "Para regresar a mi banco, retiro 100 pesos. Mi wallet firma el pago al anchor con un memo, el anchor lo detecta en la red y envía el SPEI a mi CLABE." |
| 2:35–2:55 | Historial con ambas operaciones "Completado"; luego GitHub | "Todo quedó en el historial con su enlace al explorador. El código es MIT y está en GitHub: cualquier wallet o proveedor SPEI lo puede usar hoy." |

## Antes de grabar

- Haz el recorrido una vez para confirmar que todo pasa (los pasos 1 y 2 con correo tardan unos segundos la primera vez).
- Usa un correo al que tengas acceso en el teléfono para copiar el código rápido.
- Si algo falla con el correo, graba con **Llave en el navegador** (el paso 1 cambia a **Obtener saldo de prueba**).
- Sube el video como no listado y pega el enlace en la entrega y en la sección "Para jueces" del README.

# Muestras de NASA DONKI

Respuestas reales de cada endpoint de DONKI, guardadas el 2026-11-14 para cruzar
datos y decidir qué mecánicas construir. Rango de fechas: 2026-10-15 a 2026-11-14
(2026-11-07 a 2026-11-14 para WSA+Enlil, por su límite de 7 días).

| Endpoint | Archivo | Resultado |
|---|---|---|
| CME | CME.json | 89 eventos |
| CMEAnalysis | CMEAnalysis.json | 5 eventos |
| GST | GST.json | 1 evento |
| IPS | IPS.json | 2 eventos |
| FLR | FLR.json | **roto del lado de NASA** (404 "Not Found" consistente, no es nuestra key ni rate limit) |
| SEP | SEP.json | 0 eventos (array vacío, no hubo en el rango) |
| MPC | MPC.json | 0 eventos (array vacío, no hubo en el rango) |
| RBE | RBE.json | 5 eventos |
| HSS | HSS.json | 7 eventos |
| WSAEnlilSimulations | WSAEnlilSimulations.json | 14 simulaciones |
| notifications | notifications.json | 32 notificaciones (type=all) |

Nota: estos archivos no sustituyen al fallback curado del juego (`src/data/curated/`),
son solo material de referencia para diseñar mecánicas.

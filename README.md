# Manual — Total Glow Up

Manual privado en cuatro pilares: **sobriedad**, **presencia física**, **capacidad resolutiva** y **criterio propio**.

Interfaz oscura, tipografía editorial, todo el estado se guarda en `localStorage` — nada sale del navegador.

## Secciones

1. Los cuatro pilares
2. Contador de días limpios (con hitos: 1d, 1sem, 1mes, 3mes, 6mes, 1año, 2años)
3. Protocolo diario — dos rituales de 8 min
4. Programa de cuerpo — 12 semanas en 3 fases
5. Criterio propio — canon de lectura + reglas de escritura
6. Presencia — postura, voz, mirada, estilo
7. Higiene y aroma — ducha, aliento, desodorante, perfume, piel, cabello, uñas, pies, ropa
8. Zona roja — plan de recaída con modo SOS
9. Bebidas de reemplazo
10. Registro de victorias
11. Cartas del hermano

## Correr en local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Deploy en Vercel

```bash
npx vercel
```

O importa el repo desde [vercel.com/new](https://vercel.com/new). Next.js 16 se autodetecta.

## Estructura

```
src/app/
├── layout.tsx         Root layout + metadata
├── globals.css        Reset mínimo
├── page.tsx           Server component: metadata + fuentes
├── ManualClient.tsx   Client component con toda la interactividad
└── manual.css         Estilos aislados bajo .manual-page
```

Los datos del usuario se guardan en `localStorage` bajo la clave `manual-hermano:v1`.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Fuentes: Fraunces (editorial), Inter (UI), JetBrains Mono (data) — vía `next/font/google`

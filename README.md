# Cuaderno de Oración

App estática y minimalista pensada como una libreta de oración con guardado local automático.

## Que incluye

- UI cálida y responsive con foco en escritura.
- Recuadro principal con bordes redondeados y efecto de hoja.
- Guardado automático en `localStorage`.
- Exportación de la oración a `.txt`.
- PWA basica con `manifest`, `service worker` e iconos.
- Configuración lista para `Cloudflare Pages`.

## Abrir localmente

Puedes servir la carpeta con cualquier servidor estático.

Si quieres usar Cloudflare localmente:

```powershell
npx wrangler pages dev .
```

## Deploy en Pages

Según la documentación oficial de Cloudflare Pages para Direct Upload y configuración con Wrangler:

1. Crea el proyecto:

```powershell
npx wrangler pages project create
```

2. Despliega la carpeta actual:

```powershell
npx wrangler pages deploy .
```

El archivo `wrangler.toml` ya deja definido `pages_build_output_dir = "."`.

## Scripts utiles

- `scripts/generate-icons.ps1`: genera `png` e `ico` del icono.
- `scripts/create-shortcut.ps1`: crea un acceso directo `.url` en el escritorio apuntando a la URL que le pases.

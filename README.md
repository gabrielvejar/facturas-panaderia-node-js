# Facturacion panaderia

Scripts Node.js para generar guias de despacho, descargar informes desde el SII y emitir facturas a partir de esas guias.

## Requisitos

- Node.js instalado.
- Dependencias del proyecto instaladas:

```bash
npm install
```

- Archivo `.env` en la raiz del proyecto con las credenciales y opciones de ejecucion.

Ejemplo de `.env`:

```env
DRY_RUN=TRUE
HEADLESS=FALSE
DEFAULT_TIMEOUT=300000
SII_USER=12345678
SII_PASSWORD=clave_sii
CERT_PASSWORD=clave_certificado
```

Variables:

- `DRY_RUN`: si es `TRUE`, los scripts llegan hasta la vista previa, pero no firman documentos.
- `HEADLESS`: si es `TRUE`, Puppeteer corre sin ventana visible. Para revisar visualmente el flujo, usar `FALSE`.
- `DEFAULT_TIMEOUT`: tiempo maximo de espera en milisegundos.
- `SII_USER`: RUT de acceso al SII, sin puntos.
- `SII_PASSWORD`: clave SII.
- `CERT_PASSWORD`: clave del certificado para firmar guias y facturas.

> Importante: `.env` contiene credenciales y no debe subirse al repositorio.

## Archivos de datos

- `datosClientes.json`: clientes a procesar. Los scripts recorren este archivo en orden.
- `diasSinGuias.json`: dias que se deben omitir al generar guias.
- `Data/{anio}/{mes}/{rut}.json`: informes descargados desde el SII por cliente.
- `Data/Facturas/{anio}-{mes}-{dia}.json`: resumen de facturas generado antes de emitirlas.

## Comandos disponibles

Todos los comandos se pueden ejecutar con `npm run`:

```bash
npm run guias
npm run g:a
npm run informes
npm run facturas
```

Tambien existen alias cortos:

```bash
npm run g
npm run ga
npm run i
npm run f
```

Para pasar argumentos al script con `npm run`, agregar `--` antes de los argumentos.

## Guias de despacho

Comando:

```bash
npm run guias -- <anio> <mes> <dia_inicio> <dia_fin> [rut_inicio] [cantidad_clientes]
```

Ejemplo para generar guias del 1 al 5 de junio de 2026:

```bash
npm run guias -- 2026 06 01 05
```

Ejemplo para partir desde un cliente especifico y procesar solo 3 clientes:

```bash
npm run guias -- 2026 06 01 05 12345678 3
```

Argumentos:

- `anio`: año del documento, por ejemplo `2026`.
- `mes`: mes con dos digitos, por ejemplo `06`.
- `dia_inicio`: primer dia a procesar, idealmente con dos digitos.
- `dia_fin`: ultimo dia a procesar. Si se usa `node guias.js` directo, puede omitirse y toma el mismo valor de `dia_inicio`.
- `rut_inicio`: opcional. RUT del cliente desde donde comenzar, sin puntos ni digito verificador.
- `cantidad_clientes`: opcional. Cantidad de clientes a procesar desde `rut_inicio`.

El script inicia sesion en el SII una vez, recorre los clientes de `datosClientes.json`, omite los dias definidos en `diasSinGuias.json` y genera una guia por cliente/dia.

## Asistente para guias

El asistente permite ejecutar `guias.js` de forma interactiva:

```bash
npm run g:a
```

Alias:

```bash
npm run ga
```

El asistente pregunta:

- Año.
- Mes.
- Dia inicio.
- Dia fin.
- RUT inicial opcional.
- Cantidad de clientes opcional.

Antes de ejecutar, muestra el comando final y pide confirmacion. Para confirmar, responder `s`.

## Informes

Comando:

```bash
npm run informes -- <anio> <mes> <dia_factura> [rut_inicio] [cantidad_clientes]
```

Ejemplo:

```bash
npm run informes -- 2026 06 30
```

El script entra al SII, busca las guias de despacho emitidas desde el dia `01` del mes hasta `dia_factura`, y guarda un JSON por cliente en:

```text
Data/<anio>/<mes>/<rut>.json
```

Estos archivos son la entrada que usa `facturas.js`.

## Facturas

Comando:

```bash
npm run facturas -- <anio> <mes> <dia_factura> [rut_inicio] [cantidad_clientes]
```

Ejemplo:

```bash
npm run facturas -- 2026 06 30
```

El script lee los informes desde:

```text
Data/<anio>/<mes>/
```

Luego genera un resumen en:

```text
Data/Facturas/<anio>-<mes>-<dia_factura>.json
```

Despues inicia sesion en el SII y emite las facturas para los clientes con informes disponibles.

## Flujo recomendado

1. Revisar `datosClientes.json` y `diasSinGuias.json`.
2. Configurar `.env` con `DRY_RUN=TRUE` para probar.
3. Ejecutar el asistente o el script de guias.
4. Ejecutar informes para descargar la informacion de guias emitidas.
5. Ejecutar facturas.
6. Cuando el flujo este validado, cambiar `DRY_RUN=FALSE` para firmar documentos reales.

Ejemplo completo:

```bash
npm run ga
npm run informes -- 2026 06 30
npm run facturas -- 2026 06 30
```

## Recomendaciones de uso

- Usar `HEADLESS=FALSE` cuando se quiera supervisar el navegador.
- Usar `DRY_RUN=TRUE` para validar datos antes de firmar.
- Confirmar que el RUT usado en `rut_inicio` exista en `datosClientes.json`.
- Verificar los JSON de `Data/` antes de emitir facturas.

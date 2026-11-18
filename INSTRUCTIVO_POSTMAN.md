# Guía de Uso del Servicio ETL y Consumo desde Postman

Este documento contiene las instrucciones detalladas para iniciar el servicio web y consumir la API del proceso ETL (SQL Server → Oracle) utilizando Postman.

---

## 📋 1. Requisitos Previos

Antes de iniciar el servicio, asegúrate de:
1. Tener instalado **Node.js** (versión 18 o superior recomendada).
2. Tener configurado el archivo `.env` en la raíz del proyecto con las credenciales de conexión correctas para SQL Server y Oracle.
3. Instalar las dependencias del proyecto ejecutando en la terminal:
   ```bash
   npm install
   ```
4. Validar las conexiones de base de datos ejecutando:
   ```bash
   npm run test-connections
   ```
5. Preparar la estructura de la base de datos SQL Server ejecutando (esto agregará de forma segura el campo de marcado de control `MIGRADO` a las tablas origen):
   ```bash
    npm run setup-db
    ```

La conexión Oracle requiere `ORACLE_USER`, `ORACLE_PASSWORD` y una cadena en `ORACLE_CONNECT_STRING` (también se admite el nombre anterior `ORACLE_CONNECTION_STRING`). La cadena debe tener el formato Oracle configurado para el entorno, por ejemplo `host:1521/servicio`. Si el servicio se despliega en otro servidor, configure estas variables en el entorno del proceso que ejecuta esta API; las variables de la aplicación que la consume no se comparten con el servicio.

---

## 🚀 2. Iniciar el Servicio Web

El servicio expone una API HTTP construida con Express que permite disparar los procesos ETL de forma remota.

Para iniciar el servidor, ejecuta:
```bash
npm run serve
```

Verás una salida en consola confirmando que el servicio está activo:
```text
🚀 API escuchando en http://localhost:3000
```

### ⚠️ ¿Puerto 3000 Ocupado?
Si el puerto `3000` ya está siendo utilizado por otra aplicación, el inicio fallará. Puedes especificar un puerto alternativo (por ejemplo, el `3001` o `3005`) antes de ejecutar el comando:

* **En PowerShell:**
  ```powershell
  $env:PORT=3001; npm run serve
  ```
* **En CMD (Windows):**
  ```cmd
  set PORT=3001&& npm run serve
  ```
* **En Linux/macOS:**
  ```bash
  PORT=3001 npm run serve
  ```

---

## 📡 3. Consumo de la API desde Postman

### Paso 1: Verificar el Estado del Servicio (Health Check)
Para confirmar que el servicio web está respondiendo correctamente:
1. Crea una nueva petición en Postman.
2. Selecciona el método **GET**.
3. Ingresa la URL: `http://localhost:3000/health` (cambia el puerto si utilizas uno distinto).
4. Presiona **Send**.

**Respuesta esperada (HTTP 200 OK):**
```json
{
  "status": "ok",
  "message": "Servicio activo"
}
```

---

### Paso 2: Obtener las Fechas de Proceso Disponibles (SQL Server)
Este servicio permite consultar dinámicamente qué fechas de proceso tienen registros disponibles en SQL Server para un proceso específico (filtrado para registros mayores o iguales al `01/01/2026`).

1. Crea una nueva petición en Postman.
2. Selecciona el método **GET**.
3. Ingresa la URL: `http://localhost:3000/fechas/:proceso` (reemplaza `:proceso` por el código del proceso, ej. `MC`, `NS`, etc.).
   * Ejemplo: `http://localhost:3000/fechas/MC`
4. Presiona **Send**.

**Respuesta esperada (HTTP 200 OK):**
```json
{
  "codigo": "0",
  "mensaje": "Fechas obtenidas exitosamente",
  "fechas": [
    "04/04/2014",
    "05/04/2014"
  ]
}
```

---

### Paso 3: Ejecutar el Proceso ETL
Para disparar una migración, debes enviar una petición con los parámetros del proceso.

1. Crea una nueva petición en Postman.
2. Selecciona el método **POST**.
3. Ingresa la URL de ejecución: `http://localhost:3000/run`
4. Ve a la pestaña **Headers** y asegúrate de tener la siguiente clave/valor (suele agregarse automáticamente al seleccionar JSON en el Body):
   * `Content-Type`: `application/json`
5. Ve a la pestaña **Body**, selecciona la opción **raw** y en el menú desplegable de la derecha elige **JSON**.
6. Escribe el cuerpo de la petición según tus necesidades utilizando la siguiente guía de parámetros.

---

## 📝 4. Estructura de los Parámetros del Body (JSON)

El cuerpo JSON de la petición acepta las siguientes propiedades (son muy flexibles):

| Parámetro | Tipo | Descripción | Ejemplos |
| :--- | :--- | :--- | :--- |
| **`proceso`** | `String` | **(Requerido)** Código del proceso ETL a ejecutar. | `"NS"`, `"NC"`, `"MC"`, `"MS"`, `"R1"`, `"S1"` |
| **`limite`** / `cantidad` | `Number` | Cantidad máxima de registros a procesar. Si se envía `0` o se omite, se procesan **todos** los registros (sin límite). | `100`, `500`, `0` |
| **`j`** / `job` | `Boolean` / `String` | Indica si al finalizar la migración se debe disparar el Job de Oracle (`pq_gestion_glosa_bdua.P_CREAR_JOB_GLOSAS`). | `true`, `false`, `"J"`, `"YES"` |
| **`periodo`** / `fecha` | `String` | Permite filtrar por la fecha/periodo de proceso en la tabla origen de SQL Server. | `"4/04/2014"`, `"202405"` |

---

## 💡 5. Ejemplos Prácticos de payloads JSON

Copia y pega cualquiera de estos payloads en la pestaña **Body** (`raw` → `JSON`) de Postman según tu caso de uso:

### Caso A: Ejecución normal sin límite de registros y para un período específico
```json
{
  "proceso": "NS",
  "periodo": "4/04/2014"
}
```

### Caso B: Ejecución controlada con límite de 100 registros y sin disparar el Job
```json
{
  "proceso": "NS",
  "limite": 100,
  "periodo": "4/04/2014"
}
```

### Caso C: Ejecución con límite, período y lanzamiento automático del Job en Oracle
```json
{
  "proceso": "MC",
  "limite": 100,
  "j": true,
  "periodo": "4/04/2014"
}
```

### Caso D: Ejecución completa (sin límite), período y lanzamiento del Job en Oracle
```json
{
  "proceso": "MC",
  "j": true,
  "periodo": "4/04/2014"
}
```

---

## 📥 6. Respuestas Esperadas en Postman

### Respuesta Exitosa (HTTP 200 OK)
Indica que el proceso finalizó correctamente. La respuesta contiene el detalle de lo que fue procesado.
```json
{
  "codigo": "0",
  "mensaje": "Proceso iniciado",
  "details": {
    "proceso": "MC",
    "limite": 100,
    "ejecutarJob": true
  }
}
```
*Nota: Podrás ver el progreso en tiempo real y el log completo de los registros insertados en la consola/terminal donde se está ejecutando el servicio Node.js.*

### Respuesta con Error (HTTP 400 Bad Request)
Ocurre si hay parámetros incorrectos, fallos de conexión a la base de datos o errores en la base de datos durante la ejecución.
```json
{
  "codigo": "1",
  "mensaje": "Proceso \"XYZ\" no encontrado en procesos.js",
  "error": "Proceso \"XYZ\" no encontrado en procesos.js"
}
```
npm run serve

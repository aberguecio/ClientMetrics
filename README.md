# ClientMetrics - Sales Analytics Platform

**Plataforma full-stack de análisis de ventas con inteligencia artificial**

ClientMetrics es una aplicación que ingiere transcripciones de reuniones comerciales en formato CSV, utiliza inteligencia artificial (GPT-4-mini) para extraer insights estructurados automáticamente, y presenta visualizaciones interactivas personalizables en dashboards configurables.

---

## 📋 Tabla de Contenidos

- [Flujo de la Aplicación y Decisiones de Diseño](#-flujo-de-la-aplicación-y-decisiones-de-diseño-escrito-por-humanos)
- [Funcionalidades Principales](#-funcionalidades-principales)
- [Tech Stack](#-tech-stack)
- [Arquitectura](#-arquitectura)
- [Decisiones de Diseño](#-decisiones-de-diseño)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Desarrollo](#-desarrollo)
- [Configuración](#%EF%B8%8F-configuración)
- [Performance & Security](#-performance--security)
- [Próximas Mejoras](#-próximas-mejoras)

---

## 🧠 Flujo de la Aplicación y Decisiones de Diseño (Escrito por Humanos)

### Procesamiento de Transcripciones

El CSV se sube al sistema y se guardan altiro todas las transcripciones en la DB. Luego se suben a la tabla `jobs`. Se creó esta tabla `jobs` para rastrear de mejor manera las transcripciones por procesar, ver cuántas faltan, y si ocurre un error poder volver a encolar, etc.

Se procesan de a 20. Logré procesar más de 100 en paralelo y miles en cola (hasta que me pitié la plata que puse en OpenAI por procesar tanto), pero decidí que 20 en paralelo es un número razonable por ahora y además muestra de forma más gráfica el flujo de encolado cuando se suben pocas transcripciones.

### Análisis y Vectorización

Luego de procesar con un agente y sacar info relevante como: sector de la empresa, cómo llegaron a Vambe, interacciones diarias, etc., también se vectorizan las transcripciones. Esto permite generar gráficos de cercanía entre distintas transcripciones y a futuro permitiría un buscador semántico y filtros por cercanía.

### Sistema de Gráficos Custom

Luego de recolectar la info se muestran los gráficos. En vez de hardcodear una serie de gráficos, se creó un sistema de gráficos custom (totalmente overkill y podría haber usado Grafana, que ya hace todo lo que creé y mejor, pero bueno, lo hecho hecho está), donde: se crea una vista, la cual contiene gráficos. Los gráficos pueden ser de distintos tipos y toman variables.

Para hacer que los gráficos funcionen de mejor manera y sean más modulares, dividí las variables en distintos tipos:

- **`int`**: Es una variable numérica y sirve para el eje Y
- **`bool`**: Es una variable que solo puede tomar 2 valores, sirve para agrupar
- **`string`**: Es un valor de texto elegido entre opciones acotadas, sirve para el eje X y para agrupar
- **`array cerrado`**: Varias opciones elegidas dentro de opciones acotadas, sirve para el eje X
- **`array abierto`**: Varias opciones elegidas sin restricción de opciones, sirve para mapa de palabras
- **`embedding`**: Es una vectorización de un texto y sirve para generar gráficos de cercanía. Estos gráficos usan K-Means para agrupar y luego "aplanan" las miles de dimensiones a solo 2 dimensiones para generar un gráfico que es solo una idea de cómo se comportan estos puntos en un espacio n-dimensional.

Estas variables por tipo me permitieron filtrar qué tipo de variables puede usar cada gráfico y en qué parte. Si se deciden agregar más variables, solo hay que definir el tipo y se pueden usar en los gráficos que correspondan (no es tan fácil, pero casi).

### Tipos de Gráficos Disponibles

Los tipos de gráficos son:

1. **Pie, Barras, Líneas y Área**: Son iguales pero visualmente distintos, los cuales tienen la opción de tomar el acumulado o el actual
2. **Mapa de palabras**: Pensado para variables abiertas donde puedes juntar frases o separar en palabras
3. **Gráfico de puntos**: Solo para graficar los embeddings y mostrar otro valor, cosa de ver si hay cercanía entre la transcripción y los valores mostrados (se entiende mejor viendo el gráfico, y de todas maneras no es un gráfico que entregue tanto valor real, se deja porque técnicamente es entretenido, ojalá valga algo)

### Sistema de Filtros Apilables

Luego de generar gráficos también se pueden generar filtros. Estos filtros se pueden aplicar a un gráfico o a una vista y se stackean entre ellos. Si una vista tiene el filtro "ventas cerradas" y un gráfico tiene el filtro "empresas financieras", el gráfico en esa vista mostrará empresas financieras con ventas cerradas.

---

## 🤖 Documentación Técnica (Escrito por Clankers)

---

## ✨ Funcionalidades Principales

### 1. **Análisis Inteligente de Reuniones con LLM**
Extracción automática de 20+ campos estructurados de transcripciones:
- **Categorización de empresa**: Sector, tamaño, canal de descubrimiento
- **Identificación de insights**: Pain points, use cases, objeciones, requisitos técnicos
- **Scores de confianza**: Para cada evaluación realizada por el modelo

### 2. **Visualizaciones Dinámicas y Personalizables**
6 tipos de gráficos con configuración flexible:
- **Gráficos estándar**: Pie, Bar, Line, Area
- **Word Clouds**: Palabras individuales o frases completas
- **Vector Clusters**: Gráficos de clusters vectoriales (PCA + K-Means)
- **Configuración avanzada**: Ejes personalizables, múltiples agregaciones (count, sum, avg, min, max), agrupamiento temporal
- **Gráficos acumulativos**: Para visualizar tendencias en líneas y áreas

### 3. **Sistema de Filtros Avanzado**
Filtros combinables y reutilizables:
- **Filtros básicos**: Por vendedor, rango de fechas, estado (cerrado/abierto)
- **Filtros por campos LLM**: Sector, tamaño de empresa, canal de descubrimiento
- **Combinación multinivel**: Filtros a nivel de vista + filtros específicos por gráfico

### 4. **Dashboards Personalizables**
Vistas guardadas con objetivos específicos:
- **Filtros reutilizables**: Definidos una vez, aplicados en múltiples vistas
- **Vista por defecto**: Configurable para carga automática al iniciar
- **Gestión completa**: CRUD de vistas, gráficos y filtros

### 6. **Sistema de Procesamiento Asíncrono**
Background jobs con retry logic:
- **Auto-processor**: Inicia automáticamente al arrancar la aplicación
- **Procesamiento en batch**: 5 jobs concurrentes
- **Retry exponencial**: 3 intentos con backoff (1s, 2s, 4s)
- **Estados rastreables**: `pending` → `processing` → `completed`/`failed`
- **Sin race conditions**: `FOR UPDATE SKIP LOCKED` en queries

---

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: CSS Modules + Vanilla CSS
- **Charts**: Recharts
- **State Management**: React hooks + Custom hooks

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **ORM**: Drizzle ORM
- **Validation**: Zod schemas

### Database
- **Primary DB**: PostgreSQL 16
- **Vector Extension**: pgvector
- **Indexing**: HNSW (cosine distance)

### AI/ML
- **LLM**: OpenAI GPT-5-mini (categorización)
- **Embeddings**: text-embedding-3-small (1536 dim)
- **Clustering**: K-Means
- **Dimensionality Reduction**: PCA

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Development**: Next.js dev server
- **Production**: Optimized Next.js build

---

## 🏗 Arquitectura

### Flujo de Datos Completo

```
┌─────────────┐
│ CSV Upload  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Validation     │
│  (CSV Parser)   │
└──────┬──────────┘
       │
       ▼
┌──────────────────────┐
│ Database Storage     │
│ (sales_meetings)     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ Job Creation         │
│ (processing_jobs)    │
└──────┬───────────────┘
       │
       ▼
┌────────────────────────────┐
│ Background Processor       │
│ (auto-start, loop 10s)     │
└──────┬─────────────────────┘
       │
       ├─► LLM Analysis (GPT-5-mini)
       │   └─► Extract 20+ structured fields
       │
       ├─► Embeddings Generation
       │   └─► text-embedding-3-small (1536 dim)
       │
       ▼
┌──────────────────────┐
│ Storage              │
│ (llm_analysis)       │
└──────┬───────────────┘
       │
       ▼
┌────────────────────────────────┐
│ Dashboard Visualization        │
│ (filters + charts + views)     │
└────────────────────────────────┘
```

### Componentes Principales

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (19 endpoints)
│   │   ├── upload/        # CSV upload
│   │   ├── meetings/      # CRUD reuniones
│   │   ├── charts/        # CRUD gráficos
│   │   ├── filters/       # CRUD filtros
│   │   ├── views/         # CRUD vistas
│   │   ├── analytics/     # Métricas calculadas
│   │   └── jobs/          # Gestión de jobs
│   ├── meetings/          # Páginas de reuniones
│   ├── upload/            # Página de carga
│   ├── views/             # Gestión de vistas
│   └── page.tsx           # Dashboard principal
│
├── components/            # React Components
│   ├── common/           # Modal, LoadingState, SelectField
│   ├── charts/           # ChartBuilder, ChartRenderer, ChartCard
│   ├── dashboard/        # Dashboard header, stats, grid
│   ├── filters/          # FilterBuilder, FilterSelector
│   ├── meetings/         # MeetingsList, MeetingDetail
│   └── views/            # ViewManager, ViewSelector
│
├── lib/                  # Utilities & Business Logic
│   ├── api/             # API helpers (responses, validators, transformers)
│   ├── charts/          # Chart calculation & aggregation
│   ├── csv/             # CSV parsing & validation
│   ├── db/              # Database (Drizzle schema & queries)
│   ├── filters/         # Filter merging & building
│   ├── hooks/           # Custom React hooks
│   ├── jobs/            # Job processing & auto-processor
│   ├── llm/             # OpenAI integration (categorize, embeddings)
│   └── math/            # Algorithms (K-Means, PCA)
│
└── types/               # TypeScript types
    ├── charts.ts        # Chart, Filter, View types
    ├── llm.ts          # LLM response schemas
    └── api.ts          # API response types
```


## 📦 Instalación

### Prerrequisitos
- Docker & Docker Compose instalados
- Cuenta de OpenAI con API key

### Pasos

1. **Clonar repositorio**
```bash
git clone <repo-url>
cd ClientMetrics
```

2. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus credenciales:
# DATABASE_URL=postgresql://user:pass@postgres:5432/clientmetrics
# OPENAI_API_KEY=sk-...
```

3. **Iniciar servicios con Docker**
```bash
docker-compose up --build
```

Esto iniciará:
- PostgreSQL 16 con pgvector en puerto 5432
- Next.js app en puerto 3000

4. **Acceder a la aplicación**
```
http://localhost:3000
```

---

## 🚀 Uso

### 1. Subir CSV
Navega a `/upload` y sube un archivo CSV con las siguientes columnas:
- `client_name`: Nombre del cliente
- `email`: Email de contacto
- `phone`: Teléfono
- `meeting_date`: Fecha de reunión (formato YYYY-MM-DD)
- `sales_rep`: Nombre del vendedor
- `closed`: Estado de cierre (true/false)
- `transcript`: Transcripción completa de la reunión

**Ejemplo de CSV**:
```csv
client_name,email,phone,meeting_date,sales_rep,closed,transcript
Acme Corp,john@acme.com,+1234567890,2024-01-15,Maria Lopez,true,"Client expressed strong interest in our enterprise plan..."
```

### 2. Monitorear Procesamiento
- Los jobs se crean automáticamente al subir el CSV
- El procesamiento ocurre en background (no requiere acción del usuario)
- Monitorea el progreso en el dashboard principal `/`
- Estados visibles: `pending`, `processing`, `completed`, `failed`

### 3. Crear Dashboard Personalizado
1. Ve a `/views`
2. Haz clic en "Create New View"
3. Define nombre y objetivo de la vista
4. Agrega filtros (opcional) para segmentar datos
5. Agrega gráficos a la vista desde el catálogo
6. Configura cada gráfico: tipo, ejes, agregación, agrupamiento

### 4. Analizar Datos
Usa filtros para segmentar:
- Por vendedor específico
- Por rango de fechas
- Por estado de cierre (ganados/perdidos)
- Por sector de la empresa
- Por tamaño de empresa
- Por pain points mencionados
- Por requisitos técnicos

### 5. Crear Gráficos
Tipos de gráficos disponibles:
- **Pie Chart**: Distribución porcentual
- **Bar Chart**: Comparación de categorías
- **Line Chart**: Tendencias temporales
- **Area Chart**: Tendencias con área bajo la curva
- **Word Cloud**: Palabras o frases más frecuentes
- **Vector Cluster**: Agrupación semántica con K-Means

---

## 📁 Estructura del Proyecto

```
ClientMetrics/
├── docker-compose.yml          # Orquestación de servicios
├── Dockerfile                  # Imagen de Next.js
├── .env                        # Variables de entorno (NO commitear)
├── docker/
│   └── postgres/
│       └── init.sql           # Schema inicial de DB
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/              # 19 API routes
│   │   ├── meetings/         # Páginas de reuniones
│   │   ├── upload/           # Página de carga CSV
│   │   ├── views/            # Gestión de vistas
│   │   └── charts/           # Gestión de gráficos
│   ├── components/           # React components
│   │   ├── common/          # Modal, LoadingState, SelectField
│   │   ├── charts/          # Chart components
│   │   ├── dashboard/       # Dashboard components
│   │   ├── filters/         # Filter components
│   │   └── meetings/        # Meeting components
│   ├── lib/                 # Utilities & logic
│   │   ├── api/            # API helpers (responses, validators, transformers)
│   │   ├── charts/         # Chart calculation & aggregation
│   │   ├── csv/            # CSV parsing & validation
│   │   ├── db/             # Database (Drizzle schema & queries)
│   │   ├── filters/        # Filter logic & merging
│   │   ├── hooks/          # Custom React hooks
│   │   ├── jobs/           # Job processing & auto-processor
│   │   ├── llm/            # OpenAI integration
│   │   └── math/           # Algorithms (K-Means, PCA)
│   └── types/              # TypeScript types
├── docker/
│   └── postgres/
│       └── init.sql        # Schema inicial de DB
├── scripts/
│   ├── migrate.ts          # Script de migraciones
│   └── seed.ts             # Seed de datos de ejemplo
└── drizzle/                # Archivos de migraciones generados
```

---

## 🌐 API Endpoints

### Upload & Processing
- `POST /api/upload` - Subir CSV con transcripciones
- `GET /api/process-jobs` - Estadísticas de jobs
- `POST /api/jobs/retry-failed` - Reintentar jobs fallidos

### Meetings
- `GET /api/meetings` - Listar reuniones (paginado)
- `GET /api/meetings/[id]` - Detalle de reunión
- `DELETE /api/meetings` - Eliminar múltiples reuniones
- `POST /api/meetings/requeue` - Reencolar para reprocesar
- `GET /api/meetings/filter-options` - Opciones para filtros

### Charts
- `GET /api/charts` - Listar gráficos guardados
- `POST /api/charts` - Crear gráfico
- `GET /api/charts/[id]` - Obtener gráfico
- `PUT /api/charts/[id]` - Actualizar gráfico
- `DELETE /api/charts/[id]` - Eliminar gráfico
- `POST /api/charts/data` - Calcular datos del gráfico con filtros

### Filters
- `GET /api/filters` - Listar filtros guardados
- `POST /api/filters` - Crear filtro
- `GET /api/filters/[id]` - Obtener filtro
- `PUT /api/filters/[id]` - Actualizar filtro
- `DELETE /api/filters/[id]` - Eliminar filtro

### Views (Dashboards)
- `GET /api/views` - Listar vistas guardadas
- `POST /api/views` - Crear vista
- `GET /api/views/[id]` - Obtener vista con gráficos y filtros
- `PUT /api/views/[id]` - Actualizar vista
- `DELETE /api/views/[id]` - Eliminar vista
- `GET /api/views/default` - Obtener vista por defecto
- `POST /api/views/[id]/charts` - Agregar gráfico a vista
- `DELETE /api/views/[id]/charts?chart_id=xxx` - Quitar gráfico de vista
- `POST /api/views/[id]/filters` - Agregar filtro a vista
- `DELETE /api/views/[id]/filters?filter_id=xxx` - Quitar filtro de vista

### Analytics
- `POST /api/analytics` - Calcular métricas analíticas

> **Nota**: Todos los endpoints siguen el formato estandarizado:
> ```json
> { "success": true, "data": {...} }
> ```

---

## 🗄 Database Schema

### Core Tables

**uploads**
- Metadata de archivos CSV subidos
- Campos: `id`, `filename`, `uploaded_by`, `row_count`, `created_at`

**sales_meetings**
- Reuniones con transcripciones
- Campos: `id`, `client_name`, `email`, `phone`, `meeting_date`, `sales_rep`, `closed`, `transcript`, `upload_id`, `created_at`, `updated_at`

**llm_analysis**
- Análisis JSON + embeddings vectoriales
- Campos: `id`, `meeting_id`, `prompt_version`, `model`, `analysis_json` (JSONB), `embedding` (vector 1536), `created_at`
- **Campos extraídos en analysis_json** (20+):
  - Business: `interest_level`, `sentiment`, `urgency`, `icp_fit`
  - Company: `sector`, `company_size`, `discovery_channel`
  - Arrays: `pain_points`, `use_cases`, `objections`, `tools_mentioned`
  - Requirements: `budget_range`, `decision_maker`, `confidentiality`, `multilingual`, etc.

**processing_jobs**
- Cola de trabajos async con retry tracking
- Campos: `id`, `meeting_id`, `status`, `attempts`, `error_message`, `created_at`, `updated_at`
- Estados: `pending`, `processing`, `completed`, `failed`

### Dashboard Tables

**saved_charts**
- Definiciones de gráficos
- Campos: `id`, `name`, `description`, `chart_type`, `x_axis`, `y_axis`, `group_by`, `aggregation`, `time_group`, `colors`, `chart_filter_id`, `k_clusters`, `label_field`, `text_mode`, `cumulative`, `created_at`, `updated_at`

**saved_filters**
- Configuraciones de filtros reutilizables
- Campos: `id`, `name`, `description`, `filter_data` (JSONB), `created_at`, `updated_at`

**saved_views**
- Dashboards personalizados
- Campos: `id`, `name`, `objective`, `is_default`, `created_at`, `updated_at`

**view_charts**
- Relación many-to-many (views ↔ charts)
- Campos: `id`, `view_id`, `chart_id`, `position`, `width`, `chart_filter_id`, `created_at`

**view_filters**
- Relación many-to-many (views ↔ filters)
- Campos: `id`, `view_id`, `filter_id`, `created_at`

### Índices y Optimizaciones
- **HNSW index** en `llm_analysis.embedding` para búsqueda vectorial rápida
- **JSONB indexing** en `analysis_json` para filtros rápidos por campos LLM
- **Foreign keys con cascada** para mantener integridad referencial

## ⚙️ Configuración

### Variables de Entorno

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/clientmetrics

# OpenAI
OPENAI_API_KEY=sk-...

# Environment
NODE_ENV=development|production

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Desarrollado con ❤️ usando Next.js, TypeScript y OpenAI**

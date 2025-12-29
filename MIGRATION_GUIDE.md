# Guía de Migración de Base de Datos

## Resumen de Cambios

Se han realizado cambios significativos al esquema de la base de datos para consolidar los campos de análisis LLM. Los campos eliminados incluyen:

- `interest_level`
- `sentiment`
- `urgency`
- `icp_fit`

## Opción 1: Reiniciar la Base de Datos (Recomendado para desarrollo)

Si no tienes datos importantes que mantener:

```bash
# Detener y eliminar los contenedores y volúmenes
docker-compose down -v

# Reiniciar los contenedores (esto ejecutará init.sql y migraciones automáticamente)
docker-compose up -d
```

Esto creará una base de datos limpia con el esquema actualizado.

## Opción 2: Migración Manual (Para mantener datos existentes)

### Paso 1: Generar Nueva Migración

```bash
# Generar migración basada en los cambios del schema
npm run db:generate
```

### Paso 2: Ejecutar Migraciones

```bash
# Ejecutar todas las migraciones pendientes
npm run db:migrate
```

### Paso 3: Verificar

```bash
# Abrir Drizzle Studio para verificar los cambios
npm run db:studio
```

## Configuración de Migraciones Automáticas

El proyecto ahora está configurado para ejecutar migraciones automáticamente cuando se inicia con Docker Compose.

### Cómo Funciona

1. Cuando ejecutas `docker-compose up`, el contenedor de la app espera a que PostgreSQL esté listo
2. Automáticamente ejecuta `npm run db:migrate` antes de iniciar la aplicación
3. Las migraciones se aplican desde la carpeta `./drizzle`

### Comandos Disponibles

```bash
# Generar nueva migración basada en cambios del schema
npm run db:generate

# Ejecutar migraciones pendientes
npm run db:migrate

# Push directo de schema a DB (sin crear migración)
npm run db:push

# Abrir Drizzle Studio
npm run db:studio

# Seed de datos de prueba
npm run db:seed
```

## Archivos de Migración

Las migraciones se encuentran en:
- `drizzle/` - Carpeta con archivos SQL de migración
- `drizzle/meta/` - Metadatos de migraciones
- `scripts/migrate.ts` - Script de ejecución de migraciones

## Solución de Problemas

### Error: "column does not exist"

Si ves errores de columnas faltantes (como `chart_filter_id`):

1. Verifica que las migraciones se ejecutaron: `docker-compose logs app | grep migration`
2. Si no se ejecutaron, reinicia manualmente: `docker-compose restart app`
3. Si persiste, usa la Opción 1 (reiniciar DB completamente)

### Error: "relation already exists"

Esto indica que init.sql y migraciones están en conflicto:

1. Detén los contenedores: `docker-compose down -v`
2. Limpia los volúmenes: `docker volume prune`
3. Reinicia: `docker-compose up -d`

### Verificar Estado de Migraciones

```bash
# Ver logs del contenedor de la app
docker-compose logs app

# Ver qué migraciones se han aplicado
docker-compose exec postgres psql -U postgres -d clientmetrics -c "SELECT * FROM drizzle.__drizzle_migrations;"
```

## Notas Importantes

⚠️ **IMPORTANTE**:
- Las migraciones se ejecutan automáticamente en cada inicio del contenedor
- Si ya están aplicadas, Drizzle las omite (son idempotentes)
- `init.sql` solo se ejecuta la primera vez que se crea el volumen de PostgreSQL
- Para cambios de schema, siempre usa `npm run db:generate` antes de hacer commit

## Workflow de Desarrollo

1. Modificar `src/lib/db/schema.ts`
2. Ejecutar `npm run db:generate` para crear migración
3. Revisar el archivo SQL generado en `drizzle/`
4. Commit de schema.ts + archivos de migración
5. Al hacer `docker-compose up`, las migraciones se aplican automáticamente

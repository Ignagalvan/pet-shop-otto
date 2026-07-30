# Supabase para Pet Shop Otto

## 1. Crear el proyecto

1. Entrar a [Supabase](https://supabase.com/dashboard).
2. Crear una organización, si todavía no existe.
3. Elegir **New project**.
4. Usar el nombre `pet-shop-otto`.
5. Elegir el plan gratuito y la región más cercana a Córdoba.
6. Crear una contraseña segura para la base de datos y guardarla en un gestor de contraseñas.

La cuenta y la organización deberían quedar a nombre del cliente. No compartir por chat la contraseña de la base de datos ni una clave secreta.

## 2. Conectar el repositorio

La estructura está versionada en `supabase/migrations`. Después de iniciar sesión con la CLI:

```powershell
pnpm supabase login
pnpm supabase link --project-ref TU_PROJECT_REF
pnpm supabase db push --include-seed
```

Esto crea las tablas, las políticas de seguridad y el contenedor de imágenes sin hacer cambios manuales en el editor visual.

## 3. Variables locales

Crear `.env.local` a partir de `.env.example` y completar:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

- La URL y la clave publicable pueden usarse en el navegador.
- La clave secreta es exclusivamente del servidor y nunca debe comenzar con `NEXT_PUBLIC_`.
- `.env.local` está ignorado por Git y no debe subirse al repositorio.

## 4. Primer administrador

Cuando la base esté aplicada:

1. Crear el usuario del dueño desde **Authentication > Users**.
2. Copiar el UUID del usuario.
3. Crear su perfil con rol `owner` mediante una migración controlada o una instrucción SQL puntual.

Después podrá entrar en `/admin` y revisar el Excel antes de actualizar el catálogo.

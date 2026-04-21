# Project TODO

- [x] Pantalla de bienvenida con registro y login
- [x] Tema visual rojo/oro (temática china)
- [x] Dashboard principal con saldo
- [x] Pantalla de inversiones
- [x] Pantalla de referidos
- [x] Pantalla de perfil con logout
- [x] Pantalla de recarga de saldo
- [x] Pantalla de retiro de fondos
- [x] Pantalla de inversión directa
- [x] Backend API con endpoints para registro, inversiones, recargas, retiros
- [x] Tablas de base de datos para plataforma de inversiones
- [x] Panel admin conectado al backend API
- [x] Comisiones automáticas por referidos
- [x] Tests de API endpoints
- [x] Logo profesional generado
- [x] Checkpoint final

## Bugs Reportados
- [x] Botón invertir no funciona / no aparece (cambiado Pressable a TouchableOpacity)
- [x] No se puede cargar foto de comprobante en recarga (agregado expo-image-picker)
- [x] Panel admin se queda en "Cargando datos" (servido desde mismo servidor, sin CORS)
- [x] Panel admin no muestra datos de usuarios registrados (campos corregidos)
- [x] Fotos de comprobantes se cargan a S3 correctamente

## Cambios Solicitados
- [x] Modificar niveles de referidos de 5 en 5 (Bronce 0, Bronze 5, Silver 10, Gold 15, Platinum 20, Diamond 25+)
- [x] Actualizar comisiones según nuevos niveles (5%, 10%, 15%, 20%, 25%, 30%)
- [x] Actualizar panel admin para mostrar nuevos niveles

## Bugs Reportados (Abril 16)
- [x] BUG: Al aprobar recarga en panel admin, el saldo no se acredita en la cuenta del usuario
- [x] Verificar que approveRecharge actualice correctamente el balance en la BD
- [x] Verificar que la app móvil sincronice el saldo desde el servidor
- [x] Verificar que el userId se esté pasando correctamente en las recargas

## Bugs Reportados (Abril 16 - Ronda 2)
- [x] Al recargar, al usuario le debe salir "Tu recarga ha sido enviada para aprobación"
- [x] Después de que el admin apruebe, el usuario debe ver el saldo recargado en la app
- [x] Al enviar foto de recarga, debe aparecer para aprobar o rechazar en el panel admin
- [x] Borrar todas las recargas, saldos y transacciones para empezar de cero (prueba limpia)

## Bugs Reportados (Abril 18)
- [x] BUG: Error al intentar invertir desde la app
- [x] Al enviar recarga, redirigir automáticamente al menú sin mostrar botón (evitar reenvíos)
- [x] Evitar envíos duplicados de recarga (deshabilitar botón tras enviar)
- [x] Mostrar historial de recargas del usuario en la app

## Bugs Reportados (Abril 18 - Ronda 2)
- [x] BUG: El cierre de sesión no funciona correctamente
- [x] BUG: El cierre de sesión no funciona en navegadores web (localStorage no se limpia)
- [x] BUG: No se puede invertir, error al intentar crear una inversión

## Nuevas Funcionalidades (Abril 21)
- [x] Mostrar crecimiento diario de inversión al usuario (día a día hasta los 15 días)
- [x] Barra de progreso visual en pantalla de inversiones
- [x] Saldo proyectado día a día con ganancia acumulada
- [x] Home screen muestra saldo total incluyendo ganancias diarias de inversiones activas

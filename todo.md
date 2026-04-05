# Trading Invest App - TODO

## Fase 1: Configuración y Branding
- [x] Generar logo personalizado para la aplicación
- [x] Actualizar app.config.ts con nombre y logo
- [x] Configurar colores en theme.config.js

## Fase 2: Estructura Base y Navegación
- [x] Crear estructura de pantallas (Home, Invest, Investments, Investment Detail, Profile)
- [x] Configurar navegación por tabs
- [x] Implementar ScreenContainer para todas las pantallas
- [x] Crear componentes reutilizables (Card, Button, Input)

## Fase 3: Pantalla de Inicio (Home)
- [x] Mostrar saldo total disponible
- [x] Mostrar ganancias totales acumuladas
- [x] Mostrar resumen de inversiones activas
- [x] Implementar botón "Invertir Ahora"
- [x] Mostrar historial de últimas inversiones
- [x] Indicador de progreso de inversiones en curso

## Fase 4: Pantalla de Inversión (Invest)
- [x] Input para monto a invertir
- [x] Mostrar información del plan (60% en 15 días)
- [x] Cálculo automático de ganancias esperadas
- [x] Validación de monto mínimo/máximo
- [x] Checkbox de términos y condiciones
- [x] Botón "Confirmar Inversión"
- [x] Confirmación exitosa de inversión

## Fase 5: Pantalla de Mis Inversiones (Investments)
- [x] Listar todas las inversiones activas
- [x] Mostrar información en tarjetas (monto, fecha, días restantes, ganancias)
- [x] Implementar barra de progreso visual
- [x] Filtros (Activas, Completadas, Todas)
- [x] Navegación a detalle de inversión

## Fase 6: Pantalla de Detalle de Inversión
- [x] Mostrar información completa de inversión
- [x] Mostrar cronograma de progreso
- [x] Botón "Reclamar Ganancias" (cuando esté completada)
- [x] Mostrar historial de cambios

## Fase 7: Pantalla de Perfil (Profile)
- [x] Mostrar información del usuario
- [x] Mostrar saldo total y ganancias
- [x] Mostrar estadísticas generales
- [x] Opción de configuración
- [x] Botón de cerrar sesión

## Fase 8: Lógica de Datos y Persistencia
- [x] Implementar AsyncStorage para guardar inversiones
- [x] Crear contexto para estado global de inversiones
- [x] Implementar cálculo de ganancias en tiempo real
- [x] Actualizar saldo después de reclamar ganancias
- [x] Persistir datos de usuario

## Fase 9: Pulido y Pruebas
- [ ] Revisar diseño visual en todas las pantallas
- [ ] Probar flujos de usuario completos
- [ ] Validar cálculos de ganancias
- [ ] Revisar feedback háptico y animaciones
- [ ] Pruebas en dispositivos reales (iOS/Android)

## Fase 10: Entrega
- [ ] Crear checkpoint final
- [ ] Generar APK/IPA
- [ ] Documentación de uso
- [ ] Entregar al usuario


## Fase 11: Recarga por Consignación Bancaria
- [x] Crear pantalla de recarga (Recharge)
- [x] Mostrar datos bancarios de la cuenta receptora
- [x] Implementar captura de foto de consignación
- [x] Validar y guardar foto
- [x] Crear formulario con monto y referencia
- [x] Mostrar estado de recarga (Pendiente, Aprobada, Rechazada)
- [x] Agregar tab de recarga en navegación
- [x] Integrar recarga con contexto de inversiones
- [x] Guardar historial de recargas
- [x] Notificar cuando recarga sea aprobada


## Fase 12: Panel de Administración
- [ ] Crear pantalla de admin para verificar recargas
- [ ] Mostrar lista de recargas pendientes con fotos
- [ ] Implementar botones de aprobar/rechazar
- [ ] Agregar historial de recargas procesadas
- [ ] Proteger acceso con contraseña/código

## Fase 13: Cambiar Saldo Inicial a 0
- [x] Modificar saldo inicial de $10,000 a $0
- [x] Actualizar mensaje en pantalla inicial
- [x] Validar que solo se puede invertir después de recargar

## Fase 14: Sistema de Referidos y Niveles
- [x] Crear tipos para referidos y niveles
- [x] Implementar contexto de referidos
- [x] Crear pantalla de referidos con código único
- [x] Mostrar árbol de referidos
- [x] Implementar sistema de niveles (Nivel 1, 2, 3, etc)
- [x] Calcular comisiones por nivel (ej: Nivel 1: 10%, Nivel 2: 5%, Nivel 3: 2%)
- [x] Mostrar ganancias por referidos
- [x] Agregar tab de referidos en navegación



## Fase 15: Autenticación y Registro
- [x] Crear pantalla de login con usuario y contraseña
- [x] Crear pantalla de registro de nuevos usuarios
- [x] Implementar validación de credenciales
- [x] Guardar usuarios en base de datos local
- [x] Implementar sesión de usuario autenticado
- [x] Agregar opción de cerrar sesión

## Fase 16: Comisiones Automáticas
- [x] Calcular comisión automática cuando referido invierte
- [x] Agregar comisión al saldo del referidor
- [x] Registrar historial de comisiones ganadas
- [x] Mostrar comisiones en tiempo real en perfil

## Fase 17: Sistema de Retiros
- [x] Crear pantalla de retiros
- [x] Permitir retiros solo cada 15 días
- [x] Validar que haya saldo disponible
- [x] Registrar historial de retiros
- [x] Mostrar próxima fecha de retiro disponible
- [x] Agregar métodos de retiro (bancario, etc)

## Fase 18: Visualización Diaria del Crecimiento
- [ ] Mostrar gráfico de crecimiento diario
- [ ] Calcular ganancia proporcional por día
- [ ] Actualizar visualización en tiempo real
- [ ] Mostrar progreso en porcentaje
- [ ] Agregar notificaciones de hito

## Fase 19: Diseño Mejorado con Temática China
- [ ] Actualizar colores a temática china (rojo/oro)
- [ ] Agregar iconografía china
- [ ] Mejorar interfaz general
- [ ] Agregar animaciones sutiles
- [ ] Optimizar tipografía y espaciado



## Fase 20: Comisiones Automáticas
- [x] Calcular comisión cuando referido invierte
- [x] Agregar comisión al saldo del referidor automáticamente
- [x] Actualizar nivel del referidor si alcanza más referidos
- [x] Mostrar comisiones en tiempo real en perfil
- [x] Registrar historial de comisiones ganadas

## Fase 21: Gráfico de Crecimiento Diario
- [x] Crear componente de gráfico de progreso
- [x] Calcular ganancia proporcional por día
- [x] Mostrar porcentaje de progreso (0-60%)
- [x] Actualizar gráfico en tiempo real
- [x] Agregar animaciones al gráfico

## Fase 22: Diseño Mejorado con Temática China
- [x] Cambiar colores primarios a rojo/oro
- [x] Actualizar gradientes con temática china
- [x] Agregar iconografía asiática
- [x] Mejorar tipografía y espaciado
- [x] Agregar animaciones sutiles


## Fase 23: Conectar App con Backend y Panel Admin
- [x] Conectar registro de app con backend (usuarios aparecen en panel admin)
- [x] Conectar login de app con backend
- [x] Conectar inversiones con backend
- [x] Conectar recargas con backend
- [x] Conectar retiros con backend
- [x] Conectar comisiones con backend
- [x] Panel admin lee datos reales del backend API
- [x] Flujo completo verificado: registro → panel admin muestra usuario

## Fase 24: Pulido Final para Presentación
- [x] Proteger panel admin con contraseña
- [x] Mejorar validaciones de formularios
- [x] Agregar mensajes de error claros
- [x] Optimizar carga de datos
- [x] Pruebas de flujos completos
- [ ] Checkpoint final
- [x] Documentación de uso

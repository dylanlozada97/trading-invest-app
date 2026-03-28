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


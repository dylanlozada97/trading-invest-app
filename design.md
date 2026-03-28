# Diseño de Interfaz - Trading Invest App

## Visión General
Aplicación móvil de inversión en Trading con un esquema de ganancias del 60% en 15 días. Diseño limpio, intuitivo y orientado a una experiencia de usuario de una sola mano en modo vertical (9:16).

---

## Pantallas Principales

### 1. **Pantalla de Inicio (Home)**
**Contenido:**
- Saldo total disponible (grande y prominente)
- Resumen de inversiones activas
- Ganancias totales acumuladas
- Botón principal: "Invertir Ahora"
- Historial rápido de últimas inversiones (últimas 3-5)
- Indicador de progreso de inversiones en curso

**Funcionalidad:**
- Mostrar estado en tiempo real de inversiones
- Acceso rápido a nuevas inversiones
- Visualización de ganancias proyectadas

---

### 2. **Pantalla de Inversión (Invest)**
**Contenido:**
- Monto a invertir (input numérico)
- Información del plan: "60% de ganancias en 15 días"
- Cálculo automático de ganancias esperadas
- Resumen de la inversión (monto + ganancias proyectadas)
- Botón: "Confirmar Inversión"
- Términos y condiciones (checkbox)

**Funcionalidad:**
- Validar monto mínimo/máximo
- Calcular ganancias en tiempo real
- Confirmar inversión y actualizar saldo
- Mostrar confirmación exitosa

---

### 3. **Pantalla de Mis Inversiones (Investments)**
**Contenido:**
- Lista de todas las inversiones activas
- Cada tarjeta muestra:
  - Monto invertido
  - Fecha de inicio
  - Días restantes para completar
  - Ganancias proyectadas
  - Progreso visual (barra de progreso)
- Filtros: Activas, Completadas, Todas
- Botón para ver detalles

**Funcionalidad:**
- Actualizar estado de inversiones
- Mostrar progreso en tiempo real
- Permitir reclamar ganancias cuando se completen 15 días

---

### 4. **Pantalla de Detalle de Inversión (Investment Detail)**
**Contenido:**
- Información completa de la inversión
- Monto invertido
- Fecha de inicio y fecha de finalización
- Ganancias actuales y proyectadas
- Cronograma de progreso (días completados)
- Botón: "Reclamar Ganancias" (si está completada)
- Historial de cambios

**Funcionalidad:**
- Mostrar detalles completos
- Permitir reclamar ganancias completadas
- Mostrar historial de transacciones

---

### 5. **Pantalla de Perfil (Profile)**
**Contenido:**
- Información del usuario
- Saldo total
- Ganancias totales
- Número de inversiones completadas
- Estadísticas generales
- Configuración de cuenta
- Cerrar sesión

**Funcionalidad:**
- Ver perfil de usuario
- Acceder a configuración
- Logout

---

## Flujos de Usuario Principales

### Flujo 1: Realizar una Inversión
1. Usuario abre la app → Pantalla de Inicio
2. Toca "Invertir Ahora" → Pantalla de Inversión
3. Ingresa monto → Se calcula automáticamente ganancias
4. Revisa términos y condiciones → Marca checkbox
5. Toca "Confirmar Inversión" → Confirmación exitosa
6. Retorna a Inicio → Inversión aparece en lista

### Flujo 2: Seguimiento de Inversión
1. Usuario abre la app → Pantalla de Inicio
2. Toca "Mis Inversiones" → Pantalla de Inversiones
3. Selecciona una inversión activa → Pantalla de Detalle
4. Ve progreso en tiempo real
5. Cuando completa 15 días → Botón "Reclamar Ganancias" activo
6. Toca botón → Ganancias se acreditan al saldo

### Flujo 3: Ver Ganancias
1. Usuario abre la app → Pantalla de Inicio
2. Ve saldo actualizado con ganancias
3. Toca "Mis Inversiones" → Ve inversiones completadas
4. Puede reinvertir o retirar

---

## Paleta de Colores

| Elemento | Color | Código |
|----------|-------|--------|
| Primario (Botones) | Verde Esmeralda | `#10B981` |
| Fondo | Blanco | `#FFFFFF` |
| Fondo Oscuro | Gris Oscuro | `#1F2937` |
| Texto Principal | Gris Muy Oscuro | `#111827` |
| Texto Secundario | Gris Medio | `#6B7280` |
| Éxito | Verde Claro | `#34D399` |
| Advertencia | Naranja | `#F59E0B` |
| Error | Rojo | `#EF4444` |
| Borde | Gris Claro | `#E5E7EB` |
| Superficie | Gris Muy Claro | `#F9FAFB` |

---

## Componentes Clave

### 1. **Tarjeta de Inversión**
- Monto invertido (grande)
- Ganancias proyectadas (verde)
- Progreso visual (barra)
- Días restantes
- Estado (Activa/Completada)

### 2. **Barra de Progreso**
- Muestra días completados (0-15)
- Animación suave
- Color verde cuando completa

### 3. **Botón Principal**
- Verde esmeralda
- Escala 0.97 al presionar
- Feedback háptico

### 4. **Input de Monto**
- Teclado numérico
- Validación en tiempo real
- Muestra ganancias calculadas

---

## Consideraciones de Diseño

- **Una sola mano:** Botones principales en la mitad inferior
- **Contraste:** Textos claros sobre fondos
- **Espaciado:** Padding consistente de 16px
- **Tipografía:** Fuentes claras y legibles
- **Animaciones:** Sutiles, sin distracciones
- **Feedback:** Confirmaciones visuales de acciones
- **Accesibilidad:** Tamaños de toque mínimo 44x44px

---

## Especificaciones Técnicas

- **Orientación:** Vertical (Portrait)
- **Ratio:** 9:16
- **Framework:** React Native + Expo
- **Styling:** NativeWind (Tailwind CSS)
- **Estado:** Context API + AsyncStorage (local)
- **Navegación:** Expo Router (Tab Navigation)


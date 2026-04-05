# Inversiones China - Documentación Completa

## 📱 Descripción General

**Inversiones China** es una plataforma móvil de inversiones que ofrece un retorno del **60% en 15 días** con un sistema de referidos y comisiones automáticas.

---

## 🚀 Características Principales

### 1. **Registro e Inicio de Sesión**
- Registro con usuario, email y contraseña
- Código de referido opcional para obtener comisiones
- Auto-login después del registro
- Datos seguros almacenados en el servidor

### 2. **Sistema de Inversiones**
- Invertir dinero con retorno del 60% en 15 días
- Visualización del progreso diario
- Reclamación automática de ganancias
- Historial completo de inversiones

### 3. **Recargas Bancarias**
- Consignación a cuenta bancaria
- Foto de comprobante para verificación
- Aprobación automática del admin
- Saldo actualizado en tiempo real

### 4. **Retiros**
- Retiros cada 15 días
- Transferencia a cuenta bancaria
- Historial de retiros
- Validación de saldo disponible

### 5. **Sistema de Referidos**
- Código de referido único por usuario
- Niveles: Bronze, Silver, Gold, Platinum, Diamond
- Comisiones automáticas (10% - 30% según nivel)
- Árbol de referidos visible

### 6. **Panel Administrativo**
- Dashboard con estadísticas en tiempo real
- Gestión de usuarios
- Aprobación/rechazo de recargas y retiros
- Historial de comisiones
- Auditoría completa de transacciones

---

## 📋 Guía de Uso - Aplicación Móvil

### Registro
1. Abre la app
2. Toca **"Registrarse"**
3. Ingresa usuario, email y contraseña
4. (Opcional) Ingresa código de referido de un amigo
5. Toca **"Registrarse"**
6. Copia tu código de referido para compartir
7. Toca **"Continuar a la Plataforma"**

### Primera Recarga
1. Ve a la pestaña **"Recargar"**
2. Ingresa el monto a recargar
3. Ingresa la referencia de tu consignación
4. Toma foto del comprobante
5. Toca **"Enviar Recarga"**
6. Espera a que el admin apruebe (normalmente en minutos)

### Hacer una Inversión
1. Ve a la pestaña **"Invertir"**
2. Ingresa el monto
3. Verás la ganancia esperada (60% del monto)
4. Acepta los términos
5. Toca **"Confirmar Inversión"**
6. Espera 15 días para reclamar ganancias

### Ver Progreso
1. Ve a la pestaña **"Mis Inversiones"**
2. Toca una inversión para ver detalles
3. Verás el gráfico de progreso diario
4. Cuando llegue a 100%, puedes reclamar

### Referidos
1. Ve a la pestaña **"Referidos"**
2. Copia tu código de referido
3. Comparte con amigos
4. Cuando inviertan, recibirás comisión automáticamente
5. Tu nivel subirá según la cantidad de referidos

### Retiros
1. Ve a la pestaña **"Retirar"**
2. Ingresa el monto
3. Ingresa tu cuenta bancaria
4. Toca **"Solicitar Retiro"**
5. Espera a que el admin apruebe

---

## 🔐 Guía de Uso - Panel Administrativo

### Acceso
1. Abre: `https://8888-iavuqh43l1h21ast4xcvi-c45eca65.us2.manus.computer/admin-pro-secure.html`
2. Ingresa contraseña: `admin123` (cambiar después)
3. Acceso otorgado

### Dashboard
- **Saldo Total**: Dinero en circulación
- **Inversiones Activas**: Número de inversiones en progreso
- **Usuarios**: Total de usuarios registrados
- **Recargas Pendientes**: Monto y cantidad de recargas por aprobar
- **Retiros Pendientes**: Monto y cantidad de retiros por aprobar
- **Comisiones Generadas**: Total de comisiones pagadas

### Gestión de Usuarios
- Ver lista de todos los usuarios
- Información: Email, saldo, referidos, nivel, fecha de registro
- Búsqueda por usuario

### Gestión de Inversiones
- Ver todas las inversiones activas
- Información: Monto, ganancia esperada, fecha de pago, progreso
- Filtros por estado

### Gestión de Recargas
- Ver recargas pendientes
- Información: Usuario, monto, referencia, fecha
- **Acciones**:
  - Toca **"Aprobar"** para acreditar el saldo
  - Toca **"Rechazar"** para rechazar la recarga
- Ver foto del comprobante

### Gestión de Retiros
- Ver retiros pendientes
- Información: Usuario, monto, cuenta bancaria, fecha
- **Acciones**:
  - Toca **"Aprobar"** para procesar el retiro
  - Toca **"Rechazar"** para rechazar el retiro

### Gestión de Comisiones
- Historial completo de comisiones
- Información: Referidor, referido, monto, porcentaje, estado
- Ver comisiones pendientes y acreditadas

### Auditoría
- Registro de todas las transacciones
- Tipos: Inversión, Recarga, Retiro, Comisión
- Búsqueda por tipo de transacción
- Información completa de cada transacción

---

## 💰 Estructura de Comisiones

| Nivel | Referidos | Comisión |
|-------|-----------|----------|
| Bronze | 0-4 | 10% |
| Silver | 5-14 | 15% |
| Gold | 15-29 | 20% |
| Platinum | 30-49 | 25% |
| Diamond | 50+ | 30% |

**Ejemplo**: Si tienes 10 referidos (Silver) y uno invierte $100, recibirás $15 de comisión automáticamente.

---

## 🔒 Seguridad

- Contraseñas encriptadas
- Datos almacenados en servidor seguro
- Sesiones protegidas
- Panel admin protegido con contraseña
- Todas las transacciones registradas

---

## 📞 Soporte

Para cambiar la contraseña del panel admin o reportar problemas, contacta al desarrollador.

---

## 🎯 Flujo Completo de Ejemplo

1. **Usuario A se registra** → Recibe código `REFUSA123`
2. **Usuario A hace recarga** → Saldo actualizado
3. **Usuario A invierte $100** → Espera 15 días
4. **Usuario B se registra** con código `REFUSA123`
5. **Usuario A recibe comisión** → $10 (10% de $100)
6. **Usuario B hace recarga** → Saldo actualizado
7. **Usuario B invierte $200** → Usuario A recibe $30 más (15% de $200)
8. **Después de 15 días** → Usuario A reclama $60 de ganancias
9. **Usuario A retira** → Dinero transferido a su cuenta

---

## 📊 Datos Técnicos

- **Backend**: Node.js + Express + PostgreSQL
- **Frontend**: React Native + Expo
- **API**: tRPC
- **Base de Datos**: PostgreSQL
- **Hosting**: Manus Cloud

---

**Versión**: 1.0.0  
**Fecha**: Abril 2026  
**Estado**: Producción

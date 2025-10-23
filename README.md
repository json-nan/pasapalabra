# Pasapalabra Streaming Game

Un juego de Pasapalabra optimizado para streaming en OBS con soporte multijugador en tiempo real.

## 🚀 Características

- **Interfaz optimizada para OBS**: Diseño visual mejorado para streaming
- **Sincronización en tiempo real**: Múltiples clientes conectados simultáneamente
- **Sistema de puntuación**: Puntos por respuestas correctas/incorrectas
- **Efectos de sonido**: Audio feedback para mejor experiencia
- **Animaciones fluidas**: Transiciones y efectos visuales
- **Temporizador centralizado**: Control del servidor para evitar desincronización
- **Panel de control**: Interfaz completa para gestionar el juego
- **Widget para OBS**: Vista limpia para mostrar en stream

## 🎮 Cómo usar

### Instalación

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

### Producción

```bash
npm start
```

### Acceso

1. **Panel de Control**: `http://localhost:3000/panel-control.html?id=NOMBRE_DEL_JUEGO`
2. **Widget OBS**: `http://localhost:3000/obs-widget.html?id=NOMBRE_DEL_JUEGO`

## 🎯 Funcionalidades del Juego

### Panel de Control
- Crear/Unirse a juegos con ID personalizado
- Control completo del juego (iniciar, pausar, reiniciar)
- Selección de letras con un clic
- Marcado de respuestas (correcta/incorrecta)
- Visualización de puntuación en tiempo real
- Enlaces para copiar (panel y OBS)

### Widget OBS
- Vista circular del rosco de letras
- Temporizador visual con alertas de tiempo
- Puntuación en tiempo real
- Efectos visuales para respuestas
- Diseño optimizado para overlay de streaming

### Servidor
- Gestión de múltiples juegos simultáneos
- Sincronización de estado en tiempo real
- Temporizador centralizado
- Sistema de puntuación
- Limpieza automática de juegos vacíos

## 🎨 Personalización

### Colores
Los colores se pueden personalizar modificando las variables CSS en `:root`:

```css
:root {
    --pending-color: #8D65C5;    /* Letras pendientes */
    --current-color: #F9C846;    /* Letra actual */
    --correct-color: #4FB286;    /* Respuestas correctas */
    --incorrect-color: #D64550;  /* Respuestas incorrectas */
}
```

### Temporizador
El tiempo por defecto es de 4 minutos. Se puede cambiar en el servidor:

```javascript
timerSeconds: 4 * 60, // Cambiar aquí
```

## 🔧 Configuración para OBS

1. Añadir fuente "Navegador" en OBS
2. URL: `http://localhost:3000/obs-widget.html?id=TU_JUEGO`
3. Ancho: 600px, Alto: 600px
4. Habilitar "Interactuar" si necesitas control desde OBS

## 📊 Sistema de Puntuación

- **Respuesta correcta**: +10 puntos
- **Respuesta incorrecta**: -5 puntos
- **Puntuación mínima**: 0 puntos

## 🛠️ Tecnologías

- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: HTML5 + CSS3 + JavaScript (Vanilla)
- **Comunicación**: WebSockets para tiempo real
- **Audio**: Web Audio API para efectos de sonido

## 🐛 Solución de Problemas

### El temporizador no se sincroniza
- Asegúrate de que el servidor esté ejecutándose
- Verifica la conexión WebSocket en la consola del navegador

### Los sonidos no funcionan
- Algunos navegadores requieren interacción del usuario antes de reproducir audio
- Haz clic en el juego antes de empezar

### El juego no se actualiza
- Verifica que el ID del juego sea el mismo en ambas URLs
- Recarga la página si es necesario

## 📝 Changelog

### v2.0.0
- ✅ Sincronización de temporizador mejorada
- ✅ Sistema de puntuación implementado
- ✅ Efectos de sonido añadidos
- ✅ Animaciones y transiciones mejoradas
- ✅ Interfaz optimizada para OBS
- ✅ Manejo de errores robusto
- ✅ Limpieza automática de recursos

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia ISC.
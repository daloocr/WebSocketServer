const WebSocket = require('ws');

// Conéctate al servidor WebSocket que acabas de iniciar.
const ws = new WebSocket('ws://localhost:8088');

// Establece una variable para el contador
let counter = 0;

ws.onopen = () => {
    console.log('Conexion establecida con el servidor WebSocket.');
    
    // Inicia el envío de mensajes en un bucle
    const sendInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            counter++;
            const message = `Mensaje de cliente ${counter}`;
            console.log(`Enviando: ${message}`);
            ws.send(message);
        } else {
            // Si la conexión no está abierta, detén el intervalo
            clearInterval(sendInterval);
            console.log('Conexión cerrada. Deteniendo el envío de mensajes.');
        }
    }, 1000); // Envía un mensaje cada 1000 milisegundos (1 segundo)
};

ws.onmessage = (event) => {
    console.log(`Mensaje recibido del servidor: ${event.data}`);
};

ws.onclose = (event) => {
    console.log(`Conexión cerrada. Código: ${event.code}, Razón: ${event.reason}`);
};

ws.onerror = (error) => {
    console.error('Error en la conexión WebSocket:', error.message);
};

// index.js
const WebSocketProxy = require('./WebSocketServer');
const config = require('./config');

async function main() {
    try {
        const proxy = new WebSocketProxy(config);
        await proxy.listen();
    } catch (error) {
        console.error('Error al iniciar el servidor WebSocket:', error.message);
    }
}

main();

// config.js
module.exports = {
    // Puerto en el que escuchará el servidor WebSocket.
    wsPort: 8080,

    // Método de autenticación ('none', 'jwt', 'basic').
    authMethod: 'none',

    // Secreto para firmar y verificar tokens JWT. Solo necesario si authMethod es 'jwt'.
    // jwtSecret: 'mi_super_secreto_seguro_e_inviolable',

    // Credenciales para autenticación básica. Solo necesarias si authMethod es 'basic'.
    // El formato es 'usuario:contraseña' codificado en Base64.
    // auth: 'dXN1YXJpbzpwYXNzd29yZA==', 
    
    // Opciones para la compresión de mensajes WebSocket.
    enableWsCompression: true
};

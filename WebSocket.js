'use strict';

const querystring = require('querystring'),
    WebSocket = require('ws'),
    jwt = require('jsonwebtoken'),
    fs = require('fs');

class WebSocket {
    constructor(config) {
        // web socket stuff
        this.WebSocketServer = {};
        this.wss = {};
        if (!config.wsPort) {
            throw new Error("web socket port needed, please set e.g. {wsPort: 9999}");
        }
        this.port = config.wsPort;

        // tracking variables
        this.clients = {}; // Mantiene un registro de los clientes WebSocket conectados

        // config and default settings
        this.auth = config.auth;
        this.authMethod = config.authMethod;
        this.jwtSecret = config.jwtSecret;

        this.enableWsCompression = config.enableWsCompression !== undefined ? config.enableWsCompression : true;
    }

    async listen() {
        // setup websocket server
        this.WebSocketServer = WebSocket.Server;
        this.wss = new this.WebSocketServer({
            port: this.port,
            verifyClient: (info, callback) => this._verifyClient(info, callback),
            perMessageDeflate: this.enableWsCompression ? {
                zlibDeflateOptions: {
                    chunkSize: 1024,
                    memLevel: 7,
                    level: 5
                },
                zlibInflateOptions: {
                    chunkSize: 10 * 1024
                },
                clientNoContextTakeover: true,
                serverNoContextTakeover: true,
                serverMaxWindowBits: 10,
                threshold: 1024
            } : false
        });

        console.log(`listening on web socket on port ${this.port} with compression ${this.enableWsCompression ? 'enabled' : 'disabled'}`);

        this.wss.on('connection', (ws, req) => {
            this._registerClient(ws, req);
        });

        this.wss.on('error', (err) => {
            console.error('something went wrong with WebSocketServer: ' + err);
        });
    }

    _registerClient(ws, req) {
        console.log(`got new incoming web socket connection: ${req.url}`);
        if (req.url) {
            let query = querystring.parse(req.url.slice(req.url.indexOf('?') + 1));
            let clientId = query.clientId || `client_${Date.now()}`;

            // Storing the client and its info
            this.clients[clientId] = this._clientFromWebsocket(ws, clientId);

            ws.on('close', (code, reason) => {
                console.log(`Client ${clientId} disconnected. Code: ${code}, Reason: ${reason}`);
                this._disconnectClient(clientId);
            });

            ws.on('error', (err) => {
                console.error(`WebSocket error for ${clientId}: ${err.message}`);
            });

            console.log(`Client ${clientId} is now connected.`);

            // Example: sending a welcome message to the new client
            ws.send('Welcome! You are now connected to the WebSocket proxy.');
        }
    }

    _disconnectClient(clientId) {
        if (this.clients[clientId]) {
            delete this.clients[clientId];
            console.log(`Removed client ${clientId} from the active connection pool.`);
        }
    }

    _clientFromWebsocket(ws, clientId) {
        return {
            ws: ws,
            clientId: clientId,
            createdAt: new Date()
        };
    }

    _verifyClient(info, callback) {
        console.log(`Verifying client. Auth method: ${this.authMethod}.`);

        if (this.authMethod === 'none') {
            console.log('No authentication required. Accepting client.');
            return callback(true);
        }

        const authHeader = info.req.headers.authorization;

        if (!authHeader) {
            console.warn(`Authorization header missing. Rejecting 401`);
            return callback(false, 401, "Unauthorized: Authorization header missing");
        }

        if (this.authMethod === 'jwt') {
            if (!this.jwtSecret) {
                console.error('JWT authentication is enabled, but no jwtSecret is configured. Rejecting 500');
                return callback(false, 500, "Server Configuration Error: JWT secret not set");
            }
            const parts = authHeader.split(' ');
            if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
                const token = parts[1];
                try {
                    const decoded = jwt.verify(token, this.jwtSecret);
                    console.log(`JWT token validated successfully for user: ${decoded.username || (decoded.sub || 'unknown user')}`);
                    return callback(true);
                } catch (err) {
                    console.warn(`Invalid JWT token: ${err.message}. Rejecting 401`);
                    return callback(false, 401, `Unauthorized: ${err.message}`);
                }
            } else {
                console.warn(`Malformed Authorization header for JWT. Rejecting 401`);
                return callback(false, 401, "Unauthorized: Malformed token");
            }
        } else if (this.authMethod === 'basic') {
            const expectedAuth = 'Basic ' + this.auth;
            if (!this.auth) {
                console.error('Basic authentication is enabled, but no credentials configured. Rejecting 500');
                return callback(false, 500, "Server Configuration Error: Basic auth credentials not set");
            }
            if (authHeader !== expectedAuth) {
                console.warn(`Unauthorized client connection (Basic Auth). Rejecting 401`);
                return callback(false, 401, "Unauthorized");
            }
            console.log('Basic authentication successful.');
            return callback(true);
        } else {
            console.error(`Unknown authentication method: ${this.authMethod}. Rejecting 500`);
            return callback(false, 500, "Server Configuration Error: Unknown auth method");
        }
    }
}

module.exports = WebSocket;

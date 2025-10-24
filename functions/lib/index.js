const functions = require('firebase-functions');
const { createServer } = require('../../dist/server/node-build.mjs');
const app = createServer();
exports.api = functions.https.onRequest(app);
//# sourceMappingURL=index.js.map
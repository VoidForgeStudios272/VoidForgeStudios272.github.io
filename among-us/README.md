# VoidForge Among Us

This folder contains a direct copy of the source files from arizkhalid/among-us-clone, integrated into VoidForge Studios. The upstream MIT LICENSE and original source files are retained.

- frontend/ — React + Phaser 3 game client and all public game assets.
- backend/ — Node.js + Express + Socket.IO multiplayer server.
- misc/ — upstream supporting files.

## Local development

Start the backend: cd backend && npm ci && ALLOWED_ORIGIN=http://localhost:8080 npm start.
Start the frontend in another terminal: cd frontend && npm ci && npm run dev.

## Deployment

GitHub Pages builds the frontend into /among-us/. The Node.js backend must be deployed separately. The root render.yaml is configured for among-us/backend; set the repository Actions variable AMONG_US_BACKEND_URL to the deployed HTTPS origin.

Upstream project: https://github.com/arizkhalid/among-us-clone

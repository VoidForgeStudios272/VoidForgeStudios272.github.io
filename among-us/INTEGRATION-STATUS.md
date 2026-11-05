# VoidForge Among Us integration

The complete upstream project is copied directly into this folder. There is no Git submodule.

- Upstream: https://github.com/arizkhalid/among-us-clone
- Frontend: frontend/ (React + Phaser 3 + Vite)
- Backend: backend/ (Node.js + Express + Socket.IO)
- Maps, sprite sheets, fonts, and images: frontend/public/assets/
- License and attribution: LICENSE

## Local development

Backend terminal:
    cd among-us/backend
    npm ci
    ALLOWED_ORIGIN=http://localhost:8080 npm start

Frontend terminal:
    cd among-us/frontend
    npm ci
    npm run dev

## Production

GitHub Pages builds the frontend and publishes it at /among-us/. Set repository Settings → Pages → Build and deployment → Source to GitHub Actions.

The multiplayer backend must be deployed separately because GitHub Pages cannot run Node.js. The root render.yaml is configured for among-us/backend. After deploying, add the repository Actions variable AMONG_US_BACKEND_URL with the backend HTTPS origin.

## Upstream status

The source repository's README lists lobby UX, the task system, and voting bugs as TODOs. Those upstream limitations are not represented as completed features here.

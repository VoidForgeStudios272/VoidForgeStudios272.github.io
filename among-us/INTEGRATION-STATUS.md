# VoidForge Among Us integration status

The upstream project is attached at `among-us/engine` as a Git submodule pinned to the upstream `main` commit. This keeps the original source tree and history intact without flattening or duplicating hundreds of upstream files.

- Upstream: https://github.com/arizkhalid/among-us-clone
- Frontend: React 19 + Phaser 3 + Vite
- Backend: Node.js + Express + Socket.IO
- License: upstream MIT license is retained inside the submodule.

## Deployment

1. In GitHub repository Settings → Pages, set Build and deployment → Source to **GitHub Actions**.
2. Deploy the backend using the root `render.yaml` Blueprint (or another Node.js host).
3. Add repository Actions variable `AMONG_US_BACKEND_URL` with the backend HTTPS origin.
4. Run the `Deploy VoidForge Pages` workflow.

The Pages workflow checks out the submodule, prepares relative paths, builds the frontend, and publishes the built game at `/among-us/` while keeping the rest of VoidForge intact.

The Node backend is not hosted by GitHub Pages. Until a backend URL is configured and deployed, online rooms will not connect.

## Asset handling

The frontend loads the upstream binary game artwork from the original repository at runtime. The build preparation removes those binary copies from the generated Pages artifact; source code and JSON map/atlas data remain in the submodule. Asset availability therefore depends on the upstream repository remaining public.

## Important

The upstream project's README lists lobby UX, task systems, and voting bugs as TODOs. The integration does not claim those unfinished upstream features have been fixed. The previous VoidForge 3D prototype remains in the parent commit history but is no longer the intended game engine.

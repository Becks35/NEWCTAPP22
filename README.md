
# Contribution Hub - Developer Guide

This project follows a decoupled full-stack architecture simulated in a single-directory environment for ease of use.

## Project Structure
- `/backend`: **Simulated Node.js Environment**. Handles logic, validation, and data persistence using `localStorage` as a DB proxy.
- `/frontend`: **React 19 Application**. Communicates with the backend exclusively through the `apiService.ts`.
- `types.ts`: Shared schemas for both layers.

## Technical Separation
In a real production environment:
1. Move the `backend/` folder to a Node.js project. Use an Express/Fastify router to map the functions in `mockServer.ts` to HTTP endpoints.
2. Replace `localStorage` with a database like PostgreSQL or MongoDB.
3. Update `frontend/apiService.ts` to use real `fetch()` or `axios` calls to your Node.js server.

## Default Admin Credentials
- **Jersey Number**: `ADMIN`
- **Password**: `admin`

## Development
- Uses Tailwind CSS for high-fidelity UI.
- React 19 for declarative components.
- Modularized dashboard logic for scalability.

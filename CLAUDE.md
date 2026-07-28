# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**jsmodbus** — A Node.js Modbus TCP/RTU protocol implementation (client and server). Supports function codes 1-6, 15, 16. Published as `jsmodbus` on npm.

## Commands

```bash
pnpm install          # Install dependencies
pnpm run build        # Compile TypeScript (npx tsc) → dist/
pnpm run lint         # ESLint (yarn eslint .) — src/ only
pnpm run test         # Lint + build + mocha test/*.test.js
pnpm run watch        # Lint + build + mocha --watch
pnpm run cov          # Coverage with nyc
```

Run a single test (using mocha with ts-node):
```bash
npx mocha test/read-coils.test.ts
```

## Architecture

### Layered Design

```
ModbusClient (abstract) ── ModbusTCPClient / ModbusRTUClient
ModbusServer (abstract) ── ModbusTCPServer / ModbusRTUServer
```

The main entry point is `src/modbus.ts` which re-exports everything under a unified API.

### Key Layers

1. **Request/Response Bodies** (`src/request/`, `src/response/`) — Protocol-neutral data objects for each function code. Created via `RequestFactory` / `ResponseFactory`.

2. **Protocol Framing** — TCP (`tcp-request.ts`, `tcp-response.ts`) adds MBAP header; RTU (`rtu-request.ts`, `rtu-response.ts`) adds CRC and slave ID.

3. **Handlers** — Client-side request/response handlers manage queuing and matching (e.g., `tcp-client-request-handler.ts`, `client-response-handler.ts`). Server-side handlers parse incoming and emit events.

4. **Client/Server** — `modbus-client.ts` is the abstract client with promise-based API (`readCoils`, `writeRegisters`, etc.). `modbus-server.ts` is an EventEmitter-based server.

### Data Flow

- **Client**: User call → RequestBody → Handler registers promise → Socket write → Handler receives & matches response → Promise resolves with metrics
- **Server**: Socket data → Handler parses request → Server emits event (e.g., `readCoils`) → User callback provides response → Handler sends response

### Key Directories

- `src/codes/` — Function code enum and type guards
- `src/constants/` — Modbus protocol limits (UINT16_MAX, COIL_MIN/MAX, etc.)
- `src/errors/` — Exception codes, error type guards
- `examples/javascript/` and `examples/typescript/` — Usage examples

## Code Style

- TypeScript with strict mode, ES6 target, CommonJS modules
- Prettier: no semicolons, single quotes, 2-space indent, trailing comma none, printWidth 100
- ESLint: `@typescript-eslint/no-explicit-any` and `@typescript-eslint/no-unused-vars` are off

## Debugging

Uses the `debug` module under the `mb` namespace:
```bash
DEBUG=mb* node your-script.js
```

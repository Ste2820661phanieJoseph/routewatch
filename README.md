# routewatch

Lightweight Express middleware that logs and visualizes API route usage patterns in real time.

---

## Installation

```bash
npm install routewatch
```

---

## Usage

```typescript
import express from "express";
import { routewatch } from "routewatch";

const app = express();

// Add routewatch middleware before your routes
app.use(routewatch());

app.get("/users", (req, res) => {
  res.json({ users: [] });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

By default, routewatch logs each incoming request with its method, path, status code, and response time. A live summary of route hit counts is printed to the console at a configurable interval.

### Options

```typescript
app.use(
  routewatch({
    interval: 10000,   // Summary print interval in ms (default: 5000)
    logRequests: true, // Log individual requests (default: true)
    colorize: true,    // Colorized console output (default: true)
  })
);
```

---

## Features

- Zero dependencies beyond Express
- Real-time route hit counters
- Response time tracking per route
- Configurable logging intervals
- TypeScript-first with full type support

---

## License

[MIT](./LICENSE)
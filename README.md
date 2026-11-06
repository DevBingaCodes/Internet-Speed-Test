# Internet Speed Test API

This API provides test traffic for a browser based speed test. The visitor's browser measures elapsed time and calculates download speed, upload speed, ping, and jitter; the backend does not measure its own network connection or store results.

## Run locally

```sh
npm install
npm run dev
```

Set `FRONTEND_ORIGIN` to the exact deployed frontend origin (for example, `https://example.com`) to allow browser requests from that site. Local development origins `http://localhost:3000` and `http://localhost:5173` are also allowed. Deploy behind HTTPS for production use.

## Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/speedtest/health` | API health check |
| GET | `/speedtest/download?bytes=10485760` | Stream download data (10 MiB by default, maximum 100 MiB) |
| POST | `/speedtest/upload` | Receive a raw request body (maximum 100 MiB) and return its byte count |
| GET | `/speedtest/ping` | Return a small uncached response for latency sampling |

For accurate measurements, the browser should disable caching, time the complete download or upload with a monotonic clock, and calculate `bytes * 8 / seconds / 1,000,000` for Mbps. Use multiple ping samples; their average is latency and their variation can be used as jitter. Results are estimates of the visitor's route to this API server and can vary with server location and network conditions.

# Skirill Speed Test frontend

The React app measures the visitor's connection from their browser using the speed test API.

## Run locally

Start the API from the repository root (`npm run dev`), then run the frontend:

```sh
cd client
npm install
npm run dev
```

The frontend defaults to `http://localhost:3000` for the API. Set `VITE_API_URL` in `client/.env` when the API runs at another address, for example:

```env
VITE_API_URL=https://your-api.example.com
```

For a deployed frontend, set the same `VITE_API_URL` build variable and set the API's `FRONTEND_ORIGIN` to the frontend's exact HTTPS origin.

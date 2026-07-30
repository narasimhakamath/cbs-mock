# CBS Mock

Mock Core Banking System for local integration testing.

## Structure

- `server/` — Express + Mongoose API (port 4000)
- `client/` — React + Vite + Tailwind UI (port 5173, proxies `/api` to server)

## Run

Requires MongoDB running locally (default `mongodb://127.0.0.1:27017/cbs_mock`).

```bash
# terminal 1
cd server && npm run dev

# terminal 2
cd client && npm run dev
```

## Physical Accounts API

| Method | Path                | Description                          |
| ------ | ------------------- | ------------------------------------ |
| GET    | /api/accounts        | List accounts (paginated, searchable)|
| GET    | /api/accounts/:id     | Get one account                      |
| POST   | /api/accounts        | Create account (balance starts at 0) |
| PATCH  | /api/accounts/:id     | Update bank/country/currency/status  |
| DELETE | /api/accounts/:id     | Delete account                       |

Account numbers are system-generated, unique, 16-digit strings.

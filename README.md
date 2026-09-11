# Traffic Insights

Traffic Insights is a small dashboard for road traffic data from Eurostat. It shows country traffic and vehicle type distribution by year.

The project has three parts:

- React and Vite frontend
- Express API
- PostgreSQL database

## Run locally with Docker

You need Docker Desktop running.

From the project root:

```bash
docker compose up --build -d
```

Open the app at [http://localhost](http://localhost).

The API runs at [http://localhost:3000](http://localhost:3000). For example:

```text
http://localhost:3000/api/traffic/years
```

On first startup, the API creates the required database tables and views. It then starts a background Eurostat sync. The dashboard may show no data for a short time while that sync is running.

## Stop the project

```bash
docker compose down
```

To also remove the local database data:

```bash
docker compose down -v
```

## Useful commands

Check running containers:

```bash
docker compose ps
```

View backend logs:

```bash
docker compose logs -f backend
```

Rebuild after code changes:

```bash
docker compose up --build -d
```

## Backend jobs

The backend refreshes Eurostat data when it starts and then runs again every day at 11:30 AM, Asia/Dubai time.

The refresh uses upserts, so new records are added and existing records are updated. If more than one backend instance is running, PostgreSQL allows only one of them to run the scheduled refresh.

## Environment variables

The Docker setup uses these database variables:

```text
DB_USER=stutisharma
DB_PASSWORD=changeme
```

You can create a `.env` file in the project root to override them for local use:

```text
DB_USER=your_user
DB_PASSWORD=your_password
```

## Tests

Run backend tests from the API folder:

```bash
cd back-end/traffic-analytics-api
npm test -- --runInBand
```

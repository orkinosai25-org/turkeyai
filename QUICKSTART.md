# TürkiyeAI Quick Start Guide

Get TürkiyeAI up and running in 10 minutes!

## Prerequisites

- Node.js 24 LTS ([Download](https://nodejs.org/))
- Git ([Download](https://git-scm.com/))
- Azure subscription (for production)

## Local Development (Without Azure)

### 1. Clone and Install

```bash
git clone https://github.com/orkinosai25-org/turkeyai.git
cd turkeyai
npm run install-all
```

This will install dependencies for:
- Root project
- Server (backend)
- Client (frontend)

### 2. Start Development Servers

```bash
npm run dev
```

This starts both:
- **Backend:** http://localhost:5000
- **Frontend:** http://localhost:3000

The frontend will automatically open in your browser!

### 3. Explore the App

- **Home:** Welcome page with brand information
- **Destinations:** Browse Turkish travel destinations
- **AI Travel Agent:** Chat interface (requires Azure OpenAI)

### 4. Test the API

```bash
# Health check
curl http://localhost:5000/api/health

# Get destinations
curl http://localhost:5000/api/destinations

# Get specific destination
curl http://localhost:5000/api/destinations/1
```

## With Azure AI (Full Features)

### 1. Set Up Azure Services

Follow the detailed guide in [docs/AZURE_SETUP.md](docs/AZURE_SETUP.md) to create:
- Azure OpenAI Service
- Azure AI Search
- Azure PostgreSQL Database

### 2. Configure Environment

```bash
# Copy example environment file
cp server/.env.example server/.env

# Edit with your Azure credentials
nano server/.env
```

Update these values:
```env
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4

AZURE_SEARCH_ENDPOINT=https://your-search.search.windows.net
AZURE_SEARCH_API_KEY=your-search-key

DB_HOST=your-db.postgres.database.azure.com
DB_USER=your-user
DB_PASSWORD=your-password
```

### 3. Initialize Database

```bash
# Connect to PostgreSQL
psql "host=your-db.postgres.database.azure.com \
      port=5432 \
      dbname=turkeyai \
      user=your-user \
      sslmode=require"

# Run schema (creates tables and sample data)
\i database/schema.sql
\q
```

### 4. Set Up Azure AI Search Index

```bash
cd server

# Create the search index
npm run search:create-index

# Populate with resort data from database
npm run search:populate

# Verify index was created
npm run search:index-info
```


### 5. Start the App

```bash
cd ..
npm run dev
```

Now the AI chat will work with Azure OpenAI and semantic search! 🎉

### 6. (Optional) Enable Real Hotel Data via HotelBeds

By default the hotel search pages show static demo hotel data.  To enable live hotel data and real bookings:

1. Register for a free account at [developer.hotelbeds.com](https://developer.hotelbeds.com)
2. Obtain your **API Key** and **API Secret** from the developer portal
3. Edit `server/appsettings.json` and fill in the `HotelBeds` section:

```json
"HotelBeds": {
  "ApiKey": "your-hotelbeds-api-key",
  "ApiSecret": "your-hotelbeds-api-secret",
  "BaseUrl": "https://api.test.hotelbeds.com",
  "Language": "ENG",
  "Currency": "GBP"
}
```

**Test vs Production:**

| Environment | BaseUrl | Data |
|---|---|---|
| Test / Sandbox | `https://api.test.hotelbeds.com` | Simulated – no real charges |
| **Production** | `https://api.hotelbeds.com` | **Real hotel data & real bookings** |

Switch `BaseUrl` to `https://api.hotelbeds.com` and replace the credentials with your production API Key / Secret to go live.

4. Verify the setup:
```bash
curl http://localhost:5000/api/hotels/status
```

The response will confirm whether HotelBeds is configured and which environment is active.



## Project Structure

```
turkeyai/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Page components
│   │   └── App.js       # Main app
│   └── public/
│
├── server/              # Node.js backend
│   ├── config/          # Azure service configs
│   ├── routes/          # API routes
│   └── server.js        # Express app
│
├── database/            # Database schemas
├── docs/                # Documentation
└── package.json         # Root scripts
```

## Common Tasks

### Run Backend Only

```bash
npm run server
```

### Run Frontend Only

```bash
npm run client
```

### Build for Production

```bash
cd client
npm run build
```

### View Logs

```bash
# Backend logs appear in terminal where you ran `npm run dev`
# Frontend logs in browser console (F12)
```

## Troubleshooting

### Port Already in Use

If port 3000 or 5000 is in use:

```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

### Azure Connection Errors

1. Check credentials in `server/.env`
2. Verify Azure resources are running
3. Check firewall rules (especially for PostgreSQL)

### Frontend Not Loading

1. Clear browser cache
2. Delete `client/node_modules` and reinstall:
   ```bash
   cd client
   rm -rf node_modules
   npm install
   ```

### Chat Not Working

- Verify Azure OpenAI is configured in `.env`
- Check deployment name matches your Azure OpenAI deployment
- Ensure API key is valid

## Next Steps

1. **Customize Destinations:** Edit `server/routes/destinations.js`
2. **Modify UI:** Update React components in `client/src/`
3. **Add Features:** Create new routes and components
4. **Deploy:** Follow [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Development Tips

- **Hot Reload:** Both frontend and backend support hot reload
- **React DevTools:** Install for better React debugging
- **Postman:** Use for API testing
- **VS Code:** Recommended IDE with ESLint extension

## Resources

- 📚 [Full README](README.md)
- 🔧 [Azure Setup Guide](docs/AZURE_SETUP.md)
- 📡 [API Documentation](docs/API.md)
- 🚀 [Deployment Guide](docs/DEPLOYMENT.md)
- 🤝 [Contributing Guide](CONTRIBUTING.md)

## Support

- Issues: [GitHub Issues](https://github.com/orkinosai25-org/turkeyai/issues)
- Email: contact@orkinosai.com
- Documentation: See `docs/` folder

---

**Happy Coding! 🇹🇷🌊**

*TürkiyeAI - Powered by OrkinosAI*

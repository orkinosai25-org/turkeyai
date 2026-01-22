# 🌊 TürkiyeAI - AI-Powered Turkish Travel SaaS

> **Your AI Travel Expert for Türkiye**  
> *Powered by OrkinosAI*

[![Azure](https://img.shields.io/badge/Azure-0078D4?style=flat&logo=microsoft-azure&logoColor=white)](https://azure.microsoft.com)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat&logo=react&logoColor=white)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Azure-336791?style=flat&logo=postgresql&logoColor=white)](https://azure.microsoft.com/en-us/services/postgresql/)

---

## 🎯 Overview

**TürkiyeAI** is an AI-powered Turkish travel discovery and planning platform, delivered as a SaaS AI travel agent. Built on Microsoft Azure, it provides intelligent travel recommendations for Turkish destinations including Bodrum, Marmaris, Fethiye, Antalya, Cappadocia, and more.

### 🏢 Company & Ownership

- **Parent Company:** OrkinosAI Ltd
- **Core Tech Brand:** OrkinosAI (Azure-native AI & SaaS platform)
- **Consumer Travel Brand:** TürkiyeAI
- **Domain:** turkiyeai.travel
- **Positioning:** "TürkiyeAI – Your AI Travel Expert for Türkiye"
- **Endorsement:** Powered by OrkinosAI

### 📖 Brand Story

**Orkinos** means "tuna" in Turkish – symbolizing **intelligence**, **speed**, and **navigation**. The platform is built on Microsoft Azure, inspired by azure/Aegean waves. TürkiyeAI represents intelligent navigation through Turkish travel using AI.

---

## 🚀 What We're Building

An AI-powered Turkish travel discovery & planning platform with:

- 🤖 **Conversational AI Travel Agent** (Azure AI / Azure OpenAI)
- 🏖️ **Resort & Destination Intelligence** (facts, amenities, distances, policies)
- ✈️ **AI-Driven Trip Planning** and recommendations
- 🔍 **Semantic Search** over Turkish travel content (Azure AI Search)
- 📋 **Itinerary Building** (hotel + flight + car + experiences – planning only)

### ⚠️ What We Are NOT

- ❌ **Not a tour operator or travel agency**
- ❌ **We do not take payments or issue tickets**
- ❌ **We do not require ATOL/ABTA** at this stage
- ℹ️ Bookings (if any) are redirected to licensed third-party providers (OTA, airlines, DMCs) or handled by partners

---

## 💼 Business Model (Phase 1)

- 🔹 SaaS AI travel agent
- 🔹 Affiliate/referral revenue
- 🔹 B2C (travellers) initially
- 🔹 B2B later (travel agents, hotels, DMCs using the AI agent)

---

## 🧱 Technical Stack

### Frontend
- **Framework:** React 18.2
- **Routing:** React Router v6
- **Styling:** CSS3 (Azure-inspired color palette)
- **HTTP Client:** Axios

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **API Style:** RESTful

### Database
- **Primary DB:** Azure PostgreSQL
- **ORM/Client:** pg (node-postgres)

### AI & Search
- **LLM:** Azure OpenAI (GPT-4)
- **Search:** Azure AI Search (semantic search, RAG)
- **AI Platform:** Azure AI Foundry

### Infrastructure
- **Cloud:** Microsoft Azure
- **Region:** Azure regions closest to Europe/Turkey

---

## 📁 Project Structure

```
turkeyai/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components (Home, Chat, Destinations)
│   │   ├── services/      # API service layer
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
├── server/                # Node.js backend
│   ├── config/           # Configuration files
│   │   ├── azureOpenAI.js    # Azure OpenAI client
│   │   ├── azureSearch.js    # Azure AI Search client
│   │   └── database.js       # PostgreSQL connection
│   ├── routes/           # API routes
│   │   ├── chat.js           # AI chat endpoint
│   │   ├── destinations.js   # Destinations API
│   │   └── search.js         # Semantic search
│   ├── models/           # Data models
│   ├── controllers/      # Business logic
│   ├── server.js         # Express app entry point
│   ├── .env.example      # Environment variables template
│   └── package.json
│
├── database/             # Database schemas and migrations
├── docs/                 # Documentation
├── package.json          # Root package.json
└── README.md
```

---

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 18+ and npm
- Azure subscription with:
  - Azure OpenAI Service
  - Azure AI Search
  - Azure PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/orkinosai25-org/turkeyai.git
cd turkeyai
```

### 2. Install Dependencies

```bash
# Install all dependencies (root, server, and client)
npm run install-all
```

### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp server/.env.example server/.env

# Edit server/.env with your Azure credentials
nano server/.env
```

Required environment variables:

```env
# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Azure AI Search
AZURE_SEARCH_ENDPOINT=https://your-search-service.search.windows.net
AZURE_SEARCH_API_KEY=your-search-api-key
AZURE_SEARCH_INDEX_NAME=turkeyai-travel-index

# Azure PostgreSQL
DB_HOST=your-postgres-server.postgres.database.azure.com
DB_PORT=5432
DB_NAME=turkeyai
DB_USER=your-admin-user
DB_PASSWORD=your-password
DB_SSL=true
```

### 4. Run Development Server

```bash
# Run both client and server concurrently
npm run dev

# Or run separately:
npm run server    # Backend only (port 5000)
npm run client    # Frontend only (port 3000)
```

### 5. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/api/health

---

## 🌐 API Endpoints

### Health Check
```
GET /api/health
```

### Chat with AI Agent
```
POST /api/chat
Body: {
  "message": "What's the best time to visit Bodrum?",
  "conversationHistory": []
}
```

### Get Destinations
```
GET /api/destinations
GET /api/destinations/:id
```

### Semantic Search
```
POST /api/search
Body: {
  "query": "beach resorts in Turkish Riviera",
  "top": 10
}
```

---

## 🎨 Brand Assets

### Color Palette (Azure-Inspired)

- **Primary Azure Blue:** `#0078d4`
- **Azure Light:** `#00a4ef`
- **Azure Dark:** `#005a9e`
- **Tuna Gray:** `#2d3748`
- **White:** `#ffffff`
- **Light Gray:** `#f3f2f1`

### Logo & Branding

- 🌊 Wave emoji represents azure/Aegean waves
- 🇹🇷 Turkish flag for Turkish focus
- Brand assets generated via Microsoft Copilot

---

## 📊 Database Schema

See [database/schema.sql](database/schema.sql) for the complete PostgreSQL schema including:

- Destinations
- Hotels & Resorts
- Experiences & Activities
- User interactions
- Search logs

---

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Azure

The application is designed to be deployed on:
- **Frontend:** Azure Static Web Apps or Azure App Service
- **Backend:** Azure App Service (Node.js)
- **Database:** Azure Database for PostgreSQL
- **AI Services:** Azure OpenAI Service + Azure AI Search

---

## 🔐 Security & Privacy

- All Azure credentials stored in environment variables
- HTTPS required for production
- No payment processing or sensitive user data storage
- Bookings redirected to licensed third-party providers

---

## 📝 License

Copyright © 2024 OrkinosAI Ltd. All rights reserved.

---

## 🤝 Contributing

This is a private project. For contributions, please contact OrkinosAI Ltd.

---

## 📞 Contact & Support

- **Website:** turkiyeai.travel
- **Tech Provider:** OrkinosAI Ltd
- **Email:** contact@orkinosai.com

---

## 🙏 Acknowledgments

- Built with **Microsoft Azure** cloud services
- AI powered by **Azure OpenAI**
- Inspired by the beauty of **Turkey** and the intelligence of the **Tuna (Orkinos)**

---

**TürkiyeAI** - Your AI Travel Expert for Türkiye 🇹🇷  
*Powered by OrkinosAI* 🌊
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

### 🌐 OrkinosAI Product Stack

**OrkinosAI** is building a multi-product AI business: travel discovery through TürkiyeAI, culturally aware assistance through Ebru, and a private model-development programme through SMTX.

| Product | Value proposition | Current stage |
|---------|-------------------|---------------|
| **TürkiyeAI** | Turkish travel discovery, destination intelligence, and itinerary planning, with a planned UK launch. Not a booking agency. | In development; this repository implements the Azure-based travel application. [Product website](https://turkiyeai.travel) |
| **Ebru** | Turkish and Islamic-aware AI assistant for culturally aware conversations and knowledge access. | Currently in testing, using Azure OpenAI; a separate product, not implemented in this repository. [Test website](https://ebru.sumotx.com) |
| **Supreme Model T‑X / SMTX** | Private Turkish-first LLM programme and intended base model layer for future OrkinosAI products. | Developing separately; future integration with TürkiyeAI and Ebru is a roadmap goal, not a current dependency. [Company website](https://www.orkinosai.com) |

The strategy is to validate useful applications first, then evaluate reusable retrieval, model customisation, and private deployment capabilities. Turkish and Islamic awareness describes Ebru's product focus; SMTX is intended as a broader model layer, not a religious-only assistant. Using third-party model APIs does not imply ownership of those models, and SMTX is not presented here as a trained or production-ready foundation model.

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

### NVIDIA-Aligned Technology Roadmap (Considering, Not Yet Integrated)

**Current implementation:** this repository integrates Azure OpenAI and Azure AI Search; it does not include NVIDIA SDKs, local model training, or NVIDIA GPU inference. Managed API usage alone does not establish NVIDIA runtime acceleration. The technologies below are being considered for the wider OrkinosAI/SMTX roadmap, not claimed as current TürkiyeAI or Ebru capabilities.

| Technology under consideration | Evaluation purpose |
|--------------------------------|--------------------|
| **NVIDIA NeMo Framework** | Evaluate model customisation and fine-tuning workflows for SMTX using licensed datasets and candidate base models. |
| **NeMo Megatron Core** | Consider distributed training and continued pretraining only if benchmarks, data readiness, and compute budgets justify scaling. |
| **TensorRT / TensorRT-ONNX Runtime** | Evaluate GPU inference optimisation for compatible exportable models using the ONNX Runtime TensorRT execution provider; not an optimisation path for hosted Azure OpenAI models. |
| **CUDA Toolkit** | Consider GPU development and profiling for future training and inference experiments. |
| **CUDA Python** | Evaluate Python-level GPU workflows where they offer measurable value beyond the chosen ML framework. |
| **cuDNN** | Consider GPU-accelerated neural-network primitives through compatible training frameworks. |

Evaluation milestones:

1. **Ground and benchmark:** improve retrieval and measure travel relevance, Turkish-language quality, source accuracy, safety, latency, and cost. For Ebru, review Islamic-source rights and answer quality before expanding knowledge collections.
2. **Pilot model customisation:** benchmark appropriately licensed open models, then evaluate NeMo fine-tuning on reviewed data. Compare quality and GPU costs against the current managed-API baseline before selecting a model or stack.
3. **Validate deployment:** profile compatible checkpoints with CUDA and TensorRT/ONNX Runtime; measure accuracy, memory, throughput, and cost before any product integration.
4. **Scale only with evidence:** consider Megatron Core and continued pretraining if smaller experiments demonstrate a need. Private or sovereign deployment remains a goal requiring controlled hosting, data access, updates, and a verified no-external-model-call mode.

#### NVIDIA Inception & Investor Positioning

For product discovery, describe **TürkiyeAI** as a travel application, **Ebru** as an assistant in testing, and **Supreme Model T‑X / SMTX** as a model programme in development. Keep current-use and runtime-acceleration fields tied to verified deployments; list roadmap technologies only as **considering** until adopted. These repository updates do not publish portal listings or confirm investor visibility.

Potential Inception support topics include NeMo training guidance, GPU/cloud options, model evaluation, and inference profiling. Recommendations or membership do not imply NVIDIA endorsement, guaranteed funding, GPU access, or deployed integrations.

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

- Node.js 24 LTS and npm
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
# Azure OpenAI Configuration
# By default, Azure settings are fetched from the OrkinosAI website
# Set USE_WEBSITE_SETTINGS=false to use only local environment variables
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# Settings Provider Configuration
USE_WEBSITE_SETTINGS=true  # Set to false to disable website settings fetching

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

**Note:** TürkiyeAI can automatically fetch Azure OpenAI settings from the OrkinosAI website. This allows centralized configuration management. If the website is unavailable, it falls back to local environment variables.

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
- **Settings Status:** http://localhost:5000/api/settings/status

---

## 🌐 API Endpoints

### Health Check
```
GET /api/health
```

### Settings Status
```
GET /api/settings/status
```
Returns the current Azure OpenAI configuration status (without exposing API keys)

### Refresh Settings
```
POST /api/settings/refresh
```
Clears the settings cache and forces a fresh fetch from the source

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

## 📊 Database & Search Schema

### PostgreSQL Database

See [database/schema.sql](database/schema.sql) for the complete PostgreSQL schema including:

- Destinations
- Hotels & Resorts
- Experiences & Activities
- User interactions
- Search logs

### Azure AI Search Index

See [database/SEARCH_INDEX.md](database/SEARCH_INDEX.md) for the Azure AI Search index schema:

- **Index Name**: `turkiyeai-resorts`
- **Fields**: 16 searchable/filterable fields
- **Semantic Search**: Enabled for natural language queries
- **Auto-suggest**: Enabled on resort names and amenities

#### Quick Start with Search Index

```bash
# Navigate to server directory
cd server

# Create the search index
npm run search:create-index

# Populate with data from PostgreSQL
npm run search:populate

# Check index status
npm run search:index-info

# Clear all documents (if needed)
npm run search:clear
```

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
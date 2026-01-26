# Azure Configuration Guide

This guide explains how to set up the required Azure services for TürkiyeAI.

## Prerequisites

- Azure subscription
- Azure CLI installed
- Appropriate permissions to create resources

## 1. Azure OpenAI Service

### Create Azure OpenAI Resource

```bash
# Set variables
RESOURCE_GROUP="turkeyai-rg"
LOCATION="eastus"
OPENAI_NAME="turkeyai-openai"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create Azure OpenAI resource
az cognitiveservices account create \
  --name $OPENAI_NAME \
  --resource-group $RESOURCE_GROUP \
  --kind OpenAI \
  --sku S0 \
  --location $LOCATION
```

### Deploy GPT-4 Model

1. Go to Azure Portal
2. Navigate to your Azure OpenAI resource
3. Go to "Model deployments" → "Create new deployment"
4. Select model: `gpt-4` or `gpt-4-turbo`
5. Name the deployment: `gpt-4`
6. Deploy

### Get Credentials

```bash
# Get endpoint
az cognitiveservices account show \
  --name $OPENAI_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "properties.endpoint" -o tsv

# Get API key
az cognitiveservices account keys list \
  --name $OPENAI_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "key1" -o tsv
```

## 2. Azure AI Search

### Create Azure AI Search Service

```bash
SEARCH_NAME="turkeyai-search"

az search service create \
  --name $SEARCH_NAME \
  --resource-group $RESOURCE_GROUP \
  --sku Standard \
  --location $LOCATION
```

### Get Search Credentials

```bash
# Get endpoint
echo "https://${SEARCH_NAME}.search.windows.net"

# Get admin key
az search admin-key show \
  --service-name $SEARCH_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "primaryKey" -o tsv
```

### Create Search Index

#### Option 1: Automated Setup (Recommended)

Use the provided script to create the index automatically:

```bash
cd server/config
node createSearchIndex.js create
```

This will create the `turkiyeai-resorts` index with the complete schema defined in `database/azure-search-index-schema.json`.

To verify the index was created:

```bash
node createSearchIndex.js info
```

#### Option 2: Manual Setup

You can also create the index via:
1. Azure Portal UI
2. REST API
3. Direct Azure SDK usage

#### Index Schema: turkiyeai-resorts

The index includes the following fields for AI-powered resort search and RAG:

**Core Fields:**
- `id` (Edm.String, key) - Unique resort identifier
- `resort_name` (Edm.String, searchable, sortable) - Resort/hotel name
- `region` (Edm.String, searchable, filterable, facetable) - Geographic region
- `description` (Edm.String, searchable) - Full resort description

**Amenities & Features:**
- `amenities` (Collection(Edm.String), searchable, filterable, facetable) - List of amenities (pool, spa, beach access, etc.)
- `vibe_tags` (Collection(Edm.String), searchable, filterable, facetable) - Atmosphere tags (luxury, family, romantic, etc.)

**Location & Logistics:**
- `distance_to_airport` (Edm.Double, filterable, sortable) - Distance in kilometers
- `latitude` (Edm.Double) - GPS latitude
- `longitude` (Edm.Double) - GPS longitude
- `location` (Edm.GeographyPoint, filterable, sortable) - Geographic point for proximity search

**Guest Preferences:**
- `family_friendly` (Edm.Boolean, filterable, facetable) - Suitable for families with children
- `adults_only` (Edm.Boolean, filterable, facetable) - Adults-only property

**Property Details:**
- `beach_type` (Edm.String, searchable, filterable, facetable) - Type of beach (sandy, pebble, rocky, etc.)
- `season_notes` (Edm.String, searchable) - Best time to visit and seasonal information
- `star_rating` (Edm.Int32, filterable, sortable, facetable) - Hotel star rating (1-5)
- `price_range` (Edm.String, filterable, facetable) - Indicative price range

**AI Features:**
- **Semantic Search**: Configured with semantic ranking for natural language queries
- **Auto-suggest**: Suggester on resort_name, region, and amenities
- **Scoring Profile**: Boosts results by star rating and relevant text matches

Full schema available in: `database/azure-search-index-schema.json`

#### Populate Index with Data

After creating the index, populate it with data from PostgreSQL:

```bash
cd server/config
node populateSearchIndex.js populate
```

This script:
- Fetches all active resorts from the PostgreSQL database
- Transforms data to match the index schema
- Uploads documents in batches to Azure AI Search

To clear the index:

```bash
node populateSearchIndex.js clear
```

## 3. Azure Database for PostgreSQL

### Create PostgreSQL Server

```bash
DB_SERVER_NAME="turkeyai-db"
ADMIN_USER="turkeyai_admin"
ADMIN_PASSWORD="YourSecurePassword123!" # Change this!

az postgres flexible-server create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME \
  --location $LOCATION \
  --admin-user $ADMIN_USER \
  --admin-password $ADMIN_PASSWORD \
  --sku-name Standard_B2s \
  --tier Burstable \
  --storage-size 32 \
  --version 14
```

### Configure Firewall

```bash
# Allow Azure services
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Allow your IP (for development)
MY_IP=$(curl -s https://api.ipify.org)
az postgres flexible-server firewall-rule create \
  --resource-group $RESOURCE_GROUP \
  --name $DB_SERVER_NAME \
  --rule-name AllowMyIP \
  --start-ip-address $MY_IP \
  --end-ip-address $MY_IP
```

### Create Database

```bash
az postgres flexible-server db create \
  --resource-group $RESOURCE_GROUP \
  --server-name $DB_SERVER_NAME \
  --database-name turkeyai
```

### Initialize Schema

```bash
# Connect to the database
psql "host=$DB_SERVER_NAME.postgres.database.azure.com \
      port=5432 \
      dbname=turkeyai \
      user=$ADMIN_USER \
      password=$ADMIN_PASSWORD \
      sslmode=require"

# Run the schema file
\i database/schema.sql
```

## 4. Update Environment Variables

After creating all resources, update your `server/.env` file:

```bash
# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://turkeyai-openai.openai.azure.com/
AZURE_OPENAI_API_KEY=your-openai-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4

# Azure AI Search
AZURE_SEARCH_ENDPOINT=https://turkeyai-search.search.windows.net
AZURE_SEARCH_API_KEY=your-search-api-key
AZURE_SEARCH_INDEX_NAME=turkeyai-travel-index

# Azure PostgreSQL
DB_HOST=turkeyai-db.postgres.database.azure.com
DB_PORT=5432
DB_NAME=turkeyai
DB_USER=turkeyai_admin
DB_PASSWORD=YourSecurePassword123!
DB_SSL=true
```

## 5. Cost Optimization

### Development Environment
- Use lower-tier SKUs for development
- Azure OpenAI: Pay-as-you-go pricing
- AI Search: Basic tier
- PostgreSQL: Burstable tier (B2s)

### Production Environment
- Scale up based on usage
- Enable monitoring and alerts
- Use reserved capacity for cost savings

## 6. Security Best Practices

1. **Use Azure Key Vault** for storing secrets
2. **Enable Managed Identity** for service-to-service authentication
3. **Use Private Endpoints** for database and AI services
4. **Enable Azure Monitor** for logging and monitoring
5. **Implement RBAC** for access control

## 7. Monitoring & Logging

Enable Application Insights:

```bash
az monitor app-insights component create \
  --app turkeyai-insights \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP \
  --application-type web
```

## Additional Resources

- [Azure OpenAI Documentation](https://learn.microsoft.com/azure/ai-services/openai/)
- [Azure AI Search Documentation](https://learn.microsoft.com/azure/search/)
- [Azure Database for PostgreSQL Documentation](https://learn.microsoft.com/azure/postgresql/)

# TürkiyeAI Deployment Guide

This guide covers deploying TürkiyeAI to Azure.

## Prerequisites

- Azure subscription
- Azure CLI installed and configured
- Node.js 18+ installed locally
- Git

## Deployment Options

### Option 1: Azure App Service (Recommended)

This option deploys both frontend and backend to Azure App Service.

#### 1. Create Azure Resources

First, create all required Azure resources following [AZURE_SETUP.md](AZURE_SETUP.md).

#### 2. Create App Service

```bash
# Variables
RESOURCE_GROUP="turkeyai-rg"
APP_SERVICE_PLAN="turkeyai-plan"
WEB_APP_NAME="turkeyai-web"
LOCATION="eastus"

# Create App Service Plan (Linux)
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku B2 \
  --is-linux

# Create Web App (Node.js 18)
az webapp create \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --runtime "NODE|18-lts"
```

#### 3. Configure App Settings

```bash
# Configure environment variables
az webapp config appsettings set \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    NODE_ENV=production \
    PORT=8080 \
    AZURE_OPENAI_ENDPOINT="https://your-openai.openai.azure.com/" \
    AZURE_OPENAI_API_KEY="your-key" \
    AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4" \
    AZURE_OPENAI_API_VERSION="2024-02-15-preview" \
    AZURE_SEARCH_ENDPOINT="https://your-search.search.windows.net" \
    AZURE_SEARCH_API_KEY="your-key" \
    AZURE_SEARCH_INDEX_NAME="turkeyai-travel-index" \
    DB_HOST="your-db.postgres.database.azure.com" \
    DB_PORT=5432 \
    DB_NAME="turkeyai" \
    DB_USER="your-user" \
    DB_PASSWORD="your-password" \
    DB_SSL=true
```

#### 4. Deploy Code

```bash
# From your local repository
cd /path/to/turkeyai

# Deploy using local git
az webapp deployment source config-local-git \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP

# Get deployment URL
az webapp deployment source show \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query repoUrl -o tsv

# Add Azure remote
git remote add azure <deployment-url>

# Push to Azure
git push azure main
```

#### 5. Configure Startup Command

```bash
# Set startup command
az webapp config set \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --startup-file "npm install && npm run build && cd server && npm install && npm start"
```

### Option 2: Azure Static Web Apps + Azure Functions

For a more modern serverless approach.

#### 1. Deploy Frontend to Static Web Apps

```bash
STATIC_APP_NAME="turkeyai-static"

# Create Static Web App
az staticwebapp create \
  --name $STATIC_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --location "eastus2" \
  --source https://github.com/orkinosai25-org/turkeyai \
  --branch main \
  --app-location "/client" \
  --output-location "build" \
  --login-with-github
```

#### 2. Deploy Backend as Azure Functions

This would require refactoring the Express routes to Azure Functions. (Future enhancement)

### Option 3: Docker Container (Azure Container Apps)

For containerized deployment.

#### 1. Create Dockerfile

Create `Dockerfile` in the root:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm install
RUN cd server && npm install
RUN cd client && npm install && npm run build

# Copy source code
COPY . .

# Expose port
EXPOSE 8080

# Start server
CMD ["npm", "run", "server"]
```

#### 2. Build and Push to Azure Container Registry

```bash
ACR_NAME="turkeyaiacr"

# Create ACR
az acr create \
  --name $ACR_NAME \
  --resource-group $RESOURCE_GROUP \
  --sku Basic

# Build and push
az acr build \
  --registry $ACR_NAME \
  --image turkeyai:latest \
  .
```

#### 3. Deploy to Container Apps

```bash
CONTAINER_APP_ENV="turkeyai-env"
CONTAINER_APP_NAME="turkeyai-app"

# Create Container Apps environment
az containerapp env create \
  --name $CONTAINER_APP_ENV \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

# Deploy container
az containerapp create \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --environment $CONTAINER_APP_ENV \
  --image $ACR_NAME.azurecr.io/turkeyai:latest \
  --target-port 8080 \
  --ingress external \
  --registry-server $ACR_NAME.azurecr.io \
  --env-vars \
    NODE_ENV=production \
    AZURE_OPENAI_ENDPOINT=... \
    # (add all environment variables)
```

## Post-Deployment Steps

### 1. Initialize Database

```bash
# Connect to Azure PostgreSQL
psql "host=your-db.postgres.database.azure.com \
      port=5432 \
      dbname=turkeyai \
      user=your-user \
      password=your-password \
      sslmode=require"

# Run schema
\i database/schema.sql
```

### 2. Verify Deployment

```bash
# Get app URL
az webapp show \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query defaultHostName -o tsv

# Test health endpoint
curl https://$WEB_APP_NAME.azurewebsites.net/api/health
```

### 3. Configure Custom Domain

```bash
# Map custom domain
az webapp config hostname add \
  --webapp-name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --hostname turkiyeai.travel

# Enable HTTPS
az webapp config ssl bind \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --certificate-thumbprint <thumbprint> \
  --ssl-type SNI
```

### 4. Enable Monitoring

```bash
# Enable Application Insights
az webapp config appsettings set \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    APPINSIGHTS_INSTRUMENTATIONKEY="your-instrumentation-key"
```

## CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm run install-all
      
      - name: Build frontend
        run: cd client && npm run build
      
      - name: Deploy to Azure
        uses: azure/webapps-deploy@v2
        with:
          app-name: ${{ secrets.AZURE_WEBAPP_NAME }}
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
```

## Scaling

### Horizontal Scaling

```bash
# Scale out to multiple instances
az appservice plan update \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --number-of-workers 3
```

### Vertical Scaling

```bash
# Scale up to higher tier
az appservice plan update \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --sku P1V2
```

## Backup and Disaster Recovery

```bash
# Enable automatic backups
az webapp config backup create \
  --resource-group $RESOURCE_GROUP \
  --webapp-name $WEB_APP_NAME \
  --backup-name daily-backup \
  --container-url "https://yourstorageaccount.blob.core.windows.net/backups"
```

## Troubleshooting

### View Logs

```bash
# Stream logs
az webapp log tail \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP

# Download logs
az webapp log download \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --log-file app-logs.zip
```

### SSH into Container

```bash
az webapp ssh \
  --name $WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP
```

## Security Checklist

- [ ] All Azure services use Managed Identity
- [ ] Secrets stored in Azure Key Vault
- [ ] Database uses SSL/TLS
- [ ] App Service uses HTTPS only
- [ ] CORS configured for production domain
- [ ] Rate limiting enabled
- [ ] WAF (Web Application Firewall) configured
- [ ] DDoS protection enabled
- [ ] Regular security updates applied

## Cost Management

- Use Azure Cost Management to monitor spending
- Set up budget alerts
- Use auto-scaling to optimize costs
- Consider Azure Reserved Instances for production

## Support

For deployment issues, contact OrkinosAI Ltd or refer to Azure documentation.

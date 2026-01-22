const { SearchClient, AzureKeyCredential } = require("@azure/search-documents");

let searchClient = null;

/**
 * Initialize Azure AI Search client
 */
function getSearchClient() {
  if (!searchClient) {
    const endpoint = process.env.AZURE_SEARCH_ENDPOINT;
    const apiKey = process.env.AZURE_SEARCH_API_KEY;
    const indexName = process.env.AZURE_SEARCH_INDEX_NAME || 'turkeyai-travel-index';
    
    if (!endpoint || !apiKey) {
      throw new Error('Azure AI Search credentials not configured');
    }
    
    searchClient = new SearchClient(
      endpoint,
      indexName,
      new AzureKeyCredential(apiKey)
    );
  }
  
  return searchClient;
}

module.exports = {
  getSearchClient
};

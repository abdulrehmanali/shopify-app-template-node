import { BillingInterval, LATEST_API_VERSION } from "@shopify/shopify-api";
import { shopifyApp } from "@shopify/shopify-app-express";
import { MySQLSessionStorage } from '@shopify/shopify-app-session-storage-mysql'
import { restResources } from "@shopify/shopify-api/rest/admin/2023-07";

const DB_PATH = `${process.cwd()}/database.sqlite`;

// The transactions with Shopify will always be marked as test transactions, unless NODE_ENV is production.
// See the ensureBilling helper to learn more about billing in this template.
const billingConfig = {
  "My Shopify One-Time Charge": {
    // This is an example configuration that would do a one-time charge for $5 (only USD is currently supported)
    amount: 5.0,
    currencyCode: "USD",
    interval: BillingInterval.OneTime,
  },
};

const shopify_config = {
  api: {
    apiVersion: LATEST_API_VERSION,
    restResources,
    billing: undefined, // or replace with billingConfig above to enable example billing
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
  sessionStorage: MySQLSessionStorage.withCredentials(process.env.MYSQL_URL, process.env.MYSQL_DATABASE, process.env.MYSQL_USERNAME, process.env.MYSQL_PASSWORD, {}),
}

if (process.env.NODE_ENV == 'production') {
  shopify_config.api.hostScheme = 'https'
  shopify_config.api.apiKey = process.env.SHOPIFY_API_KEY
  shopify_config.api.apiSecretKey = process.env.SHOPIFY_API_SECRET
  shopify_config.api.scopes = process.env.SHOPIFY_SCOPE.split(',')
  shopify_config.api.hostName = process.env.API_SERVER
}
shopify_config.api.apiVersion = process.env.SHOPIFY_API_VERSION


const shopify = shopifyApp(shopify_config);

export default shopify;

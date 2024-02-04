// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import bodyParser from "body-parser";
import cors from 'cors';
import 'dotenv/config'

import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import PrivacyWebhookHandlers from "./privacy.js";
import AppRoutes from "./backend/routes/App.js";
import AdminApi from "./backend/routes/AdminApi.js";

import db from './backend/Database/index.js'

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

db.sequelize
  .sync({ alter: true })
  .then(() => {
    console.log('Synced db.')
  })
  .catch((err) => {
    console.log('Failed to sync db: ' + err.message)
  })
db.ShopStoreFrontToken.sync({ alter: true })
  .then(() => {
    console.log('Synced Shop Settings Table.')
  })
  .catch((err) => {
    console.log('Failed to sync Shop Settings Table: ' + err.message)
  })

app.use(cors())
app.get('/install/', async (req,res) => {
  return shopify.auth.begin();
return;
//   const shop = req.query.shop;
//   const state = (Math.random() + 1).toString(36).substring(1);
//   const redirectUri = process.env.HOST + shopify.config.auth.callbackPath;
//   const installUrl = 'https://' + shop + '/admin/oauth/authorize?client_id=' + process.env.SHOPIFY_API_KEY + 
//   '&scope=' + process.env.SHOPIFY_SCOPE +
//   '&state=' + state +
//   '&redirect_uri=' + redirectUri;
//   console.log('Install URL:', installUrl)
//   res.cookie('state', state); //should be encrypted
//   res.redirect(installUrl);
});

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);


// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(express.json());
app.use(bodyParser.json());
app.use("/app", AppRoutes);


app.use('/api', AdminApi)

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});

app.listen(PORT);

import shopify from '../../shopify.js'
import database from './../Database/index.js'

export const adminGet = async (_req, res) => {
  const shop = res.locals.shopify.session.shop
  const ShopStoreFrontToken = await database.ShopStoreFrontToken.findOne({ where: { shop } })
  res.status(200).send({shopStoreFrontToken:ShopStoreFrontToken});
}

export const adminPost = async (_req, res) => {
  let status = 200;
  let error = null;
  const session  = res.locals.shopify.session
  let token = null
  try {
    const storefront_access_token = new shopify.api.rest.StorefrontAccessToken({session});
    storefront_access_token.title = "Mobile App Token";
    token = await storefront_access_token.save({
      update: true,
    });
    console.log(storefront_access_token)
    console.log(storefront_access_token.id)

    await database.ShopStoreFrontToken.create({
      shop: res.locals.shopify.session.shop,
      storefrontId: storefront_access_token.id,
      accessToken: storefront_access_token.access_token,
      accessScope: storefront_access_token.access_scope,
      title: storefront_access_token.title,
    })
  } catch (e) {
    console.log(`Failed to process storefront_access_token/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
}
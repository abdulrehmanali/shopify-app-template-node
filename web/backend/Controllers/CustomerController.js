import shopify from '../../shopify.js'
import ShopStoreFrontTokenModel from '../Database/Models/ShopStoreFrontToken.model.js'
import database from './../Database/index.js'

export const loginCustomer = async (req, res) => {
  const shop = process.env.SELECTED_SHOP
  const ShopStoreFrontToken = await database.ShopStoreFrontToken.findOne({ where: { shop } })
  if (!ShopStoreFrontToken  instanceof ShopStoreFrontTokenModel) {
    console.log('No method founded');
    return
  }

  const storefrontAccessToken = ShopStoreFrontToken.accessToken

  // shopify.api.config.privateAppStorefrontAccessToken
  // const session = await shopify.config.sessionStorage.findSessionsByShop(process.env.SELECTED_SHOP)

  const storefrontClient = new shopify.api.clients.Storefront({
    domain: shop,
    storefrontAccessToken
  });

  const data = await storefrontClient.query({
    data: `mutation customerAccessTokenCreate {
      customerAccessTokenCreate(input: {email: "${req.body.email}", password: "${req.body.password}"}) {
        customerAccessToken {
          accessToken
          expiresAt
        }
        customerUserErrors {
          message
        }
      }
    }`,
  });
  console.log(data.body.data.customerAccessTokenCreate)
  res.json(data.body.data.customerAccessTokenCreate)
} 
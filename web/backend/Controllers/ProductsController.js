import shopify from '../../shopify.js'

export const appProductsIndex = async (req, res) =>{
  shopify.api.config.privateAppStorefrontAccessToken
  const session = await shopify.config.sessionStorage.findSessionsByShop(process.env.SELECTED_SHOP)
  try {
    const productListing = shopify.api.rest.ProductListing
    const response = await productListing.all({session:session[0]})
    res.json(response)
  } catch (error) {
    res.json({error})
  }
  return
}

export const appProductsGet = async (req, res) =>{
  shopify.api.config.privateAppStorefrontAccessToken
  const session = await shopify.config.sessionStorage.findSessionsByShop(process.env.SELECTED_SHOP)
  try {
    const product_id = req.params.product_id
    const productListing = shopify.api.rest.ProductListing
    const response = await productListing.find({session:session[0], product_id})
    res.json(response)
  } catch (error) {
    res.json({error})
  }
  return
}
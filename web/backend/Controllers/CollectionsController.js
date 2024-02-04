import shopify from '../../shopify.js'

export const appCollectionsIndex = async (req, res) =>{
  shopify.api.config.privateAppStorefrontAccessToken
  const session = await shopify.config.sessionStorage.findSessionsByShop(process.env.SELECTED_SHOP)
  try {
    const collectionListing = shopify.api.rest.CollectionListing
    const response = await collectionListing.all({session:session[0]})
    res.json(response)
  } catch (error) {
    res.json({error})
  }
  return
}

export const appCollectionsGet = async (req, res) =>{
  shopify.api.config.privateAppStorefrontAccessToken
  const session = await shopify.config.sessionStorage.findSessionsByShop(process.env.SELECTED_SHOP)
  try {
    const collection_id = req.params.collection_id
    const collectionListing = shopify.api.rest.CollectionListing
    const response = await collectionListing.all({session:session[0], collection_id})
    res.json(response)
  } catch (error) {
    res.json({error})
  }
  return
}
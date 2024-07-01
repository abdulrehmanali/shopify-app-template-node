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
    const client = new shopify.api.clients.Graphql({session: session[0]});
    const data = await client.query({
      data: `query {
        collection(id: "gid://shopify/Collection/${collection_id}") {
          id
          title
          updatedAt
          products(first:10) {
            nodes {
              id
              title
              handle
              featuredImage {
                url
              }
              compareAtPriceRange {
                minVariantCompareAtPrice {
                  amount
                }
              }
              priceRangeV2 {
                minVariantPrice {
                  amount
                }
              }
              variantsCount {
                count
              }
            }
          }
        }
      }`,
    });
    res.json(data.body.data)
  } catch (error) {
    console.log(error)
    res.json({error})
  }
  return
}
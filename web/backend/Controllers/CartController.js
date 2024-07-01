import ShopStoreFrontTokenModel from '../Database/Models/ShopStoreFrontToken.model'

const CART_QUERY = `
    cart {
      discountCodes {
        code
        applicable
      }
      totalQuantity
      createdAt
      buyerIdentity {
        countryCode
        deliveryAddressPreferences
        email
        phone
      }
      id
      note
      lines(first: 1) {
        nodes {
          quantity
          cost {
            totalAmount {
              amount
              currencyCode
            }
            subtotalAmount {
              amount
              currencyCode
            }
          }
          discountAllocations {
            discountedAmount {
              amount
              currencyCode
            }
          }
          merchandise {
            ... on ProductVariant {
              id
            }
          }
        }
      }
    }
    userErrors {
      field
      message
      code
    }
`
export const createCartForApp = async ()=>{
  const shop = process.env.SELECTED_SHOP
  const session = await shopify.config.sessionStorage.findSessionsByShop(process.env.SELECTED_SHOP)

  const ShopStoreFrontToken = await database.ShopStoreFrontToken.findOne({ where: { shop } })
  if (!ShopStoreFrontToken instanceof ShopStoreFrontTokenModel) {
    console.log('No method founded')
    return
  }

  const storefrontAccessToken = ShopStoreFrontToken.accessToken
  const storefrontClient = new shopify.api.clients.Storefront({
    domain: shop,
    storefrontAccessToken,
  })

  const cartCreate = await storefrontClient.query({
    data: `mutation cartCreate {
      cartCreate {
      ${CART_QUERY}
      }
    }`,
  })

  

  const cartAddItem = await storefrontClient.query({
    data: `mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        ${CART_QUERY}
      }
    }`,
    variables: {
      "cartId":cartCreate.body.data.cartCreate.cart.id,
      "lines": [
        {
          "merchandiseId": "gid://shopify/<objectName>/10079785100",
          "quantity": 1,
        }
      ]
    }
  })

}
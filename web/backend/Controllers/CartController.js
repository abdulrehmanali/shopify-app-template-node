import ShopStoreFrontTokenModel from '../Database/Models/ShopStoreFrontToken.model.js'
import shopify from '../../shopify.js'
import database from './../Database/index.js'

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
            targetType
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


export const calculateCart = async (req, res) => {
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
  const customerAccessToken = req.headers.authorization
  const customer = await storefrontClient.query({
    data: `query {
    customer(customerAccessToken: "${customerAccessToken}") {
      id
      firstName
      lastName
      acceptsMarketing
      email
      phone
    }
  }`,
  })

  const address = {
    address1: req.body.address,
    city: req.body.city,
    country: 'PK',
    firstName: req.body.first_name,
    lastName: req.body.last_name,
    phone: req.body.phone,
    province: req.body.state,
    zip: req.body.zip,
  }

  const checkoutInput = {
    "buyerIdentity": {
      "countryCode": "PK",
      "deliveryAddressPreferences": [
        {
          "deliveryAddress": address,
          "deliveryAddressValidationStrategy": "COUNTRY_CODE_ONLY"
        }
      ],
      "email": customer.body.data.customer.email
    },
    "lines": []
  }

  JSON.parse(req.body.line_items).forEach((element) => {
    checkoutInput.lines.push({
      merchandiseId: 'gid://shopify/ProductVariant/' + element.variantId,
      quantity: element.quantity,
    })
  })

  if (req.body.appliedDiscount) {
    checkoutInput.discountCodes = [req.body.appliedDiscount]
  }
  
  try {
    const cartCreate = await storefrontClient.query({
      data: {
        query: `mutation cartCreate($input: CartInput) {
          cartCreate(input: $input) {
            cart {
              id
              updatedAt
              createdAt
              buyerIdentity {
                countryCode
                email
                phone
                deliveryAddressPreferences {
                  ... on MailingAddress {
                    address1
                    address2
                    city
                    company
                    country
                    firstName
                    lastName
                    province
                    zip
                  }
                }
              }
              discountAllocations {
                discountedAmount {
                  amount
                  currencyCode
                }
                targetType
                ... on CartAutomaticDiscountAllocation {
                  discountedAmount {
                    amount
                    currencyCode
                  }
                  title
                }
                ... on CartCodeDiscountAllocation {
                  code
                  targetType
                  discountedAmount {
                    amount
                    currencyCode
                  }
                }
              }
              totalQuantity
              cost {
                checkoutChargeAmount {
                  amount
                  currencyCode
                }
                subtotalAmount {
                  amount
                  currencyCode
                }
                totalAmount {
                  amount
                  currencyCode
                }
                totalTaxAmount {
                  amount
                  currencyCode
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }`,
        variables: {
          input: checkoutInput,
        },
      },
    })

    res.json(cartCreate.body.data.cartCreate)
  } catch (error) {
    console.log(error)
    res.json(error)
  }
}

export const applyCouponCodeOnCart = async (req, res) => {
  const shop = process.env.SELECTED_SHOP

  const cartInput = {
    "cartId": req.body.cartId,
    "discountCodes": []
  }
  // if (cartInput.cartId) {
  //   cartInput.cartId = cartInput.cartId.split('?')[0]
  // }
  
  if (req.body.discountCode) {
    cartInput.discountCodes = [req.body.discountCode]
  }

  console.log(cartInput)

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

  try {
    const cartDiscountCodesUpdate = await storefrontClient.query({
      data: {
        query: `mutation cartDiscountCodesUpdate($cartId: ID!, $discountCodes: [String!]!) {
          cartDiscountCodesUpdate(cartId: $cartId, discountCodes: $discountCodes) {
            cart {
              id
              updatedAt
              createdAt
              buyerIdentity {
                countryCode
                email
                phone
                deliveryAddressPreferences {
                  ... on MailingAddress {
                    address1
                    address2
                    city
                    company
                    country
                    firstName
                    lastName
                    province
                    zip
                  }
                }
              }
              discountAllocations {
                discountedAmount {
                  amount
                  currencyCode
                }
                targetType
                ... on CartAutomaticDiscountAllocation {
                  discountedAmount {
                    amount
                    currencyCode
                  }
                  title
                }
                ... on CartCodeDiscountAllocation {
                  code
                  targetType
                  discountedAmount {
                    amount
                    currencyCode
                  }
                }
              }
              totalQuantity
              cost {
                checkoutChargeAmount {
                  amount
                  currencyCode
                }
                subtotalAmount {
                  amount
                  currencyCode
                }
                totalAmount {
                  amount
                  currencyCode
                }
                totalTaxAmount {
                  amount
                  currencyCode
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }`,
        variables: cartInput,
      },
    })

    res.json(cartDiscountCodesUpdate.body.data.cartDiscountCodesUpdate)
  } catch (error) {
    // console.log(error.response)
    res.json(error)
  }
}
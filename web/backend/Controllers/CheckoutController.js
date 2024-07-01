import shopify from '../../shopify.js'
import ShopStoreFrontTokenModel from '../Database/Models/ShopStoreFrontToken.model.js'
import database from './../Database/index.js'

export const createOrderRest = async (req, res) => {
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
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    phone: req.body.phone,
    province: req.body.state,
    zip: req.body.zip,
  }

  const order = new shopify.api.rest.Order({session: session[0]});
  order.line_items = []
  JSON.parse(req.body.line_items).forEach((element) => {
    order.line_items.push({
      variant_id: element.variantId,
      quantity: element.quantity,
    })
  })


  order.billing_address = address
  order.shipping_address = address
  order.email = customer.body.data.customer.email
  order.customer_id = customer.body.data.customer.id.replace('gid://shopify/Customer/', '')

  const calculatedDraftOrder = req.body.calculatedDraftOrder
  const availableShippingRates = calculatedDraftOrder.availableShippingRates
  if (availableShippingRates && availableShippingRates[0]) {
    order.shipping_lines = []
    const shipping_line = availableShippingRates[0]
    shipping_line.price = shipping_line.price.amount
    // checkout.shipping_line.push(shipping_lines)
    order.shipping_lines.push(shipping_line)
  }


  try {
    await order.save({
      update: true,
    });
  
    // await order.save({
    //   update: true,
    // });

    res.json({ success:true, order })
  } catch (error) {
    res.json({ order, error:error })
  }
}

export const createCheckoutRest = async (req, res) => {
  const shop = process.env.SELECTED_SHOP
  const session = await shopify.config.sessionStorage.findSessionsByShop(process.env.SELECTED_SHOP)

  const client = new shopify.api.clients.Graphql({ session: session[0] })

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
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    phone: req.body.phone,
    province: req.body.state,
    zip: req.body.zip,
  }

  const checkout = new shopify.api.rest.Checkout({ session: session[0] })
  checkout.line_items = []
  JSON.parse(req.body.line_items).forEach((element) => {
    checkout.line_items.push({
      variant_id: element.variantId,
      quantity: element.quantity,
    })
  })


  checkout.billing_address = address
  checkout.shipping_address = address
  checkout.email = customer.body.data.customer.email
  checkout.customer_id = customer.body.data.customer.id.replace('gid://shopify/Customer/', '')

  const calculatedDraftOrder = req.body.calculatedDraftOrder
  const availableShippingRates = calculatedDraftOrder.availableShippingRates
  // if (availableShippingRates && availableShippingRates[0]) {
  //   // checkout.shipping_line = []
  //   const shipping_lines = availableShippingRates[0]
  //   shipping_lines.price = shipping_lines.price.amount
  //   // checkout.shipping_line.push(shipping_lines)
  //   checkout.shipping_line = {
  //     'id':'shopify-'+shipping_lines.title+'-'+shipping_lines.price,
  //     'handle':'shopify-'+shipping_lines.title+'-'+shipping_lines.price,
  //     'title':shipping_lines.title,
  //     'price':shipping_lines.price
  //   }
  // }


  try {
    await checkout.save({
      update:true
    })
    const shipping_rates = await shopify.api.rest.Checkout.shipping_rates({
      session: session[0],
      token: checkout.token,
    });
    const newCheckout = new shopify.api.rest.Checkout({ session: session[0] })
    newCheckout.token = checkout.token
    newCheckout.shipping_line = shipping_rates.shipping_rates[0]
    await newCheckout.save({
      update:true
    })

    // const checkoutCompleteFree = await storefrontClient.query({
    //   data: `mutation checkoutCompleteFree($checkoutId: ID!) {
    //     checkoutCompleteFree(checkoutId: $checkoutId) {
    //       checkout {
    //         order {
    //           id
    //         }
    //       }
    //       checkoutUserErrors {
    //         code
    //         field
    //         message
    //       }
    //       userErrors {
    //         field
    //         message
    //       }
    //     }
    //   }`,
    //   variables: {
    //     "checkoutId": "gid://shopify/Product/"+newCheckout.token
    //   }
    // })

    // res.json({ shipping_rates })
    // return
    // await checkout.complete({})
    res.json({ newCheckout })
  } catch (error) {
    res.json({ checkout, error:error })
  }
}

export const createCheckout = async (req, res) => {
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
    phone: "+923342569700",
    province: req.body.state,
    zip: req.body.zip,
  }

  const checkout = {}
  checkout.lineItems = []
  JSON.parse(req.body.line_items).forEach((element) => {
    checkout.lineItems.push({
      variantId: 'gid://shopify/ProductVariant/'+element.variantId,
      quantity: element.quantity,
    })
  })


  checkout.buyerIdentity = {
    "countryCode": "PK"
  }
  // checkout.billingAddress = address
  checkout.shippingAddress = address
  checkout.email = customer.body.data.customer.email
  // checkout.customerId = customer.body.data.customer.id

  const calculatedDraftOrder = req.body.calculatedDraftOrder
  const availableShippingRates = calculatedDraftOrder.availableShippingRates
  if (availableShippingRates && availableShippingRates[0]) {
    checkout.shippingLine = availableShippingRates[0]
  }

  try {
    const order = await storefrontClient.query({
      data: `mutation checkoutCreate($input: CheckoutCreateInput!) {
        checkoutCreate(input: $input) {
          checkout {
            id
            email
          }
          checkoutUserErrors {
            code
            field
            message
          }
          queueToken
          userErrors {
            field
            message
          }
        }
      }`,
      variables: {
        input: checkout,
      },
    })

    res.json({ order })
  } catch (error) {
    res.json({ checkout, error })
  }
}

// export const calculateCheckout = async (req, res) => {
//   const shop = process.env.SELECTED_SHOP
//   const session = await shopify.config.sessionStorage.findSessionsByShop(process.env.SELECTED_SHOP)

//   const client = new shopify.api.clients.Graphql({ session: session[0] })

//   const ShopStoreFrontToken = await database.ShopStoreFrontToken.findOne({ where: { shop } })
//   if (!ShopStoreFrontToken instanceof ShopStoreFrontTokenModel) {
//     console.log('No method founded')
//     return
//   }

//   const storefrontAccessToken = ShopStoreFrontToken.accessToken
//   const storefrontClient = new shopify.api.clients.Storefront({
//     domain: shop,
//     storefrontAccessToken,
//   })
//   const customerAccessToken = req.headers.authorization
//   const customer = await storefrontClient.query({
//     data: `query {
//     customer(customerAccessToken: "${customerAccessToken}") {
//       id
//       firstName
//       lastName
//       acceptsMarketing
//       email
//       phone
//     }
//   }`,
//   })

//   const address = {
//     address1: req.body.address,
//     city: req.body.city,
//     country: 'PK',
//     firstName: req.body.first_name,
//     lastName: req.body.last_name,
//     phone: req.body.phone,
//     province: req.body.state,
//     zip: req.body.zip,
//   }

//   const checkoutInput = {
//     billingAddress: address,
//     lineItems: [],
//     shippingAddress: address,
//     email: customer.body.data.customer.email,
//     acceptAutomaticDiscounts: true,
//   }

//   JSON.parse(req.body.line_items).forEach((element) => {
//     checkoutInput.lineItems.push({
//       variantId: 'gid://shopify/ProductVariant/' + element.variantId,
//       quantity: element.quantity,
//     })
//   })
//   // checkoutInput.customer = customer.body.data.customer
//   checkoutInput.marketRegionCountryCode = 'PK'
//   checkoutInput.purchasingEntity = {
//     customerId:customer.body.data.customer.id
//   }

//   if (req.body.appliedDiscount) {
//     checkoutInput.appliedDiscount
//     appliedDiscount
//   }
  
//   try {
//     const data = await client.query({
//       data: {
//         query: `mutation CalculateDraftOrder($input: DraftOrderInput!) {
//           draftOrderCalculate(input: $input) {
//             calculatedDraftOrder {
//               billingAddressMatchesShippingAddress
//               totalPriceSet {
//                 presentmentMoney {
//                   amount
//                   currencyCode
//                 }
//                 shopMoney {
//                   amount
//                   currencyCode
//                 }
//               }
//               lineItems {
//                 appliedDiscount {
//                   amountSet {
//                     presentmentMoney {
//                       amount
//                       currencyCode
//                     }
//                     shopMoney {
//                       amount
//                       currencyCode
//                     }
//                   }
//                   value
//                   valueType
//                   description
//                 }
//                 discountedTotalSet {
//                   presentmentMoney {
//                     amount
//                     currencyCode
//                   }
//                   shopMoney {
//                     amount
//                     currencyCode
//                   }
//                 }
//                 product {
//                   id
//                   title
//                   totalVariants
//                 }
//                 quantity
//                 requiresShipping
//                 sku
//                 taxable
//                 title
//                 variantTitle
//                 variant {
//                   id
//                 }
//                 weight {
//                   value
//                   unit
//                 }
//               }
//               totalTaxSet {
//                 presentmentMoney {
//                   amount
//                   currencyCode
//                 }
//                 shopMoney {
//                   amount
//                   currencyCode
//                 }
//               }
//               totalDiscountsSet {
//                 presentmentMoney {
//                   amount
//                   currencyCode
//                 }
//                 shopMoney {
//                   amount
//                   currencyCode
//                 }
//               }
//               shippingLine {
//                 id
//                 custom
//                 shippingRateHandle
//                 title
//                 originalPriceSet {
//                   presentmentMoney {
//                     amount
//                     currencyCode
//                   }
//                   shopMoney {
//                     amount
//                     currencyCode
//                   }
//                 }
//               }
//               availableShippingRates {
//                 handle
//                 title
//                 price {
//                     amount
//                 }
//               }
//               presentmentCurrencyCode
//               marketName
//               marketRegionCountryCode
//             }
//             userErrors {
//               field
//               message
//             }
//           }
//         }`,
//         variables: {
//           input: checkoutInput,
//         },
//       },
//     })
//     console.log(data.body.data.draftOrderCalculate)
//     res.json(data.body.data.draftOrderCalculate)
//   } catch (error) {
//     console.log(error)
//     res.json(error)
//   }
// }

export const calculateCheckout = async (req, res) => {
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
                ... on CartAutomaticDiscountAllocation {
                  discountedAmount {
                    amount
                    currencyCode
                  }
                  title
                }
                ... on CartCodeDiscountAllocation {
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


    console.log(cartCreate.body)
    console.log(cartCreate.body.data)

    res.json(cartCreate.body.data.cartCreate)
  } catch (error) {
    console.log(error)
    res.json(error)
  }
}
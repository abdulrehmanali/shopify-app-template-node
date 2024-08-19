import shopify from '../../shopify.js'
import ShopStoreFrontTokenModel from '../Database/Models/ShopStoreFrontToken.model.js'
import database from './../Database/index.js'
import { getCustomerFromERP, insertCustomerInERP } from './ERPSystemController.js'

export const loginCustomer = async (req, res) => {
  const shop = process.env.SELECTED_SHOP
  const ShopStoreFrontToken = await database.ShopStoreFrontToken.findOne({ where: { shop } })
  if (!ShopStoreFrontToken  instanceof ShopStoreFrontTokenModel) {
    console.log('No method founded');
    return
  }

  const storefrontAccessToken = ShopStoreFrontToken.accessToken
  const storefrontClient = new shopify.api.clients.Storefront({
    domain: shop,
    storefrontAccessToken
  });

  // shopify.api.config.privateAppStorefrontAccessToken
  // const session = await shopify.config.sessionStorage.findSessionsByShop(process.env.SELECTED_SHOP)
  // const session = await shopify.config.sessionStorage.findSessionsByShop(shop)
  let returnResponse = {}
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
  })

  const response = data.body.data.customerAccessTokenCreate
  returnResponse = response
  if (response.customerAccessToken && response.customerAccessToken.accessToken) {
    const customerResponse = await storefrontClient.query({
      data: `query {
        customer(customerAccessToken: "${response.customerAccessToken.accessToken}") {
          id
          firstName
          lastName
          acceptsMarketing
          email
          phone
          defaultAddress {
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
      }`,
    }); 
    returnResponse.customer = customerResponse.body.data.customer

    try {
      console.log(returnResponse.customer)
      if (returnResponse.customer.phone) {
        const customerFromErp = await getCustomerFromERP(returnResponse.customer.phone)
        const erpCustomer = customerFromErp.data
        returnResponse.existInErp = erpCustomer
        if (!erpCustomer) {
          const erpInsert = await insertCustomerInERP(returnResponse.customer.firstName, returnResponse.customer.lastName, returnResponse.customer.phone, returnResponse.customer.email);
          returnResponse.erpInsert = erpInsert.data
        }
      }
    } catch (error) {
      returnResponse.erpError = error.message;
      console.error('Unable to register customer on erp')
      console.error(error)
      console.error(error.message)
      console.error(error.response.body)
    }
  }
  res.json(returnResponse)
  return;
}

function validateAndFormatPhoneNumber(phoneNumber) {
  // Validate the phone number
  phoneNumber = phoneNumber.replace(/[^\w+]/g, '')
  const phoneNumberPattern = /^(\+92|0)?[0-9]{10}$/; // Allows numbers starting with +92, 0, or without either
  if (!phoneNumberPattern.test(phoneNumber)) {
    return false;
  }

  // Replace the leading 0 with +92
  if (phoneNumber.startsWith('0')) {
    phoneNumber = '+92' + phoneNumber.slice(1);
  }

  return phoneNumber;
}

export const signUpCustomer = async (req, res)=>{
  const shop = process.env.SELECTED_SHOP
  const ShopStoreFrontToken = await database.ShopStoreFrontToken.findOne({ where: { shop } })
  if (!ShopStoreFrontToken  instanceof ShopStoreFrontTokenModel) {
    console.log('No method founded');
    return
  }
  const phoneNumber = validateAndFormatPhoneNumber(req.body.phoneNumber);
  if (!phoneNumber) {
    res.json({
      success:false,
      errors: {
        "phone": [
          "Invalid phone number"
        ]
      }
    })
    return
  }
  const session = await shopify.config.sessionStorage.findSessionsByShop(shop)
  let newCustomer = '';
  try {
    const customer = new shopify.api.rest.Customer({session:session[0]});
    customer.first_name = req.body.first_name;
    customer.last_name = req.body.last_name;
    customer.email = req.body.email;
    customer.phone = phoneNumber;
    customer.verified_email = true;
    customer.password = req.body.password;
    customer.password_confirmation = req.body.password_confirmation;
    customer.send_email_welcome = true;
    customer.save({
      update: true,
    }).catch(err=>{
      if (err.response && err.response.body) {
        err = err.response.body.errors
      }
      res.json({
        success:false,
        errors:err
      })
      return;
    })
    newCustomer = customer
  } catch(error) {
    if (error.response && error.response.body) {
      err = err.response.body.errors
    }
    res.json({
      success:false,
      errors:error
    })
    return;
  }

  let customerInErp = ""

  try {
    customerInErp = await insertCustomerInERP(req.body.first_name, req.body.last_name, phoneNumber, req.body.email);
  } catch (error) {
    console.log(error.response)
    if (error.response && error.response) {
      customerInErp = error.response
    }
  }
  res.json({
    success:true,
    "message":"Your account has been created! Please log in to start using our app.",
    newCustomer,
    customerInErp
  })
  return;
}

export const requestForgetPassword = async (req, res)=>{
  const shop = process.env.SELECTED_SHOP
  const ShopStoreFrontToken = await database.ShopStoreFrontToken.findOne({ where: { shop } })
  if (!ShopStoreFrontToken  instanceof ShopStoreFrontTokenModel) {
    console.log('No method founded');
    return
  }


  const storefrontAccessToken = ShopStoreFrontToken.accessToken
  const storefrontClient = new shopify.api.clients.Storefront({
    domain: shop,
    storefrontAccessToken
  })

  // shopify.api.config.privateAppStorefrontAccessToken
  // const session = await shopify.config.sessionStorage.findSessionsByShop(process.env.SELECTED_SHOP)
  // const session = await shopify.config.sessionStorage.findSessionsByShop(shop)


  let returnResponse = {}

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress 

  try {
    const data = await storefrontClient.query({
      data: `mutation {
        customerRecover(email: "${req.body.email}") {
          customerUserErrors {
            code
            field
            message
          }
          userErrors {
            field
            message
          }
        }
      }`,
      extraHeaders: {
        'Shopify-Storefront-Buyer-IP':ip
      }
    })
    res.json({success:true, customerRecover: data.body.data.customerRecover})
    return
  } catch (error) {
    console.log(error.response)
    res.json({success:false, errors:error.response.errors})
    return
  }


}

export const getCustomerPromoCodes = async (req, res) => {
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
  if (!customer.body.data.customer) {
    res.json(
      {
        success:false,
        message: 'Unable to find customer'
      }
    )
    return;
  }

  const client = new shopify.api.clients.Graphql({session: session[0]});
  const customer_discount_search = (customer.body.data.customer.id).replace('gid://shopify/Customer/', '')

  try {
    const discountNodesResponse = await client.query({
      data: `query {
        discountNodes(first: 10, query:"${customer_discount_search}_discount") {
          nodes {
            id
            discount {
              ... on DiscountCodeBasic {
                title
                status
                customerGets {
                  value {
                    ... on DiscountAmount {
                      amount {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
                codes(first: 2) {
                  nodes {
                    id
                    code
                  }
                }
              }
              ... on DiscountCodeBxgy {
                title
                codes(first: 2) {
                  nodes {
                    id
                    code
                  }
                }
              }
              ... on DiscountCodeFreeShipping {
                title
                codes(first: 2) {
                  nodes {
                    id
                    code
                  }
                }
              }
              ... on DiscountAutomaticApp {
                title
              }
              ... on DiscountAutomaticBasic {
                title
              }
              ... on DiscountAutomaticBxgy {
                title
              }
              ... on DiscountAutomaticFreeShipping {
                title
              }
            }
          }
        }
      }`,
    });
    res.json({
      'success':true,
      'discountNodes': discountNodesResponse.body.data.discountNodes
    })
  } catch (error) {
    res.json({
      'success':false,
      'error': error
    })
  }
}
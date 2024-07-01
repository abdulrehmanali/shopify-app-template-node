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
        if (customerFromErp.body == null) {
          const erpInsert = await insertCustomerInERP(returnResponse.customer.firstName, returnResponse.customer.lastName, returnResponse.customer.phone, returnResponse.customer.email);
          returnResponse.erpInsert = erpInsert.body
        } else {
          returnResponse.existInErp = customerFromErp.body
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

export const signUpCustomer = async (req, res)=>{
  const shop = process.env.SELECTED_SHOP
  const ShopStoreFrontToken = await database.ShopStoreFrontToken.findOne({ where: { shop } })
  if (!ShopStoreFrontToken  instanceof ShopStoreFrontTokenModel) {
    console.log('No method founded');
    return
  }
  const session = await shopify.config.sessionStorage.findSessionsByShop(shop)

  try {
    const customer = new shopify.api.rest.Customer({session:session[0]});
    customer.first_name = req.body.first_name;
    customer.last_name = req.body.last_name;
    customer.email = req.body.email;
    customer.phone = req.body.phone;
    customer.verified_email = true;
    customer.password = req.body.password;
    customer.password_confirmation = req.body.password_confirmation;
    customer.send_email_welcome = true;
    customer.save({
      update: true,
    })
  } catch(error) {
    res.json({
      success:false,
      error:error.response.body
    })
  }

  try {
    await insertCustomerInERP(req.body.first_name, req.body.last_name, req.body.phone, req.body.email);
  } catch (error) {
    console.log(error)
  }
  res.json({
    success:true,
    "message":"Your account has been created! Please log in to start using our app.",
    customer
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
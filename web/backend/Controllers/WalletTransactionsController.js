import shopify from '../../shopify.js'
import ShopStoreFrontTokenModel from '../Database/Models/ShopStoreFrontToken.model.js'
import database from './../Database/index.js'

const _userTransactions = async (userId, shop) => {
  const transactions = await database.WalletTransactions.findAll({
    where: {
      shop,
      userId,
    },
    order: [
      ['createdAt', 'DESC'],
    ]
  })
  const latestLastTransaction = await database.WalletTransactions.findOne({
    where: {
      shop,
      userId,
    },
    order: [
      ['createdAt', 'DESC'],
    ]
  })
  return {transactions,latestLastTransaction}
}



export const adminWalletTransactionsGet = async (req, res) => {
  const userId = req.params.customer_id
  try {
    const userTransactions = await _userTransactions(userId, res.locals.shopify.session.shop)
    res.json({success:true, transactions:userTransactions.transactions,latestLastTransaction:userTransactions.latestLastTransaction})  
  } catch (err) {
    res.json({success:false, err})
    return 
  }
}

export const adminWalletTransactionsIndex = async (req, res) => {
  const session  = res.locals.shopify.session
  const client = new shopify.api.clients.Graphql({session});
  const userId = req.query.userId
  const userEmail = req.query.userEmail
  if (userId) {
    try {
      const data = await client.query({
        data: `query {
          customer(id: "gid://shopify/Customer/${userId}") {
            id
          }
        }`,
      });
      res.json({customer: data.body.data.customer})
      return
    } catch (error) {
      res.json({errors:error.response.errors})
      return
    }
  }

  if (userEmail) {
    try {
      const data = await client.query({
        data: `query {
          customers(first: 1, query: "email:'${userEmail}'") {
            edges {
              node {
                id
              }
            }
          }
        }`,
      });
      res.json({customers: data.body.data.customers})
      return
    } catch (error) {
      res.json({errors:error.response.errors})
      return
    }
  }
  res.json({'users':[]})
}

export const adminWalletTransactionsAddCredit = async (req, res) => {
  const session  = res.locals.shopify.session
  const userId = req.params.customer_id
  const amount = req.body.amount
  const description = req.body.description

  try {
    let walletAmountBeforeTransaction = 0
    const lastTransaction = await database.WalletTransactions.findOne({
      where: {
        shop: res.locals.shopify.session.shop,
        userId,
      },
      order: [
        ['createdAt', 'DESC'],
      ]
    })
    if (lastTransaction) {
      if (lastTransaction.type == 'CREDIT') {
        walletAmountBeforeTransaction = lastTransaction.amount + lastTransaction.walletAmountBeforeTransaction
      }
      if (lastTransaction.type == 'DEBIT') {
        if (lastTransaction.amount >= lastTransaction.walletAmountBeforeTransaction) {
          walletAmountBeforeTransaction = lastTransaction.amount - lastTransaction.walletAmountBeforeTransaction
        } else {
          walletAmountBeforeTransaction = lastTransaction.walletAmountBeforeTransaction - lastTransaction.amount
        }
      }
    }
    await database.WalletTransactions.create({
      shop: res.locals.shopify.session.shop,
      userId: userId,
      type: 'CREDIT',
      amount: amount,
      description: description,
      walletAmountBeforeTransaction
    })


    res.json({success:true})

  } catch (err) {
    console.log(err)
    res.json({success:false, err})
    return 
  }
}

export const adminWalletTransactionsDebitFromWallet = async (req, res) => {
  const session  = res.locals.shopify.session
  const userId = req.params.customer_id
  const amount = req.body.amount
  const description = req.body.description

  try {
    let walletAmountBeforeTransaction = 0
    const lastTransaction = await database.WalletTransactions.findOne({
      where: {
        shop: res.locals.shopify.session.shop,
        userId,
      },
      order: [
        ['createdAt', 'DESC'],
      ]
    })
    if (lastTransaction) {
      if (lastTransaction.type == 'CREDIT') {
        walletAmountBeforeTransaction = lastTransaction.amount + lastTransaction.walletAmountBeforeTransaction
      }
      if (lastTransaction.type == 'DEBIT') {
        if (lastTransaction.amount >= lastTransaction.walletAmountBeforeTransaction) {
          walletAmountBeforeTransaction = lastTransaction.amount - lastTransaction.walletAmountBeforeTransaction
        } else {
          walletAmountBeforeTransaction = lastTransaction.walletAmountBeforeTransaction - lastTransaction.amount
        }
      }
    }
    await database.WalletTransactions.create({
      shop: res.locals.shopify.session.shop,
      userId: userId,
      type: 'DEBIT',
      amount: amount,
      description: description,
      walletAmountBeforeTransaction
    })


    res.json({success:true})

  } catch (err) {
    console.log(err)
    res.json({success:false, err})
    return 
  }
}

export const appWalletTransactions = async (req, res) => {
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
  const userId = customer.body.data.customer.id.replace('gid://shopify/Customer/', '')
  try {
    const userTransactions = await _userTransactions(userId, shop)
    res.json({success:true, transactions:userTransactions.transactions,latestLastTransaction:userTransactions.latestLastTransaction})  
  } catch (err) {
    res.json({success:false, err})
    return 
  }
}

export const appWalletRequestWithdrawal = async (req, res) => {
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
  const userId = customer.body.data.customer.id.replace('gid://shopify/Customer/', '')
  try {
    const userTransactions = await _userTransactions(userId, shop)
    userTransactions.latestLastTransaction
    let walletTotal = 0
    if (userTransactions.latestLastTransaction) {
      walletTotal = userTransactions.latestLastTransaction.walletAmountBeforeTransaction
      if (userTransactions.latestLastTransaction.type == 'DEBIT') {
        if (walletTotal >= userTransactions.latestLastTransaction.amount) {
          walletTotal -= userTransactions.latestLastTransaction.amount
        } else {
          walletTotal = userTransactions.latestLastTransaction.amount - walletTotal
        }
      }

      if (userTransactions.latestLastTransaction.type == 'CREDIT') {
        walletTotal += userTransactions.latestLastTransaction.amount
      }
    }

    if (req.body.requestedAmount > walletTotal) {
      return res.json({success:false, 'message':'You do not have sufficient amount in your wallet'})
    }

    if (req.body.type == 'bank' && (!req.body.bank || !req.body.accountNumber)) {
      return res.json({success:false, 'message':'Please provide banking details'})
    }

    const currentDate = new Date()
    const client = new shopify.api.clients.Graphql({session:session[0]});
    const couponQuery = await client.query({
      data: {
        query: `mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
            discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
              codeDiscountNode {
                codeDiscount {
                  ... on DiscountCodeBasic {
                    title
                    codes(first: 1) {
                      nodes {
                        code
                      }
                    }
                    startsAt
                    customerSelection {
                      ... on DiscountCustomers {
                        customers {
                          id
                        }
                      }
                    }
                    customerGets {
                      value {
                        ... on DiscountAmount {
                          amount {
                            amount
                          }
                          appliesOnEachItem
                        }
                      }
                      items {
                        ... on AllDiscountItems {
                          allItems
                        }
                      }
                    }
                    appliesOncePerCustomer
                  }
                }
              }
              userErrors {
                field
                code
                message
              }
            }
          }
      `,
        variables: {
          "basicCodeDiscount": {
            "title": 'W_'+generateRandomCode(8),
            "code": 'W_'+generateRandomCode(8),
            "startsAt": currentDate.toISOString(),
            "customerSelection": {
              "customers":{
                "add":[
                  customer.body.data.customer.id
                ]
              }
            },
            "customerGets": {
              "value": {
                "discountAmount": {
                  "amount": req.body.requestedAmount,
                  "appliesOnEachItem": false
                }
              },
              "items": {
                "all": true
              }
            },
            "appliesOncePerCustomer": true
          }
        }
      },
    });
    if (couponQuery.body.data.discountCodeBasicCreate.codeDiscountNode) {
      const codeDiscountNode = couponQuery.body.data.discountCodeBasicCreate.codeDiscountNode
      await database.WalletTransactions.create({
        shop: shop,
        userId: userId,
        type: 'DEBIT',
        amount: req.body.requestedAmount,
        description: ('Customer generated coupon code '+codeDiscountNode.codeDiscount.codes.nodes[0].code),
        walletAmountBeforeTransaction:walletTotal
      })
      res.json({success:true, 'couponCode': codeDiscountNode.codeDiscount.codes.nodes[0].code})
    } else {
      res.json({success:false, 'message': couponQuery.body.data.discountCodeBasicCreate.userErrors.message})
    }
  } catch (err) {
    console.log(err)
    res.json({success:false, message:err.message})
    return 
  }
}

export const generateRandomCode = (length) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}
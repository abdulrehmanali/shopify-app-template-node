import shopify from './../../shopify.js'

export const onOrderPaid =  (req, res) => {
  const {order_id, status, amount} = req.body
}
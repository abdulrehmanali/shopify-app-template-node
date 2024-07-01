import { Router } from 'express'
const router = Router()
import { onOrderPaid } from './../Controllers/WebhooksController.js'

router.post('/order_transactions/create', onOrderPaid)
export default router;
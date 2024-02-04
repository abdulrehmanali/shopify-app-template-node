import { Router } from 'express'
import { appProductsGet, appProductsIndex } from '../Controllers/ProductsController.js'
import { appCollectionsGet, appCollectionsIndex } from '../Controllers/CollectionsController.js'
import { loginCustomer } from '../Controllers/CustomerController.js'
const router = Router()

router.post('/login', loginCustomer)
router.get('/products/', appProductsIndex)
router.get('/products/:product_id', appProductsGet)

router.get('/collections/', appCollectionsIndex)
router.get('/collections/:collection_id', appCollectionsGet)

export default router
import { Router } from 'express'
import { appProductsGet, appProductsIndex } from '../Controllers/ProductsController.js'
import { appCollectionsGet, appCollectionsIndex } from '../Controllers/CollectionsController.js'
import { loginCustomer, requestForgetPassword, signUpCustomer } from '../Controllers/CustomerController.js'
import { calculateCheckout, createOrderRest } from '../Controllers/CheckoutController.js'
import { appWalletRequestWithdrawal, appWalletTransactions } from '../Controllers/WalletTransactionsController.js'
const router = Router()

router.post('/login', loginCustomer)
router.post('/sign-up', signUpCustomer)

router.post('/forget-password', requestForgetPassword)

router.get('/products/', appProductsIndex)
router.get('/products/:product_id', appProductsGet)

router.get('/collections/', appCollectionsIndex)
router.get('/collections/:collection_id', appCollectionsGet)

router.post('/checkout/calculate', calculateCheckout)
router.post('/checkout/', createOrderRest)

router.get('/wallet/', appWalletTransactions)
router.post('/wallet/request-withdrawal', appWalletRequestWithdrawal)

export default router
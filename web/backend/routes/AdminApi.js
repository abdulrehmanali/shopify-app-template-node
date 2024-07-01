import { Router } from 'express'
import {adminGet, adminPost} from './../Controllers/StorefrontTokenController.js'
import { adminWalletTransactionsIndex, adminWalletTransactionsGet, adminWalletTransactionsAddCredit, adminWalletTransactionsDebitFromWallet } from '../Controllers/WalletTransactionsController.js'

const router = Router()

router.get("/storefront-token", adminGet);
router.post("/storefront-token", adminPost);

router.get("/user-wallet", adminWalletTransactionsIndex);
router.post("/user-wallet/:customer_id/credit", adminWalletTransactionsAddCredit);
router.post("/user-wallet/:customer_id/debit", adminWalletTransactionsDebitFromWallet);

router.get("/user-wallet/:customer_id", adminWalletTransactionsGet);

export default router;
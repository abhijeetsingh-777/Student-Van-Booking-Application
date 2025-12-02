from typing import Dict
from config import config
import uuid

class PaymentService:
    """Mock payment service with optional real provider integration"""
    
    async def initiate_payment(self, amount: float, currency: str, method: str, user_id: str) -> Dict:
        """Initiate payment"""
        if config.USE_REAL_PAYMENTS:
            return await self._initiate_real_payment(amount, currency, method, user_id)
        else:
            return await self._initiate_mock_payment(amount, currency, method, user_id)
    
    async def _initiate_mock_payment(self, amount: float, currency: str, method: str, user_id: str) -> Dict:
        """Mock payment - always succeeds"""
        transaction_id = str(uuid.uuid4())
        
        return {
            'success': True,
            'transaction_id': transaction_id,
            'amount': amount,
            'currency': currency,
            'method': method,
            'status': 'completed',
            'message': 'Payment successful (Mock)'
        }
    
    async def _initiate_real_payment(self, amount: float, currency: str, method: str, user_id: str) -> Dict:
        """Real payment via Razorpay/Stripe"""
        # TODO: Integrate with Razorpay or Stripe
        return await self._initiate_mock_payment(amount, currency, method, user_id)
    
    async def verify_payment(self, transaction_id: str) -> Dict:
        """Verify payment status"""
        # Mock always returns success
        return {
            'verified': True,
            'status': 'completed'
        }
    
    async def refund_payment(self, transaction_id: str, amount: float) -> Dict:
        """Process refund"""
        return {
            'success': True,
            'refund_id': str(uuid.uuid4()),
            'message': 'Refund processed (Mock)'
        }

payment_service = PaymentService()

import random
import string
from datetime import datetime, timedelta
from typing import Dict, Optional
from config import config

class OTPService:
    """Mock OTP service with optional real provider integration"""
    
    def __init__(self):
        self.otp_storage: Dict[str, Dict] = {}  # In-memory storage for MVP
    
    async def send_otp(self, phone: str) -> Dict:
        """Send OTP to phone number"""
        if config.USE_REAL_OTP:
            return await self._send_real_otp(phone)
        else:
            return await self._send_mock_otp(phone)
    
    async def _send_mock_otp(self, phone: str) -> Dict:
        """Mock OTP - any 6-digit code works"""
        otp = ''.join(random.choices(string.digits, k=6))
        expires_at = datetime.utcnow() + timedelta(seconds=config.OTP_EXPIRY_SECONDS)
        
        self.otp_storage[phone] = {
            'otp': otp,
            'expires_at': expires_at,
            'attempts': 0
        }
        
        # For MVP, return OTP in response (remove in production)
        return {
            'success': True,
            'message': f'OTP sent successfully (Mock: {otp})',
            'otp': otp,  # Only for testing
            'expires_in': config.OTP_EXPIRY_SECONDS
        }
    
    async def _send_real_otp(self, phone: str) -> Dict:
        """Send real OTP via Firebase/Twilio"""
        # TODO: Integrate with Firebase Phone Auth or Twilio
        # For now, return mock
        return await self._send_mock_otp(phone)
    
    async def verify_otp(self, phone: str, otp: str) -> bool:
        """Verify OTP"""
        if phone not in self.otp_storage:
            return False
        
        stored = self.otp_storage[phone]
        
        # Check expiry
        if datetime.utcnow() > stored['expires_at']:
            del self.otp_storage[phone]
            return False
        
        # Check OTP
        if stored['otp'] == otp:
            del self.otp_storage[phone]
            return True
        
        stored['attempts'] += 1
        if stored['attempts'] >= 3:
            del self.otp_storage[phone]
        
        return False
    
    async def can_resend(self, phone: str) -> bool:
        """Check if OTP can be resent"""
        if phone not in self.otp_storage:
            return True
        
        stored = self.otp_storage[phone]
        sent_at = stored['expires_at'] - timedelta(seconds=config.OTP_EXPIRY_SECONDS)
        can_resend_at = sent_at + timedelta(seconds=config.OTP_RESEND_SECONDS)
        
        return datetime.utcnow() >= can_resend_at

otp_service = OTPService()

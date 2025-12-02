import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

class Config:
    # MongoDB
    MONGO_URL = os.getenv('MONGO_URL', 'mongodb://127.0.0.1:27017')
    DB_NAME = os.getenv('DB_NAME', 'van_transport')
    
    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
    JWT_ALGORITHM = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES = 43200  # 30 days
    
    # Feature Flags
    USE_REAL_OTP = os.getenv('USE_REAL_OTP', 'false').lower() == 'true'
    USE_REAL_PAYMENTS = os.getenv('USE_REAL_PAYMENTS', 'false').lower() == 'true'
    USE_REAL_MAPS = os.getenv('USE_REAL_MAPS', 'false').lower() == 'true'
    USE_REAL_STORAGE = os.getenv('USE_REAL_STORAGE', 'false').lower() == 'true'
    USE_REAL_TRACKING = os.getenv('USE_REAL_TRACKING', 'false').lower() == 'true'
    
    # OTP Configuration
    OTP_PROVIDER = os.getenv('OTP_PROVIDER', 'firebase')
    OTP_EXPIRY_SECONDS = int(os.getenv('OTP_EXPIRY_SECONDS', '40'))
    OTP_RESEND_SECONDS = int(os.getenv('OTP_RESEND_SECONDS', '30'))
    FIREBASE_PROJECT_ID = os.getenv('FIREBASE_PROJECT_ID', '')
    TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID', '')
    TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', '')
    TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER', '')
    
    # Payment Configuration
    PAYMENT_PROVIDER = os.getenv('PAYMENT_PROVIDER', 'razorpay')
    RAZORPAY_KEY_ID = os.getenv('RAZORPAY_KEY_ID', '')
    RAZORPAY_KEY_SECRET = os.getenv('RAZORPAY_KEY_SECRET', '')
    STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY', '')
    
    # Maps Configuration
    GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY', '')
    
    # Storage Configuration
    STORAGE_PROVIDER = os.getenv('STORAGE_PROVIDER', 's3')
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID', '')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY', '')
    AWS_BUCKET_NAME = os.getenv('AWS_BUCKET_NAME', '')
    AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
    
    # App Configuration
    GPS_PING_INTERVAL_SECONDS = int(os.getenv('GPS_PING_INTERVAL_SECONDS', '5'))
    SOS_ESCALATION_MINUTES = int(os.getenv('SOS_ESCALATION_MINUTES', '2'))
    CANCELLATION_WINDOW_MINUTES = int(os.getenv('CANCELLATION_WINDOW_MINUTES', '5'))

config = Config()

from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

# ==================== User Models ====================

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    phone: str
    role: str  # student, parent, driver, admin
    full_name: str
    email: Optional[EmailStr] = None
    profile_image: Optional[str] = None  # base64 or local path
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Student/Parent fields
    student_name: Optional[str] = None
    institute_name: Optional[str] = None
    class_dept: Optional[str] = None
    pickup_address: Optional[Dict[str, Any]] = None
    trusted_contacts: List[Dict[str, str]] = []
    
    # Driver fields
    age: Optional[int] = None
    experience_years: Optional[int] = None
    license_number: Optional[str] = None
    vehicle_id: Optional[str] = None
    is_verified: bool = False
    verification_status: str = "pending"  # pending, approved, rejected
    rejection_reason: Optional[str] = None
    is_online: bool = False
    documents: Dict[str, str] = {}  # {"license": "path", "rc": "path", etc}

class UserCreate(BaseModel):
    phone: str
    role: str
    full_name: str
    email: Optional[EmailStr] = None

class OTPRequest(BaseModel):
    phone: str

class OTPVerify(BaseModel):
    phone: str
    otp: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

# ==================== Driver Models ====================

class Vehicle(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    driver_id: str
    vehicle_type: str  # van, bus
    vehicle_number: str
    seating_capacity: int
    vehicle_images: List[str] = []  # paths to images
    insurance_valid_till: Optional[str] = None
    pollution_cert_valid_till: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VehicleCreate(BaseModel):
    vehicle_type: str
    vehicle_number: str
    seating_capacity: int

# ==================== Booking Models ====================

class Booking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_type: str  # one_time, subscription
    student_id: str
    student_name: str
    driver_id: Optional[str] = None
    driver_name: Optional[str] = None
    
    pickup_location: Dict[str, Any]
    drop_location: Dict[str, Any]
    
    # Timing
    ride_type: str  # now, later
    scheduled_time: Optional[datetime] = None
    
    # Status
    status: str = "requested"  # requested, accepted, rejected, driver_arrived, on_trip, completed, cancelled
    
    # Subscription fields
    subscription_days: List[str] = []  # ["Monday", "Tuesday", etc]
    subscription_start_date: Optional[datetime] = None
    subscription_end_date: Optional[datetime] = None
    
    # Pricing
    price: float = 0.0
    payment_status: str = "pending"  # pending, completed, failed, refunded
    payment_id: Optional[str] = None
    
    # Matching
    match_attempts: int = 0
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    accepted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class BookingCreate(BaseModel):
    booking_type: str
    pickup_location: Dict[str, Any]
    drop_location: Dict[str, Any]
    ride_type: str = "now"
    scheduled_time: Optional[datetime] = None
    subscription_days: List[str] = []

# ==================== Trip Models ====================

class TripLocation(BaseModel):
    lat: float
    lng: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class Trip(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    booking_id: str
    driver_id: str
    student_id: str
    
    status: str = "not_started"  # not_started, in_progress, completed
    
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    
    locations: List[TripLocation] = []  # GPS ping history
    
    # Simulated path for demo
    simulated_path: List[Dict[str, float]] = []
    current_index: int = 0
    
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ==================== Payment Models ====================

class Payment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    transaction_id: str
    user_id: str
    booking_id: str
    amount: float
    currency: str = "INR"
    payment_method: str  # upi, card, wallet, cash
    status: str = "pending"  # pending, completed, failed, refunded
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PaymentInitiate(BaseModel):
    booking_id: str
    amount: float
    payment_method: str
    force_fail: bool = False

# ==================== SOS Models ====================

class SOSAlert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str
    trip_id: Optional[str] = None
    location: Optional[Dict[str, float]] = None
    message: Optional[str] = None
    status: str = "open"  # open, resolved
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None

class SOSCreate(BaseModel):
    trip_id: Optional[str] = None
    location: Optional[Dict[str, float]] = None
    message: Optional[str] = None

# ==================== Admin Models ====================

class DriverVerificationAction(BaseModel):
    action: str  # approve, reject
    reason: Optional[str] = None

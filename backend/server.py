from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import bcrypt
import jwt
from bson import ObjectId
import socketio
import base64
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create uploads directory
UPLOADS_DIR = ROOT_DIR / 'uploads'
UPLOADS_DIR.mkdir(exist_ok=True)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 43200  # 30 days

# Socket.IO setup
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=True
)

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ==================== Models ====================

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password_hash: str
    full_name: str
    phone: Optional[str] = None
    role: str  # 'student', 'driver', 'admin'
    profile_image: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Driver-specific fields
    license_number: Optional[str] = None
    license_image: Optional[str] = None
    van_number: Optional[str] = None
    van_capacity: Optional[int] = None
    id_document: Optional[str] = None
    insurance_document: Optional[str] = None
    pollution_cert: Optional[str] = None
    vehicle_rc: Optional[str] = None
    is_verified: bool = False
    verification_status: str = "pending"  # pending, approved, rejected
    rejection_reason: Optional[str] = None
    documents_uploaded_at: Optional[datetime] = None
    
    # Student-specific fields
    school_college: Optional[str] = None
    home_location: Optional[Dict[str, float]] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    role: str
    school_college: Optional[str] = None
    home_location: Optional[Dict[str, Any]] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str]
    role: str
    profile_image: Optional[str]
    school_college: Optional[str]
    home_location: Optional[Dict[str, Any]]
    license_number: Optional[str]
    van_number: Optional[str]
    van_capacity: Optional[int]
    is_verified: bool
    verification_status: str
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class Route(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    driver_id: str
    driver_name: str
    route_name: str
    start_location: Dict[str, Any]
    end_location: Dict[str, Any]
    waypoints: List[Dict[str, Any]] = []
    total_seats: int
    available_seats: int
    price_per_month: float
    departure_time: str
    school_college: str
    days_operating: List[str] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    created_at: datetime = Field(default_factory=datetime.utcnow)

class RouteCreate(BaseModel):
    route_name: str
    start_location: Dict[str, Any]
    end_location: Dict[str, Any]
    waypoints: List[Dict[str, Any]] = []
    total_seats: int
    price_per_month: float
    departure_time: str
    school_college: str
    days_operating: List[str] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

class Booking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    route_id: str
    student_id: str
    student_name: str
    driver_id: str
    pickup_location: Dict[str, Any]
    status: str = "pending"
    monthly_fee: float
    payment_status: str = "unpaid"
    trip_status: str = "not_started"  # not_started, in_progress, completed
    trip_start_time: Optional[datetime] = None
    trip_end_time: Optional[datetime] = None
    current_location: Optional[Dict[str, float]] = None  # For live tracking
    created_at: datetime = Field(default_factory=datetime.utcnow)
    approved_at: Optional[datetime] = None

class BookingCreate(BaseModel):
    route_id: str
    pickup_location: Dict[str, Any]

class BookingUpdate(BaseModel):
    status: str

class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    driver_id: str
    student_id: str
    student_name: str
    route_id: str
    rating: int
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ReviewCreate(BaseModel):
    driver_id: str
    route_id: str
    rating: int
    comment: Optional[str] = None

class DriverUpdate(BaseModel):
    license_number: Optional[str] = None
    license_image: Optional[str] = None
    van_number: Optional[str] = None
    van_capacity: Optional[int] = None
    id_document: Optional[str] = None
    insurance_document: Optional[str] = None
    pollution_cert: Optional[str] = None
    vehicle_rc: Optional[str] = None

class DriverVerificationAction(BaseModel):
    action: str  # approve, reject
    reason: Optional[str] = None

class SOSAlert(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str
    user_role: str
    booking_id: Optional[str] = None
    location: Optional[Dict[str, float]] = None
    message: Optional[str] = None
    status: str = "open"  # open, resolved
    priority: str = "high"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None

class SOSCreate(BaseModel):
    booking_id: Optional[str] = None
    location: Optional[Dict[str, float]] = None
    message: Optional[str] = None

class LocationUpdate(BaseModel):
    lat: float
    lng: float

# ==================== Helper Functions ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication")

def user_to_response(user: dict) -> UserResponse:
    return UserResponse(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        phone=user.get("phone"),
        role=user["role"],
        profile_image=user.get("profile_image"),
        school_college=user.get("school_college"),
        home_location=user.get("home_location"),
        license_number=user.get("license_number"),
        van_number=user.get("van_number"),
        van_capacity=user.get("van_capacity"),
        is_verified=user.get("is_verified", False),
        verification_status=user.get("verification_status", "pending"),
        created_at=user["created_at"]
    )

# ==================== Socket.IO Events ====================

@sio.event
async def connect(sid, environ):
    logging.info(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    logging.info(f"Client disconnected: {sid}")

@sio.event
async def join_room(sid, data):
    room = data.get('room')
    await sio.enter_room(sid, room)
    logging.info(f"Client {sid} joined room {room}")

@sio.event
async def leave_room(sid, data):
    room = data.get('room')
    await sio.leave_room(sid, room)
    logging.info(f"Client {sid} left room {room}")

@sio.event
async def location_update(sid, data):
    """Driver sends location update"""
    booking_id = data.get('booking_id')
    location = data.get('location')
    
    # Update booking location in database
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"current_location": location}}
    )
    
    # Broadcast to student tracking this booking
    await sio.emit('driver_location', {
        'booking_id': booking_id,
        'location': location,
        'timestamp': datetime.utcnow().isoformat()
    }, room=f"booking_{booking_id}")

# ==================== API Routes ====================

@api_router.get("/")
async def root():
    return {"message": "Van Transportation App API", "version": "1.0.0"}

# ==================== Authentication Routes ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        full_name=user_data.full_name,
        phone=user_data.phone,
        role=user_data.role,
        school_college=user_data.school_college,
        home_location=user_data.home_location,
        is_verified=(user_data.role == 'admin')
    )
    
    await db.users.insert_one(user.dict())
    access_token = create_access_token(data={"sub": user.id, "role": user.role})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_to_response(user.dict())
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": user["id"], "role": user["role"]})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_to_response(user)
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return user_to_response(current_user)

# ==================== Driver Routes ====================

@api_router.put("/drivers/profile")
async def update_driver_profile(driver_data: DriverUpdate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "driver":
        raise HTTPException(status_code=403, detail="Only drivers can update driver profile")
    
    update_data = {k: v for k, v in driver_data.dict().items() if v is not None}
    if update_data:
        update_data["documents_uploaded_at"] = datetime.utcnow()
        await db.users.update_one({"id": current_user["id"]}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": current_user["id"]})
    return user_to_response(updated_user)

@api_router.get("/drivers", response_model=List[UserResponse])
async def get_all_drivers():
    drivers = await db.users.find({"role": "driver"}).to_list(1000)
    return [user_to_response(driver) for driver in drivers]

# ==================== File Upload Route ====================

@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload file and return path"""
    try:
        # Generate unique filename
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = UPLOADS_DIR / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Return relative path
        return {
            "success": True,
            "filename": unique_filename,
            "path": f"/uploads/{unique_filename}",
            "url": f"/api/uploads/{unique_filename}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@api_router.get("/uploads/{filename}")
async def get_uploaded_file(filename: str):
    """Serve uploaded files"""
    file_path = UPLOADS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # Read file and return base64 for display
    with open(file_path, "rb") as f:
        file_data = base64.b64encode(f.read()).decode('utf-8')
    
    return {"data": file_data, "filename": filename}

# ==================== Route Routes ====================

@api_router.post("/routes", response_model=Route)
async def create_route(route_data: RouteCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "driver":
        raise HTTPException(status_code=403, detail="Only drivers can create routes")
    
    if not current_user.get("is_verified"):
        raise HTTPException(status_code=403, detail="Only verified drivers can create routes")
    
    route = Route(
        driver_id=current_user["id"],
        driver_name=current_user["full_name"],
        route_name=route_data.route_name,
        start_location=route_data.start_location,
        end_location=route_data.end_location,
        waypoints=route_data.waypoints,
        total_seats=route_data.total_seats,
        available_seats=route_data.total_seats,
        price_per_month=route_data.price_per_month,
        departure_time=route_data.departure_time,
        school_college=route_data.school_college,
        days_operating=route_data.days_operating
    )
    
    await db.routes.insert_one(route.dict())
    return route

@api_router.get("/routes", response_model=List[Route])
async def get_routes(school_college: Optional[str] = None):
    query = {}
    if school_college:
        query["school_college"] = school_college
    
    routes = await db.routes.find(query).to_list(1000)
    return routes

@api_router.get("/routes/my", response_model=List[Route])
async def get_my_routes(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "driver":
        raise HTTPException(status_code=403, detail="Only drivers can view their routes")
    
    routes = await db.routes.find({"driver_id": current_user["id"]}).to_list(1000)
    return routes

@api_router.get("/routes/{route_id}", response_model=Route)
async def get_route(route_id: str):
    route = await db.routes.find_one({"id": route_id})
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return route

@api_router.delete("/routes/{route_id}")
async def delete_route(route_id: str, current_user: dict = Depends(get_current_user)):
    route = await db.routes.find_one({"id": route_id})
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    if route["driver_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.routes.delete_one({"id": route_id})
    return {"message": "Route deleted successfully"}

# ==================== Booking Routes ====================

@api_router.post("/bookings", response_model=Booking)
async def create_booking(booking_data: BookingCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can create bookings")
    
    route = await db.routes.find_one({"id": booking_data.route_id})
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    
    existing_booking = await db.bookings.find_one({
        "route_id": booking_data.route_id,
        "student_id": current_user["id"],
        "status": {"$in": ["pending", "approved", "active"]}
    })
    if existing_booking:
        raise HTTPException(status_code=400, detail="Already booked this route")
    
    if route["available_seats"] <= 0:
        raise HTTPException(status_code=400, detail="No seats available")
    
    booking = Booking(
        route_id=booking_data.route_id,
        student_id=current_user["id"],
        student_name=current_user["full_name"],
        driver_id=route["driver_id"],
        pickup_location=booking_data.pickup_location,
        monthly_fee=route["price_per_month"],
        status="pending"
    )
    
    await db.bookings.insert_one(booking.dict())
    return booking

@api_router.get("/bookings/my", response_model=List[Booking])
async def get_my_bookings(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "student":
        bookings = await db.bookings.find({"student_id": current_user["id"]}).to_list(1000)
    elif current_user["role"] == "driver":
        bookings = await db.bookings.find({"driver_id": current_user["id"]}).to_list(1000)
    else:
        bookings = await db.bookings.find({}).to_list(1000)
    
    return bookings

@api_router.put("/bookings/{booking_id}", response_model=Booking)
async def update_booking(booking_id: str, booking_update: BookingUpdate, current_user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking_update.status in ["approved", "rejected"] and booking["driver_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {"status": booking_update.status}
    if booking_update.status == "approved":
        update_data["approved_at"] = datetime.utcnow()
        await db.routes.update_one(
            {"id": booking["route_id"]},
            {"$inc": {"available_seats": -1}}
        )
    elif booking_update.status == "rejected" or booking_update.status == "cancelled":
        if booking["status"] == "approved":
            await db.routes.update_one(
                {"id": booking["route_id"]},
                {"$inc": {"available_seats": 1}}
            )
    
    await db.bookings.update_one({"id": booking_id}, {"$set": update_data})
    updated_booking = await db.bookings.find_one({"id": booking_id})
    return updated_booking

# ==================== Trip Management ====================

@api_router.post("/bookings/{booking_id}/start-trip")
async def start_trip(booking_id: str, current_user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["driver_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {
            "trip_status": "in_progress",
            "trip_start_time": datetime.utcnow()
        }}
    )
    
    return {"message": "Trip started", "booking_id": booking_id}

@api_router.post("/bookings/{booking_id}/end-trip")
async def end_trip(booking_id: str, current_user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["driver_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {
            "trip_status": "completed",
            "trip_end_time": datetime.utcnow(),
            "status": "completed"
        }}
    )
    
    return {"message": "Trip completed", "booking_id": booking_id}

@api_router.post("/bookings/{booking_id}/update-location")
async def update_location(booking_id: str, location: LocationUpdate, current_user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking["driver_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    location_data = {"lat": location.lat, "lng": location.lng}
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"current_location": location_data}}
    )
    
    # Emit via Socket.IO
    await sio.emit('driver_location', {
        'booking_id': booking_id,
        'location': location_data,
        'timestamp': datetime.utcnow().isoformat()
    }, room=f"booking_{booking_id}")
    
    return {"message": "Location updated", "location": location_data}

# ==================== SOS Routes ====================

@api_router.post("/sos")
async def create_sos_alert(sos_data: SOSCreate, current_user: dict = Depends(get_current_user)):
    sos = SOSAlert(
        user_id=current_user["id"],
        user_name=current_user["full_name"],
        user_role=current_user["role"],
        booking_id=sos_data.booking_id,
        location=sos_data.location,
        message=sos_data.message
    )
    
    await db.sos_alerts.insert_one(sos.dict())
    
    # Emit to admin dashboard
    await sio.emit('sos_alert', {
        'id': sos.id,
        'user_name': sos.user_name,
        'location': sos.location,
        'message': sos.message,
        'created_at': sos.created_at.isoformat()
    }, room='admin')
    
    return {"message": "SOS alert created", "alert_id": sos.id}

@api_router.get("/sos")
async def get_sos_alerts(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        # Students/Drivers see only their own
        alerts = await db.sos_alerts.find({"user_id": current_user["id"]}).to_list(1000)
    else:
        # Admin sees all
        alerts = await db.sos_alerts.find({}).sort("created_at", -1).to_list(1000)
    
    return alerts

@api_router.put("/sos/{alert_id}/resolve")
async def resolve_sos(alert_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can resolve SOS alerts")
    
    await db.sos_alerts.update_one(
        {"id": alert_id},
        {"$set": {
            "status": "resolved",
            "resolved_at": datetime.utcnow(),
            "resolved_by": current_user["full_name"]
        }}
    )
    
    return {"message": "SOS alert resolved"}

# ==================== Review Routes ====================

@api_router.post("/reviews", response_model=Review)
async def create_review(review_data: ReviewCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Only students can create reviews")
    
    review = Review(
        driver_id=review_data.driver_id,
        student_id=current_user["id"],
        student_name=current_user["full_name"],
        route_id=review_data.route_id,
        rating=review_data.rating,
        comment=review_data.comment
    )
    
    await db.reviews.insert_one(review.dict())
    return review

@api_router.get("/reviews/driver/{driver_id}", response_model=List[Review])
async def get_driver_reviews(driver_id: str):
    reviews = await db.reviews.find({"driver_id": driver_id}).to_list(1000)
    return reviews

# ==================== Admin Routes ====================

@api_router.get("/admin/users", response_model=List[UserResponse])
async def get_all_users(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find({}).to_list(1000)
    return [user_to_response(user) for user in users]

@api_router.get("/admin/drivers/pending")
async def get_pending_drivers(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    drivers = await db.users.find({
        "role": "driver",
        "verification_status": "pending",
        "documents_uploaded_at": {"$exists": True}
    }).to_list(1000)
    
    return [user_to_response(driver) for driver in drivers]

@api_router.put("/admin/drivers/{driver_id}/verify")
async def verify_driver(driver_id: str, action: DriverVerificationAction, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    if action.action == "approve":
        await db.users.update_one(
            {"id": driver_id, "role": "driver"},
            {"$set": {
                "is_verified": True,
                "verification_status": "approved"
            }}
        )
        return {"message": "Driver approved successfully"}
    elif action.action == "reject":
        await db.users.update_one(
            {"id": driver_id, "role": "driver"},
            {"$set": {
                "is_verified": False,
                "verification_status": "rejected",
                "rejection_reason": action.reason
            }}
        )
        return {"message": "Driver rejected", "reason": action.reason}
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

@api_router.get("/admin/trips/live")
async def get_live_trips(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get all in-progress trips
    live_trips = await db.bookings.find({"trip_status": "in_progress"}).to_list(1000)
    
    # Enrich with driver and student info
    enriched_trips = []
    for trip in live_trips:
        driver = await db.users.find_one({"id": trip["driver_id"]})
        route = await db.routes.find_one({"id": trip["route_id"]})
        
        enriched_trips.append({
            **trip,
            "driver_name": driver.get("full_name") if driver else "Unknown",
            "driver_phone": driver.get("phone") if driver else None,
            "route_name": route.get("route_name") if route else "Unknown",
        })
    
    return enriched_trips

@api_router.get("/admin/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_students = await db.users.count_documents({"role": "student"})
    total_drivers = await db.users.count_documents({"role": "driver"})
    verified_drivers = await db.users.count_documents({"role": "driver", "is_verified": True})
    pending_drivers = await db.users.count_documents({"role": "driver", "verification_status": "pending"})
    total_routes = await db.routes.count_documents({})
    total_bookings = await db.bookings.count_documents({})
    active_bookings = await db.bookings.count_documents({"status": "approved"})
    live_trips = await db.bookings.count_documents({"trip_status": "in_progress"})
    open_sos_alerts = await db.sos_alerts.count_documents({"status": "open"})
    
    # Calculate revenue (mock)
    total_revenue = total_bookings * 2000  # Mock calculation
    
    return {
        "total_students": total_students,
        "total_drivers": total_drivers,
        "verified_drivers": verified_drivers,
        "pending_drivers": pending_drivers,
        "total_routes": total_routes,
        "total_bookings": total_bookings,
        "active_bookings": active_bookings,
        "live_trips": live_trips,
        "open_sos_alerts": open_sos_alerts,
        "total_revenue": total_revenue
    }

# Include router
app.include_router(api_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Socket.IO
socket_app = socketio.ASGIApp(sio, app)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(socket_app, host="0.0.0.0", port=8001)

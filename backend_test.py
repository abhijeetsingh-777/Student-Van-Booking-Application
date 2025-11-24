#!/usr/bin/env python3
"""
Van Transportation App Backend API Testing
Tests all critical backend APIs according to the review request
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://studyride-1.preview.emergentagent.com/api"
TIMEOUT = 30

class APITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.session.timeout = TIMEOUT
        self.tokens = {}
        self.test_data = {}
        self.results = {
            "passed": 0,
            "failed": 0,
            "errors": []
        }
    
    def log(self, message: str, level: str = "INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None, token: str = None) -> Dict[str, Any]:
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        
        # Set headers
        req_headers = {"Content-Type": "application/json"}
        if headers:
            req_headers.update(headers)
        if token:
            req_headers["Authorization"] = f"Bearer {token}"
        
        try:
            self.log(f"{method} {endpoint}")
            if data:
                self.log(f"Request data: {json.dumps(data, indent=2)}")
            
            response = self.session.request(
                method=method,
                url=url,
                json=data,
                headers=req_headers
            )
            
            self.log(f"Response status: {response.status_code}")
            
            # Try to parse JSON response
            try:
                response_data = response.json()
                self.log(f"Response data: {json.dumps(response_data, indent=2)}")
            except:
                response_data = {"text": response.text}
                self.log(f"Response text: {response.text}")
            
            return {
                "status_code": response.status_code,
                "data": response_data,
                "success": 200 <= response.status_code < 300
            }
            
        except Exception as e:
            error_msg = f"Request failed: {str(e)}"
            self.log(error_msg, "ERROR")
            return {
                "status_code": 0,
                "data": {"error": error_msg},
                "success": False
            }
    
    def assert_response(self, response: Dict, expected_status: int = 200, description: str = ""):
        """Assert response status and log results"""
        if response["status_code"] == expected_status and response["success"]:
            self.results["passed"] += 1
            self.log(f"✅ PASS: {description}", "SUCCESS")
            return True
        else:
            self.results["failed"] += 1
            error_msg = f"❌ FAIL: {description} - Expected {expected_status}, got {response['status_code']}"
            self.log(error_msg, "ERROR")
            self.results["errors"].append(error_msg)
            return False
    
    def test_authentication_flow(self):
        """Test user registration and login"""
        self.log("=== TESTING AUTHENTICATION FLOW ===", "INFO")
        
        # Test student registration
        student_data = {
            "email": "student@test.com",
            "password": "test123",
            "full_name": "Test Student",
            "phone": "1234567890",
            "role": "student",
            "school_college": "Test University"
        }
        
        response = self.make_request("POST", "/auth/register", student_data)
        if self.assert_response(response, 200, "Student registration"):
            self.tokens["student"] = response["data"]["access_token"]
            self.test_data["student_id"] = response["data"]["user"]["id"]
        
        # Test driver registration
        driver_data = {
            "email": "driver@test.com",
            "password": "test123",
            "full_name": "Test Driver",
            "phone": "0987654321",
            "role": "driver"
        }
        
        response = self.make_request("POST", "/auth/register", driver_data)
        if self.assert_response(response, 200, "Driver registration"):
            self.tokens["driver"] = response["data"]["access_token"]
            self.test_data["driver_id"] = response["data"]["user"]["id"]
        
        # Test admin registration
        admin_data = {
            "email": "admin@test.com",
            "password": "test123",
            "full_name": "Test Admin",
            "role": "admin"
        }
        
        response = self.make_request("POST", "/auth/register", admin_data)
        if self.assert_response(response, 200, "Admin registration"):
            self.tokens["admin"] = response["data"]["access_token"]
            self.test_data["admin_id"] = response["data"]["user"]["id"]
        
        # Test student login
        login_data = {"email": "student@test.com", "password": "test123"}
        response = self.make_request("POST", "/auth/login", login_data)
        if self.assert_response(response, 200, "Student login"):
            self.tokens["student"] = response["data"]["access_token"]
        
        # Test driver login
        login_data = {"email": "driver@test.com", "password": "test123"}
        response = self.make_request("POST", "/auth/login", login_data)
        if self.assert_response(response, 200, "Driver login"):
            self.tokens["driver"] = response["data"]["access_token"]
        
        # Test admin login
        login_data = {"email": "admin@test.com", "password": "test123"}
        response = self.make_request("POST", "/auth/login", login_data)
        if self.assert_response(response, 200, "Admin login"):
            self.tokens["admin"] = response["data"]["access_token"]
        
        # Test /auth/me endpoint with student token
        response = self.make_request("GET", "/auth/me", token=self.tokens.get("student"))
        self.assert_response(response, 200, "Get current user (student)")
        
        # Test /auth/me endpoint with driver token
        response = self.make_request("GET", "/auth/me", token=self.tokens.get("driver"))
        self.assert_response(response, 200, "Get current user (driver)")
    
    def test_driver_flow(self):
        """Test driver route management"""
        self.log("=== TESTING DRIVER FLOW ===", "INFO")
        
        if not self.tokens.get("driver"):
            self.log("Driver token not available, skipping driver flow tests", "ERROR")
            return
        
        # Create a route
        route_data = {
            "route_name": "Morning Route 1",
            "start_location": {"lat": 28.6139, "lng": 77.2090, "address": "New Delhi"},
            "end_location": {"lat": 28.5355, "lng": 77.3910, "address": "Test University"},
            "total_seats": 10,
            "price_per_month": 2000,
            "departure_time": "08:00 AM",
            "school_college": "Test University"
        }
        
        response = self.make_request("POST", "/routes", route_data, token=self.tokens["driver"])
        if self.assert_response(response, 200, "Create route"):
            self.test_data["route_id"] = response["data"]["id"]
        
        # Get my routes
        response = self.make_request("GET", "/routes/my", token=self.tokens["driver"])
        self.assert_response(response, 200, "Get my routes")
        
        # Get all routes filtered by school
        response = self.make_request("GET", "/routes?school_college=Test University")
        self.assert_response(response, 200, "Get routes filtered by school")
    
    def test_student_flow(self):
        """Test student booking and review flow"""
        self.log("=== TESTING STUDENT FLOW ===", "INFO")
        
        if not self.tokens.get("student"):
            self.log("Student token not available, skipping student flow tests", "ERROR")
            return
        
        # Search for routes
        response = self.make_request("GET", "/routes?school_college=Test University")
        self.assert_response(response, 200, "Search routes by school")
        
        # Create a booking (if route exists)
        if self.test_data.get("route_id"):
            booking_data = {
                "route_id": self.test_data["route_id"],
                "pickup_location": {"lat": 28.6000, "lng": 77.2500, "address": "Student Home"}
            }
            
            response = self.make_request("POST", "/bookings", booking_data, token=self.tokens["student"])
            if self.assert_response(response, 200, "Create booking"):
                self.test_data["booking_id"] = response["data"]["id"]
        
        # Get my bookings
        response = self.make_request("GET", "/bookings/my", token=self.tokens["student"])
        self.assert_response(response, 200, "Get my bookings")
        
        # Create a review for the driver
        if self.test_data.get("driver_id") and self.test_data.get("route_id"):
            review_data = {
                "driver_id": self.test_data["driver_id"],
                "route_id": self.test_data["route_id"],
                "rating": 5,
                "comment": "Great driver, very punctual!"
            }
            
            response = self.make_request("POST", "/reviews", review_data, token=self.tokens["student"])
            self.assert_response(response, 200, "Create review")
    
    def test_driver_booking_management(self):
        """Test driver booking approval flow"""
        self.log("=== TESTING DRIVER BOOKING MANAGEMENT ===", "INFO")
        
        if not self.tokens.get("driver"):
            self.log("Driver token not available, skipping booking management tests", "ERROR")
            return
        
        # Get booking requests
        response = self.make_request("GET", "/bookings/my", token=self.tokens["driver"])
        self.assert_response(response, 200, "Get booking requests")
        
        # Approve a booking (if exists)
        if self.test_data.get("booking_id"):
            approval_data = {"status": "approved"}
            response = self.make_request("PUT", f"/bookings/{self.test_data['booking_id']}", 
                                       approval_data, token=self.tokens["driver"])
            self.assert_response(response, 200, "Approve booking")
            
            # Get booking requests again to verify approval
            response = self.make_request("GET", "/bookings/my", token=self.tokens["driver"])
            self.assert_response(response, 200, "Get booking requests after approval")
    
    def test_admin_flow(self):
        """Test admin management features"""
        self.log("=== TESTING ADMIN FLOW ===", "INFO")
        
        if not self.tokens.get("admin"):
            self.log("Admin token not available, skipping admin flow tests", "ERROR")
            return
        
        # Get all users
        response = self.make_request("GET", "/admin/users", token=self.tokens["admin"])
        self.assert_response(response, 200, "Get all users")
        
        # Get statistics
        response = self.make_request("GET", "/admin/stats", token=self.tokens["admin"])
        self.assert_response(response, 200, "Get statistics")
        
        # Verify the driver
        if self.test_data.get("driver_id"):
            response = self.make_request("PUT", f"/admin/verify-driver/{self.test_data['driver_id']}", 
                                       token=self.tokens["admin"])
            self.assert_response(response, 200, "Verify driver")
    
    def run_all_tests(self):
        """Run all test suites"""
        self.log("🚀 Starting Van Transportation App Backend API Tests", "INFO")
        self.log(f"Testing against: {self.base_url}", "INFO")
        
        try:
            # Test in order of priority
            self.test_authentication_flow()
            self.test_driver_flow()
            self.test_student_flow()
            self.test_driver_booking_management()
            self.test_admin_flow()
            
        except Exception as e:
            self.log(f"Test execution failed: {str(e)}", "ERROR")
            self.results["errors"].append(f"Test execution failed: {str(e)}")
        
        # Print summary
        self.log("=== TEST SUMMARY ===", "INFO")
        self.log(f"✅ Passed: {self.results['passed']}", "SUCCESS")
        self.log(f"❌ Failed: {self.results['failed']}", "ERROR")
        
        if self.results["errors"]:
            self.log("=== ERRORS ===", "ERROR")
            for error in self.results["errors"]:
                self.log(error, "ERROR")
        
        return self.results["failed"] == 0

if __name__ == "__main__":
    tester = APITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
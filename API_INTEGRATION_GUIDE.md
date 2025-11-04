# API Integration Guide - Add Admin Functionality

## Overview
The Add Admin functionality is now fully integrated with your backend MongoDB database. This guide explains how the data flows from the frontend form to MongoDB and back.

## Frontend Implementation

### 1. Manage Admins Page (`/manage-admins`)

**Location**: `CLIENT/src/pages/ManageAdmins.jsx`

**Features**:
- ✅ Add New Admin modal with form validation
- ✅ Password field (optional - defaults to `TempPassword123!`)
- ✅ Success/Error message display
- ✅ Real-time admin list update after creation
- ✅ Remove admin functionality
- ✅ Fetch and display all admins

**API Calls**:
```javascript
// Fetch all admins
GET /admins
Response: Array of admin objects

// Create new admin
POST /admins
Body: {
  name: string (required),
  email: string (required),
  phone: string (optional),
  password: string (defaults to 'TempPassword123!'),
  role: string (required)
}
Response: Created admin object with _id

// Delete admin
DELETE /admins/:id
Response: Success message
```

### 2. Manage Beaches Page (`/manage-beaches`)

**Location**: `CLIENT/src/pages/ManageBeaches.jsx`

**Features**:
- ✅ Add New Admin button in header
- ✅ Same modal and functionality as Manage Admins
- ✅ Refreshes beach list after admin creation (to show in assign dropdown)

## Backend Requirements

### MongoDB Schema
Your backend should have an Admin/User schema similar to:

```javascript
const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'super_admin', 'Office Manager', 'Supervisor', 'Assistant'],
    default: 'user'
  },
  avatar: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
```

### API Endpoints

#### 1. Create Admin
```
POST /api/admins
Content-Type: application/json
Authorization: Bearer <token>

Request Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1 234 567 8900",
  "password": "SecurePassword123!",
  "role": "Office Manager"
}

Success Response (201):
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1 234 567 8900",
  "role": "Office Manager",
  "createdAt": "2024-11-04T09:00:00.000Z"
}

Error Response (400):
{
  "message": "Email already exists"
}
```

#### 2. Get All Admins
```
GET /api/admins
Authorization: Bearer <token>

Success Response (200):
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1 234 567 8900",
    "role": "Office Manager",
    "avatar": "https://...",
    "createdAt": "2024-11-04T09:00:00.000Z"
  },
  ...
]
```

#### 3. Delete Admin
```
DELETE /api/admins/:id
Authorization: Bearer <token>

Success Response (200):
{
  "message": "Admin deleted successfully"
}

Error Response (404):
{
  "message": "Admin not found"
}
```

## Data Flow

### Creating an Admin

1. **User Action**: User clicks "Add New Admin" button
2. **Modal Opens**: Form displays with fields (Name, Email, Phone, Password, Role)
3. **Form Submission**: User fills form and clicks "Add Admin"
4. **Frontend Validation**: 
   - Name: Required
   - Email: Required, valid email format
   - Phone: Optional, tel format
   - Password: Optional (defaults to 'TempPassword123!'), min 6 characters
   - Role: Required, dropdown selection
5. **API Call**: 
   ```javascript
   axios.post('/admins', {
     name: form.name,
     email: form.email,
     phone: form.phone,
     password: form.password || 'TempPassword123!',
     role: form.role
   })
   ```
6. **Backend Processing**:
   - Validates data
   - Hashes password (should use bcrypt)
   - Checks for duplicate email
   - Saves to MongoDB
   - Returns created admin object
7. **Frontend Response Handling**:
   - Success: Shows green success message, adds admin to list, closes modal after 1.5s
   - Error: Shows red error message with backend error details
8. **UI Update**: Admin card appears in grid immediately (no page refresh needed)

### Fetching Admins

1. **Page Load**: Component mounts
2. **API Call**: `GET /admins`
3. **Backend**: Queries MongoDB, returns all admin documents
4. **Frontend**: Displays admins in card grid with avatar, name, role, email, phone

### Deleting an Admin

1. **User Action**: Clicks "Remove" button on admin card
2. **API Call**: `DELETE /admins/:id`
3. **Backend**: Removes admin from MongoDB
4. **Frontend**: Removes admin card from UI immediately

## Axios Configuration

**Location**: `CLIENT/src/api/axios.js`

```javascript
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatically attach JWT token to all requests
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;
```

## Usage Throughout Application

### Where Admins are Fetched:

1. **Manage Admins Page** (`/manage-admins`)
   - Displays all admins in card grid
   - Shows name, role, email, phone
   - Remove button per admin

2. **Manage Beaches Page** (`/manage-beaches`)
   - Fetches admins for "Assign Admin" dropdown
   - Shows admin avatars in beach rows
   - Add New Admin modal

3. **Assign Admin Modal**
   - Dropdown populated with all admins
   - Allows assigning admin to specific beach

## Testing the Integration

### 1. Test Create Admin
```bash
# Using curl
curl -X POST http://localhost:5000/api/admins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Admin",
    "email": "test@example.com",
    "phone": "+1234567890",
    "password": "TestPass123!",
    "role": "Office Manager"
  }'
```

### 2. Test Get Admins
```bash
curl -X GET http://localhost:5000/api/admins \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test Delete Admin
```bash
curl -X DELETE http://localhost:5000/api/admins/ADMIN_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Error Handling

The frontend handles these error scenarios:

1. **Network Error**: "Failed to create admin. Please try again."
2. **Validation Error**: Shows backend validation message
3. **Duplicate Email**: "Email already exists"
4. **Unauthorized**: Redirects to login
5. **Server Error**: Shows generic error message

## Security Considerations

1. **Password Hashing**: Backend should hash passwords using bcrypt before storing
2. **JWT Authentication**: All requests require valid JWT token
3. **Input Validation**: Both frontend and backend validate inputs
4. **Email Uniqueness**: Backend enforces unique email constraint
5. **Role-Based Access**: Only authorized users can create/delete admins

## Next Steps

1. Implement password reset functionality
2. Add email verification for new admins
3. Add admin profile edit functionality
4. Implement audit logs for admin actions
5. Add bulk admin import feature

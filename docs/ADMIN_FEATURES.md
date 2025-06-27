# Admin Features - Blood Donor App

This document outlines the admin functionality implemented in the Blood Donor App.

## Admin Access Control

### Overview

The app now includes admin-only features that are restricted to users with admin privileges. These features include:

- Test data cleanup tools
- Database maintenance utilities
- System administration functions

### Admin User Setup

#### Making a User an Admin

To make a user an admin, use the provided script:

```bash
node make-admin.js <email>
```

**Example:**

```bash
node make-admin.js admin@example.com
```

This script will:

- Find the user by email
- Set their `isAdmin` field to `true`
- Save the changes to the database

#### Required Environment

Make sure your `.env` file contains:

```
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
```

### Admin Features

#### 1. Admin Cleanup Tool

**Route:** `/admin-cleanup`
**API Endpoints:**

- `GET /api/admin/check-admin` - Verify admin status
- `GET /api/admin/test-data-count` - Count test data
- `DELETE /api/admin/cleanup-test-data` - Delete test data

**What it removes:**

- Users named: Alice Singh, test1, test2
- Users with emails: test@example.com, alice@test.com, alice.singh@test.com
- All blood requests created by these users
- All offers sent by or to these users

#### 2. Admin Dashboard Button

- Only visible to admin users
- Located in the main dashboard toolbar
- Provides quick access to admin tools

### Security Implementation

#### Backend Protection

- **Admin Middleware:** `Server/middleware/adminAuth.js`
  - Verifies JWT token
  - Checks user's `isAdmin` field
  - Returns 403 Forbidden for non-admin users
  - Returns 401 Unauthorized for invalid/missing tokens

#### Frontend Protection

- **Dashboard:** Admin cleanup button only visible to admin users
- **AdminCleanup Component:** Shows access denied message for non-admin users
- **API Error Handling:** Proper error messages for authentication failures

### Database Schema

#### User Model Update

Added `isAdmin` field to the User schema:

```javascript
isAdmin: {
  type: Boolean,
  default: false,
}
```

### API Error Responses

#### 401 Unauthorized

```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

#### 403 Forbidden

```json
{
  "success": false,
  "message": "Access denied. Admin privileges required."
}
```

#### 404 Not Found

```json
{
  "success": false,
  "message": "User not found."
}
```

### Testing Admin Endpoints

Use the provided test script to verify admin functionality:

```bash
node test-admin-cleanup.js
```

### Important Security Notes

1. **Admin Rights:** Only grant admin privileges to trusted users
2. **Token Security:** Ensure JWT_SECRET is strong and secure
3. **Data Backup:** Always backup data before using cleanup tools
4. **Access Logging:** Consider implementing admin action logging for audit trails

### Troubleshooting

#### Common Issues:

1. **"Access denied" errors:** User is not an admin
2. **"Token expired" errors:** User needs to log in again
3. **"User not found" errors:** Email doesn't exist in database

#### Solutions:

1. Use `make-admin.js` script to grant admin privileges
2. User should log out and log back in
3. Verify the email address is correct and user exists

### Future Enhancements

Potential admin features to add:

- User management (view, edit, delete users)
- System statistics and analytics
- Bulk operations on blood requests
- Admin activity logging
- Role-based permissions (super admin, moderator, etc.)

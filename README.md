# WattMate Backend API

Backend API untuk aplikasi WattMate - Smart Electricity Monitoring System.

## 🏠 Hardware Setup Anda

**ESP32 + PZEM-004T + Relay 1 Channel**

- 📡 ESP32: WiFi communication + control logic
- ⚡ PZEM-004T: Real-time electricity monitoring (V, A, W, kWh, PF, Hz)
- 🔌 Relay 1 Channel: Remote ON/OFF control untuk peralatan listrik

**Quick Setup:**

1. Backend API: Setup database + server (guide ini)
2. ESP32: Upload script `esp32/wattmate_esp32_pzem_relay.ino`
3. Hardware: Wiring ESP32-PZEM-Relay (lihat `esp32/README.md`)
4. Test: Monitor via Serial + cek data di API

**Files untuk Anda:**

- `esp32/wattmate_esp32_pzem_relay.ino` - Main ESP32 script
- `esp32/README.md` - Wiring diagram + troubleshooting
- `MONITORING_API.md` - API endpoints documentation

---

## 🚀 Features

- **Authentication & Authorization**

  - User registration dan login
  - JWT token authentication
  - Refresh token mechanism
  - Password reset via email
  - Rate limiting untuk security

- **User Management**

  - User profile management
  - Change password
  - Logout dari semua devices

- **Database**

  - MySQL database dengan connection pooling
  - Database migration system
  - Structured models dan relationships

- **Security**
  - Password hashing dengan bcryptjs
  - Helmet untuk HTTP headers security
  - CORS configuration
  - Input validation dengan Joi
  - Rate limiting

## 📋 Prerequisites

- Node.js v16 atau lebih tinggi
- MySQL 5.7 atau lebih tinggi
- npm atau yarn

## 🛠 Installation

1. **Clone repository dan install dependencies**

```bash
cd monitoring-listrik-be
npm install
```

2. **Setup environment variables**

```bash
cp .env.example .env
```

Edit file `.env` dan sesuaikan dengan konfigurasi Anda:

```env
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wattmate_db
DB_USER=root
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=15m
JWT_REFRESH_SECRET=your_refresh_token_secret_here
JWT_REFRESH_EXPIRE=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

3. **Setup database**

Buat database MySQL:

```sql
CREATE DATABASE wattmate_db;
```

Jalankan migration untuk membuat tables:

```bash
npm run db:migrate
```

4. **Start server**

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication Endpoints

#### 1. Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "phone": "081234567890",
  "address": "Jl. Contoh No. 123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Registrasi berhasil",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "081234567890",
      "address": "Jl. Contoh No. 123",
      "is_verified": false,
      "created_at": "2025-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 2. Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "081234567890",
      "address": "Jl. Contoh No. 123",
      "is_verified": false,
      "created_at": "2025-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 3. Refresh Token

```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 4. Forgot Password

```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### 5. Reset Password

```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_here",
  "password": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

### Protected Endpoints (Require Authentication)

Untuk mengakses endpoint yang dilindungi, sertakan header:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### 6. Get Profile

```http
GET /api/auth/profile
Authorization: Bearer YOUR_ACCESS_TOKEN
```

#### 7. Update Profile

```http
PUT /api/auth/profile
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "name": "John Doe Updated",
  "phone": "081234567890",
  "address": "Jl. Baru No. 456"
}
```

#### 8. Change Password

```http
POST /api/auth/change-password
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

#### 9. Logout

```http
POST /api/auth/logout
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 10. Logout All Devices

```http
POST /api/auth/logout-all
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Utility Endpoints

#### Health Check

```http
GET /api/health
```

#### API Info

```http
GET /api/info
```

## 🗄 Database Schema

### Users Table

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  reset_password_token VARCHAR(255),
  reset_password_expires DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Refresh Tokens Table

```sql
CREATE TABLE refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🔒 Security Features

- **Password Hashing**: bcryptjs dengan salt rounds 12
- **JWT Tokens**: Access token (15m) dan refresh token (7d)
- **Rate Limiting**: Mencegah brute force attacks
- **Input Validation**: Validasi menggunakan Joi
- **CORS**: Configured untuk frontend tertentu
- **Helmet**: Security headers untuk Express

## 🧪 Testing

```bash
# Install dev dependencies jika belum
npm install

# Run tests
npm test
```

## 📁 Project Structure

```
src/
├── controllers/        # Controller logic
│   └── AuthController.js
├── database/          # Database configuration
│   ├── database.js
│   └── migrate.js
├── middleware/        # Custom middleware
│   ├── auth.js
│   └── validation.js
├── models/           # Database models
│   ├── User.js
│   └── RefreshToken.js
├── routes/           # API routes
│   ├── api.js
│   └── auth.js
└── server.js         # Main server file
```

## 🚀 Deployment

1. **Set NODE_ENV ke production**

```bash
export NODE_ENV=production
```

2. **Update environment variables**

```bash
# Update .env file dengan production values
```

3. **Run migration**

```bash
npm run db:migrate
```

4. **Start server**

```bash
npm start
```

## 📝 Default Credentials

Setelah menjalankan migration, admin user default akan dibuat:

- **Email**: admin@wattmate.com
- **Password**: admin123

> ⚠️ **Penting**: Ganti password default ini setelah deployment!

## 🤝 Contributing

1. Fork repository
2. Buat feature branch
3. Commit changes
4. Push ke branch
5. Create Pull Request

## 📄 License

MIT License - lihat file LICENSE untuk detail.

# be-wattmate

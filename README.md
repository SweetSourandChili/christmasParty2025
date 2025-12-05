# 🎄 Christmas Party 2025

A beautiful web application for managing your Christmas party! Features include user authentication with SMS verification, performance stage registration, event RSVPs, and a comprehensive admin panel.

## ✨ Features

- **User Authentication** with SMS verification (development mode logs codes to console)
- **Performance Stage** - Create or join performances (1-3 participants)
- **Event Management** - RSVP to events like Cocktail Hour, Christmas Market, Dinner Feast
- **Ticket System** with three states:
  - `NOT_ACTIVATED` - User hasn't registered for any performance
  - `PAYMENT_PENDING` - User registered, awaiting payment confirmation
  - `ACTIVATED` - Payment confirmed, ticket active
- **Countdown Timer** - Shows time remaining until Dec 31, 2025 at 6:00 PM (UTC+3)
- **Admin Panel** - Manage users, approve payments, create events
- **Beautiful Christmas Theme** with snowfall animation

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up the database:**
   ```bash
   npx prisma migrate dev
   ```

3. **Seed the database with admin user and sample events:**
   ```bash
   npx tsx prisma/seed.ts
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open http://localhost:3000**

### Default Admin Credentials

After running the seed script:
- **Phone:** +905551234567
- **Password:** admin123

> **Note:** In development mode, SMS verification codes are logged to the terminal console instead of being sent via SMS.

## 📱 SMS Verification

### Development Mode

By default, the app runs in development mode where SMS codes are printed to the console. Look for:

```
🔐 SMS Verification Code for +905551234567: 123456
```

### Production Mode (Twilio)

To enable real SMS in production:

1. Create a Twilio account at https://www.twilio.com
2. Get your Account SID, Auth Token, and a phone number
3. Update `.env.local`:

```env
SMS_MODE=production
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

4. Install Twilio SDK:
```bash
npm install twilio
```

## 🎫 Ticket Flow

1. **User registers** → Ticket created with `NOT_ACTIVATED` status
2. **User creates/joins performance** → Status changes to `PAYMENT_PENDING`
3. **Admin approves payment** → Status changes to `ACTIVATED`

Users with `NOT_ACTIVATED` tickets see a warning message prompting them to register for a performance.

## 👑 Admin Panel

Access the admin panel at `/admin` (only visible to admin users).

Features:
- View all users and their ticket statuses
- Approve/change ticket statuses
- Create and manage events
- View statistics (total users, activated tickets, etc.)

## 🛠️ Tech Stack

- **Framework:** Next.js 14 with App Router
- **Database:** SQLite with Prisma ORM
- **Authentication:** NextAuth.js with Credentials provider
- **Styling:** Tailwind CSS with custom Christmas theme
- **Language:** TypeScript

## 📁 Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   │   ├── auth/      # Authentication endpoints
│   │   ├── admin/     # Admin-only endpoints
│   │   ├── events/    # Event management
│   │   ├── performances/  # Performance management
│   │   └── ticket/    # Ticket info
│   ├── admin/         # Admin panel page
│   ├── dashboard/     # Main dashboard
│   ├── events/        # Events page
│   ├── login/         # Login page
│   ├── performances/  # Performances page
│   ├── register/      # Registration page
│   └── ticket/        # Ticket page
├── components/        # Reusable components
├── lib/              # Utilities (prisma, auth, sms)
└── types/            # TypeScript type definitions

prisma/
├── schema.prisma     # Database schema
├── seed.ts           # Database seeder
└── dev.db           # SQLite database file
```

## 🎨 Customization

### Event Date

To change the party date, edit `src/components/Countdown.tsx`:

```typescript
const EVENT_DATE = new Date("2025-12-31T18:00:00+03:00");
```

### Theme Colors

Customize the Christmas theme in `src/app/globals.css`:

```css
:root {
  --color-christmas-red: #c41e3a;
  --color-christmas-green: #165b33;
  --color-christmas-gold: #f4c430;
  --color-christmas-cream: #fffef9;
  --color-christmas-dark: #0c1f13;
}
```

## 📝 License

This project is for personal use. Have a Merry Christmas! 🎅

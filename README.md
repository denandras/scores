# Secure Database Application

A modern, secure web application with Google OAuth authentication, Supabase database integration, and Mega S4 storage for file uploads.

## Features

- ✅ **Modern UI**: Built with Next.js 14, TypeScript, and Tailwind CSS
- 🔐 **Secure Authentication**: Google OAuth only, no unauthorized access
- 👥 **User Roles**: User and Admin roles with different permissions
- 📊 **Database Management**: View, create, edit, and delete database records
- 📁 **File Upload**: Secure file uploads to Mega S4 storage
- 🎨 **Beautiful Design**: Modern UI components inspired by react-bits.dev
- 🌙 **Dark Mode**: Support for both light and dark themes

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **UI Components**: Radix UI primitives with custom styling
- **Authentication**: Supabase Auth with Google OAuth
- **Database**: Supabase PostgreSQL
- **File Storage**: Mega S4 cloud storage
- **Deployment**: Vercel (recommended)

## Setup Instructions

### 1. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth (configure in Supabase)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Mega S4 Storage
MEGA_EMAIL=your_mega_email
MEGA_PASSWORD=your_mega_password
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Authentication > Providers and enable Google OAuth
3. Add your Google OAuth credentials
4. Run the database schema from `database-schema.md` in the SQL editor
5. Set up Row Level Security policies (included in schema)

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://your-domain.com/auth/callback` (production)

### 4. Mega Storage Setup

1. Create an account at [mega.nz](https://mega.nz)
2. Get your account credentials
3. Add them to your environment variables

### 5. Installation and Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### 6. First Admin User

After the first user signs up, manually set their role to 'admin' in the Supabase dashboard:

```sql
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'your-admin-email@example.com';
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication routes
│   ├── dashboard/         # Main dashboard
│   ├── login/             # Login page
│   └── upload/            # File upload page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── auth/             # Authentication components
│   └── dashboard/        # Dashboard components
└── lib/                  # Utility functions
    ├── supabase.ts       # Supabase client
    ├── mega.ts           # Mega storage client
    └── utils.ts          # Helper utilities
```

## User Roles & Permissions

### User Role
- View database records
- Create new records
- Edit/delete own records
- Upload files
- Delete own account

### Admin Role
- All user permissions
- Edit/delete any records
- View user management panel
- Manage user roles
- Access admin-only features

## Security Features

- 🔒 **Google OAuth Only**: No password-based authentication
- 🛡️ **Row Level Security**: Database-level access control
- 🔐 **Protected Routes**: Middleware-based route protection
- 👤 **User Isolation**: Users can only see/edit their own data (unless admin)
- 🚫 **No Unauthorized Access**: Strict authentication requirements

## Deployment

### Vercel (Recommended)

1. Fork this repository
2. Connect to Vercel
3. Add environment variables
4. Deploy

### Other Platforms

This is a standard Next.js application and can be deployed to any platform that supports Node.js.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.

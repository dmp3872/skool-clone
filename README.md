# Peptide Price Community

A complete Skool.com clone built specifically for the Peptide Price community - your trusted resource for peptide information, research, and supplier reviews.

## Features

### Community Feed
- Create and share posts about peptide experiences, research, and results
- Peptide-specific categories: Research, Dosing Protocols, Supplier Reviews, Results, Questions, General
- Like and comment on posts
- Image and video support for sharing before/after results
- Pinned posts for important community announcements

### Classroom (Courses)
- **Peptide Fundamentals for Beginners** - Complete guide to getting started safely
- **Healing Peptides: BPC-157 & TB-500** - Comprehensive recovery and healing protocols
- **Growth Hormone Peptides & Anti-Aging** - Master GH-releasing peptides for longevity
- Track your learning progress
- Video lessons with structured curriculum

### Gamification & Leaderboard
- Earn points for community engagement
- Level up as you contribute
- Compete on the community leaderboard
- Points for posting, commenting, and completing courses

### Events & Calendar
- Weekly Peptide Q&A Sessions
- BPC-157 Protocol Workshops
- Supplier Review Discussions
- Member Results Showcases
- Expert guest lectures

### Members Directory
- Browse all community members
- Filter by experience level
- View member stats and contributions

### Notifications
- Stay updated on likes, comments, and mentions
- Track replies to your posts
- Never miss important community updates

### Admin Dashboard
- User management and moderation
- Course creation and management
- Post moderation tools
- Invite link management
- Ban/unban users with reason tracking

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd skool-clone
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new Supabase project at https://supabase.com
   - Copy your project URL and anon key
   - Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run database migrations:
   - Go to your Supabase dashboard > SQL Editor
   - Run all migration files from `supabase/migrations/` in order

5. Start the development server:
```bash
npm run dev
```

6. Open http://localhost:5173 in your browser

### Demo Account

After initial setup, the app will seed demo data including:
- **Admin**: admin@peptideprice.com / admin123
- 10 demo community members
- 20 peptide-related posts
- 3 educational courses
- 5 upcoming events

## Features Matching Skool 1:1

This platform replicates all core Skool.com functionality:

✅ **Community**: Discussion forums with categories, likes, comments, and media
✅ **Classroom**: Course hosting with lessons, progress tracking, and video content
✅ **Gamification**: Points system, levels, and leaderboard
✅ **Calendar**: Event scheduling with RSVP functionality
✅ **Members**: Directory with profiles and stats
✅ **Notifications**: Real-time updates on community activity
✅ **Admin Tools**: Complete management dashboard

## Customizations for Peptide Price

- Yellow/gold color scheme matching peptide/health branding
- Peptide-specific post categories (Research, Dosing Protocols, Supplier Reviews, Results)
- Courses focused on peptide education and safety
- Events tailored to peptide community needs
- Community guidelines for responsible peptide discussion

## Development

### Build for production:
```bash
npm run build
```

### Preview production build:
```bash
npm run preview
```

### Type checking:
```bash
npm run type-check
```

## Project Structure

```
src/
├── components/
│   ├── Admin/          # Admin dashboard and tools
│   ├── Auth/           # Login and registration
│   ├── Courses/        # Classroom and lessons
│   ├── Events/         # Calendar and events
│   ├── Feed/           # Community posts and feed
│   ├── Leaderboard/    # Gamification leaderboard
│   ├── Members/        # Member directory
│   ├── Notifications/  # Notification center
│   └── Profile/        # User profiles
├── lib/
│   ├── auth.ts         # Authentication functions
│   ├── database.ts     # Database initialization
│   └── supabase.ts     # Supabase client
└── App.tsx             # Main application component
```

## License

This project is for the exclusive use of the Peptide Price community.

## Support

For questions, suggestions, or issues, please contact the admin team or post in the Community Feed.

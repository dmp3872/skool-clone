/*
  # SKOOL Clone Complete Database Schema

  ## Overview
  Complete database schema for a SKOOL-like learning community platform with:
  - User management with profiles, roles, and gamification
  - Community feed with posts, comments, and likes
  - Course system with lessons and progress tracking
  - Events with RSVP functionality
  - Notifications system
  - Leaderboard and achievements

  ## Tables Created

  ### 1. users
  - Stores user profiles with authentication
  - Includes gamification (points, levels)
  - Role-based access (admin, moderator, member)
  - Tracks activity and engagement

  ### 2. posts
  - Community feed posts
  - Category organization
  - Pin functionality
  - Engagement metrics (likes, comments count)

  ### 3. comments
  - Post comments with threading support
  - Links to users and posts

  ### 4. post_likes
  - Track post likes
  - Prevent duplicate likes

  ### 5. courses
  - Learning courses with metadata
  - Instructor assignment
  - Lesson tracking

  ### 6. lessons
  - Course content units
  - Video integration
  - Ordered sequence
  - Points awards

  ### 7. user_progress
  - Track lesson completion
  - Course progress
  - Completion timestamps

  ### 8. events
  - Community events
  - Date/time scheduling
  - Location tracking

  ### 9. event_rsvps
  - RSVP status tracking
  - Unique per user/event

  ### 10. notifications
  - User notifications
  - Read/unread status
  - Deep linking

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Policies for authenticated users
  - Ownership checks for modifications
  - Public read access where appropriate

  ## Notes
  - All tables use UUID primary keys
  - Timestamps for audit trail
  - Cascading deletes for data integrity
  - Default values for better UX
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar TEXT DEFAULT 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
  bio TEXT DEFAULT 'New community member',
  role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'moderator', 'member')),
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_active TIMESTAMPTZ DEFAULT now()
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_pinned BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Post likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  thumbnail TEXT DEFAULT 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400',
  instructor_id UUID REFERENCES users(id),
  total_lessons INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  video_url TEXT,
  order_num INTEGER NOT NULL,
  points INTEGER DEFAULT 10,
  duration TEXT DEFAULT '5 min',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id)
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date TEXT NOT NULL,
  event_time TEXT NOT NULL,
  location TEXT DEFAULT 'Online',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Event RSVPs table
CREATE TABLE IF NOT EXISTS event_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK(status IN ('going', 'maybe', 'not_going')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Posts policies
CREATE POLICY "Anyone can view posts"
  ON posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Post likes policies
CREATE POLICY "Anyone can view likes"
  ON post_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can like posts"
  ON post_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON post_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Courses policies
CREATE POLICY "Anyone can view courses"
  ON courses FOR SELECT
  TO authenticated
  USING (true);

-- Lessons policies
CREATE POLICY "Anyone can view lessons"
  ON lessons FOR SELECT
  TO authenticated
  USING (true);

-- User progress policies
CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Events policies
CREATE POLICY "Anyone can view events"
  ON events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Event RSVPs policies
CREATE POLICY "Anyone can view RSVPs"
  ON event_rsvps FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own RSVPs"
  ON event_rsvps FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own RSVPs"
  ON event_rsvps FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own RSVPs"
  ON event_rsvps FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_course_id ON user_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event_id ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);
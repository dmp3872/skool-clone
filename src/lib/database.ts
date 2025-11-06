import { supabase } from './supabase';

export async function initializeDatabase() {
  try {
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (count === null || count > 0) {
      console.log('Database already initialized');
      return;
    }

    console.log('Seeding database with demo data...');

    const adminPassword = 'admin123';
    const { data: adminAuth, error: adminError } = await supabase.auth.signUp({
      email: 'admin@skool.com',
      password: adminPassword,
      options: {
        data: {
          name: 'Admin User',
        },
        emailRedirectTo: undefined,
      }
    });

    if (adminError) {
      console.error('Admin signup error:', adminError);
    }

    if (adminAuth.user) {
      const { error: insertError } = await supabase.from('users').insert({
        id: adminAuth.user.id,
        email: 'admin@skool.com',
        name: 'Admin User',
        username: 'admin',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        bio: 'Platform administrator',
        role: 'admin',
        points: 500,
        level: 5,
      });

      if (insertError) {
        console.error('Admin profile insert error:', insertError);
      } else {
        console.log('Admin account created: admin@skool.com / admin123');
      }
    }

    const demoUsers = [
      { name: 'Sarah Johnson', username: 'sarahj', points: 340, level: 4 },
      { name: 'Mike Chen', username: 'mikechen', points: 290, level: 3 },
      { name: 'Emily Davis', username: 'emilyd', points: 250, level: 3 },
      { name: 'Alex Thompson', username: 'alexthompson', points: 210, level: 3 },
      { name: 'Jessica Lee', username: 'jessicalee', points: 180, level: 2 },
      { name: 'David Wilson', username: 'davidw', points: 150, level: 2 },
      { name: 'Lisa Martinez', username: 'lisam', points: 120, level: 2 },
      { name: 'James Brown', username: 'jamesb', points: 90, level: 1 },
      { name: 'Anna Taylor', username: 'annat', points: 60, level: 1 },
      { name: 'Chris Anderson', username: 'chrisa', points: 30, level: 1 },
    ];

    const userIds: string[] = [];
    for (const user of demoUsers) {
      const { data: userData, error: userError } = await supabase.auth.signUp({
        email: `${user.username}@example.com`,
        password: 'password123',
        options: {
          data: {
            name: user.name,
          },
          emailRedirectTo: undefined,
        }
      });

      if (userError) {
        console.error(`Error creating ${user.username}:`, userError);
        continue;
      }

      if (userData.user) {
        const { error: userInsertError } = await supabase.from('users').insert({
          id: userData.user.id,
          email: `${user.username}@example.com`,
          name: user.name,
          username: user.username,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
          bio: 'Community member passionate about learning',
          role: 'member',
          points: user.points,
          level: user.level,
        });

        if (userInsertError) {
          console.error(`Error inserting profile for ${user.username}:`, userInsertError);
        } else {
          userIds.push(userData.user.id);
        }
      }
    }

    console.log(`Created ${userIds.length} demo users`);

    const { data: allUsers } = await supabase.from('users').select('id');
    const userIdList = allUsers?.map(u => u.id) || [];

    const categories = ['General', 'Announcements', 'Questions', 'Resources', 'Discussions'];
    const postTitles = [
      'Welcome to our community!',
      'Tips for getting started with the platform',
      'How to maximize your learning experience',
      'Community guidelines and best practices',
      'Introducing our new course on React',
      'Weekly challenge: Build a todo app',
      'Share your project showcase here!',
      'Q&A: Ask me anything about web development',
      'Resources for learning JavaScript',
      'Success story: How I landed my first dev job',
      'Debugging tips and tricks',
      'Best practices for writing clean code',
      'Understanding async/await in JavaScript',
      'CSS Grid vs Flexbox: When to use which?',
      'Database design fundamentals',
      'API security best practices',
      'Mobile-first design principles',
      'Git workflow for teams',
      'Testing strategies for React apps',
      'Performance optimization techniques',
    ];

    for (let i = 0; i < postTitles.length; i++) {
      const randomUserId = userIdList[Math.floor(Math.random() * userIdList.length)];
      const { data: post } = await supabase
        .from('posts')
        .insert({
          user_id: randomUserId,
          title: postTitles[i],
          content: `This is detailed content for "${postTitles[i]}". Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`,
          category: categories[Math.floor(Math.random() * categories.length)],
          is_pinned: i < 2,
          likes_count: Math.floor(Math.random() * 25),
          comments_count: Math.floor(Math.random() * 10),
        })
        .select()
        .single();

      if (post) {
        const commentCount = Math.floor(Math.random() * 5);
        for (let j = 0; j < commentCount; j++) {
          const commenterId = userIdList[Math.floor(Math.random() * userIdList.length)];
          await supabase.from('comments').insert({
            post_id: post.id,
            user_id: commenterId,
            content: `Great post! Here are my thoughts on this topic. I think this is really valuable for the community.`,
          });
        }
      }
    }

    const courses = [
      {
        title: 'Web Development Fundamentals',
        description: 'Learn the basics of HTML, CSS, and JavaScript from scratch',
        lessons: [
          { title: 'Introduction to HTML', content: 'Learn HTML basics and structure', video: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
          { title: 'CSS Styling', content: 'Master CSS styling and layouts', video: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
          { title: 'JavaScript Basics', content: 'JavaScript fundamentals and syntax', video: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
          { title: 'DOM Manipulation', content: 'Working with the DOM and events', video: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        ],
      },
      {
        title: 'React Masterclass',
        description: 'Build modern web applications with React',
        lessons: [
          { title: 'React Components', content: 'Understanding components and props', video: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
          { title: 'State Management', content: 'Managing state in React applications', video: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
          { title: 'React Hooks', content: 'Using hooks effectively in your apps', video: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
          { title: 'Building a Project', content: 'Complete project walkthrough', video: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        ],
      },
      {
        title: 'Backend Development with Node.js',
        description: 'Create powerful server-side applications',
        lessons: [
          { title: 'Node.js Basics', content: 'Getting started with Node.js', video: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
          { title: 'Express Framework', content: 'Building APIs with Express', video: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
          { title: 'Database Integration', content: 'Working with databases in Node', video: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
          { title: 'Authentication', content: 'Implementing secure authentication', video: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
          { title: 'Deployment', content: 'Deploying your Node.js applications', video: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        ],
      },
    ];

    for (const course of courses) {
      const { data: courseData } = await supabase
        .from('courses')
        .insert({
          title: course.title,
          description: course.description,
          total_lessons: course.lessons.length,
          instructor_id: adminAuth.user?.id,
        })
        .select()
        .single();

      if (courseData) {
        for (let i = 0; i < course.lessons.length; i++) {
          await supabase.from('lessons').insert({
            course_id: courseData.id,
            title: course.lessons[i].title,
            description: course.lessons[i].content.substring(0, 50) + '...',
            content: course.lessons[i].content,
            video_url: course.lessons[i].video,
            order_num: i + 1,
            points: 10,
            duration: '5 min',
          });
        }
      }
    }

    const events = [
      { title: 'Weekly Community Meetup', description: 'Join us for our weekly video call to connect and share', date: '2025-10-15', time: '18:00' },
      { title: 'React Workshop', description: 'Hands-on React coding session for beginners', date: '2025-10-20', time: '14:00' },
      { title: 'Career Q&A Session', description: 'Ask questions about tech careers and get advice', date: '2025-10-22', time: '16:00' },
      { title: 'Project Demo Day', description: 'Share your projects with the community', date: '2025-10-25', time: '17:00' },
      { title: 'Guest Speaker: Senior Developer', description: 'Industry insights from an experienced developer', date: '2025-11-01', time: '19:00' },
    ];

    for (const event of events) {
      await supabase.from('events').insert({
        title: event.title,
        description: event.description,
        event_date: event.date,
        event_time: event.time,
        location: 'Zoom',
        created_by: adminAuth.user?.id || userIdList[0],
      });
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

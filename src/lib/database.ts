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
      email: 'admin@peptideprice.com',
      password: adminPassword,
      options: {
        data: {
          name: 'Peptide Price Admin',
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
        email: 'admin@peptideprice.com',
        name: 'Peptide Price Admin',
        username: 'admin',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        bio: 'Peptide Price community administrator - Here to help with all your peptide questions',
        role: 'admin',
        points: 500,
        level: 5,
      });

      if (insertError) {
        console.error('Admin profile insert error:', insertError);
      } else {
        console.log('Admin account created: admin@peptideprice.com / admin123');
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
          bio: 'Peptide enthusiast exploring optimal health and longevity',
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

    const categories = ['peptide-research', 'dosing-protocols', 'supplier-reviews', 'results', 'questions', 'general'];
    const postTitles = [
      'Welcome to Peptide Price Community!',
      'BPC-157: My 30-day healing protocol results',
      'Best peptide suppliers - 2025 updated list',
      'TB-500 dosing: What worked for me',
      'GHK-Cu for anti-aging - Before and after',
      'Comparing prices across top peptide vendors',
      'Peptide reconstitution guide for beginners',
      'CJC-1295/Ipamorelin stack experiences?',
      'Quality testing: How to verify peptide purity',
      'Thymosin Alpha-1 for immune support',
      'Storage tips for maintaining peptide potency',
      'PT-141 dosing protocols and experiences',
      'Peptide cycling: When and why to take breaks',
      'Melanotan II safety and dosing guide',
      'NAD+ vs NMN: Which is better?',
      'Peptide injection techniques - Step by step',
      'Semax and Selank for cognitive enhancement',
      'Post-cycle recovery protocols',
      'Understanding peptide certificate of analysis',
      'Combining peptides: Safe stacks and synergies',
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
            content: `Thanks for sharing! I've had similar experiences with peptides. This information is really valuable for the community.`,
          });
        }
      }
    }

    const courses = [
      {
        title: 'Peptide Fundamentals for Beginners',
        description: 'Complete guide to getting started with peptides safely and effectively',
        lessons: [
          { title: 'Introduction to Peptides', content: 'Learn what peptides are, how they work, and their benefits for health and longevity', video: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
          { title: 'Reconstitution & Storage', content: 'Master proper peptide reconstitution techniques and optimal storage conditions', video: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
          { title: 'Injection Techniques', content: 'Safe and effective subcutaneous and intramuscular injection methods', video: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
          { title: 'Dosing & Safety', content: 'Understanding proper dosing protocols, cycling, and safety considerations', video: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        ],
      },
      {
        title: 'Healing Peptides: BPC-157 & TB-500',
        description: 'Comprehensive guide to the most popular healing and recovery peptides',
        lessons: [
          { title: 'BPC-157 Overview', content: 'Understanding BPC-157 mechanism of action and benefits for injury healing', video: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
          { title: 'TB-500 Deep Dive', content: 'TB-500 for tissue repair, inflammation reduction, and recovery', video: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
          { title: 'Optimal Dosing Protocols', content: 'Evidence-based dosing strategies for maximum healing benefits', video: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
          { title: 'Combining BPC-157 & TB-500', content: 'Synergistic stacking for enhanced recovery and healing', video: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        ],
      },
      {
        title: 'Growth Hormone Peptides & Anti-Aging',
        description: 'Master GH-releasing peptides for longevity and body composition',
        lessons: [
          { title: 'GH Peptide Basics', content: 'Introduction to CJC-1295, Ipamorelin, and other GH secretagogues', video: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
          { title: 'CJC-1295 & Ipamorelin Stack', content: 'The most popular GH peptide combination for fat loss and muscle gain', video: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
          { title: 'GHK-Cu for Anti-Aging', content: 'Copper peptides for skin, hair, and overall rejuvenation', video: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
          { title: 'Thymosin Alpha-1', content: 'Immune system optimization and longevity benefits', video: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
          { title: 'Long-Term Protocols', content: 'Creating sustainable peptide protocols for lasting anti-aging benefits', video: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
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
      { title: 'Weekly Peptide Q&A Session', description: 'Join us for live Q&A about peptides, dosing, and experiences', date: '2025-11-15', time: '18:00' },
      { title: 'BPC-157 Protocol Workshop', description: 'Deep dive into BPC-157 usage for injury healing and recovery', date: '2025-11-20', time: '14:00' },
      { title: 'Supplier Review Discussion', description: 'Community discussion on peptide supplier experiences and recommendations', date: '2025-11-22', time: '16:00' },
      { title: 'Member Results Showcase', description: 'Share your peptide journey results and experiences', date: '2025-11-25', time: '17:00' },
      { title: 'Guest Expert: Peptide Researcher', description: 'Special guest lecture on the latest peptide research and developments', date: '2025-12-01', time: '19:00' },
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

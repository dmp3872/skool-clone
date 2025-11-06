import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '../../lib/auth';
import { BookOpen, Play } from 'lucide-react';
import { CourseDetail } from './CourseDetail';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  total_lessons: number;
  instructor_id: string;
}

interface CoursesProps {
  currentUser: User;
}

export function Courses({ currentUser }: CoursesProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    setLoading(true);
    try {
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;
      setCourses(coursesData || []);

      for (const course of coursesData || []) {
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('completed')
          .eq('user_id', currentUser.id)
          .eq('course_id', course.id);

        const completed = progressData?.filter(p => p.completed).length || 0;
        const percentage = course.total_lessons > 0
          ? Math.round((completed / course.total_lessons) * 100)
          : 0;

        setProgressMap(prev => ({ ...prev, [course.id]: percentage }));
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (selectedCourse) {
    return (
      <CourseDetail
        course={selectedCourse}
        currentUser={currentUser}
        onBack={() => {
          setSelectedCourse(null);
          loadCourses();
        }}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Courses</h2>
        <p className="text-gray-600">Expand your knowledge with our curated courses</p>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">🎓</div>
          <h3 className="text-xl font-semibold mb-2">No courses available yet</h3>
          <p className="text-gray-600">Check back soon for new learning content!</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              onClick={() => setSelectedCourse(course)}
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            >
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-2">{course.description}</p>

                <div className="flex items-center gap-2 text-gray-500 mb-4">
                  <BookOpen size={16} />
                  <span className="text-sm">{course.total_lessons} lessons</span>
                </div>

                {progressMap[course.id] > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{progressMap[course.id]}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${progressMap[course.id]}%` }}
                      />
                    </div>
                  </div>
                )}

                <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  <Play size={18} />
                  {progressMap[course.id] > 0 ? 'Continue Learning' : 'Start Course'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

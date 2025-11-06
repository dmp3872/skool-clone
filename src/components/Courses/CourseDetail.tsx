import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '../../lib/auth';
import { ArrowLeft, Play, CheckCircle, Lock } from 'lucide-react';
import { LessonViewer } from './LessonViewer';

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string;
  content: string;
  video_url: string;
  order_num: number;
  points: number;
  duration: string;
}

interface CourseDetailProps {
  course: any;
  currentUser: User;
  onBack: () => void;
}

export function CourseDetail({ course, currentUser, onBack }: CourseDetailProps) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLessons();
  }, [course.id]);

  async function loadLessons() {
    setLoading(true);
    try {
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', course.id)
        .order('order_num', { ascending: true });

      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);

      const { data: progressData } = await supabase
        .from('user_progress')
        .select('lesson_id, completed')
        .eq('user_id', currentUser.id)
        .eq('course_id', course.id)
        .eq('completed', true);

      const completed = new Set(progressData?.map(p => p.lesson_id) || []);
      setCompletedLessons(completed);
    } catch (error) {
      console.error('Error loading lessons:', error);
    } finally {
      setLoading(false);
    }
  }

  function isLessonUnlocked(lesson: Lesson): boolean {
    if (lesson.order_num === 1) return true;
    const previousLesson = lessons.find(l => l.order_num === lesson.order_num - 1);
    return previousLesson ? completedLessons.has(previousLesson.id) : false;
  }

  const progress = lessons.length > 0
    ? Math.round((completedLessons.size / lessons.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (selectedLesson) {
    return (
      <LessonViewer
        lesson={selectedLesson}
        course={course}
        currentUser={currentUser}
        isCompleted={completedLessons.has(selectedLesson.id)}
        onBack={() => {
          setSelectedLesson(null);
          loadLessons();
        }}
        onComplete={() => {
          loadLessons();
        }}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} />
        Back to Courses
      </button>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-64 object-cover"
        />
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
          <p className="text-gray-700 mb-6">{course.description}</p>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Course Progress</span>
              <span>{progress}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {completedLessons.size} of {lessons.length} lessons completed
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Content</h2>

        <div className="space-y-3">
          {lessons.map((lesson) => {
            const isCompleted = completedLessons.has(lesson.id);
            const isUnlocked = isLessonUnlocked(lesson);

            return (
              <div
                key={lesson.id}
                onClick={() => isUnlocked && setSelectedLesson(lesson)}
                className={`border rounded-lg p-4 transition-all ${
                  isUnlocked
                    ? 'cursor-pointer hover:shadow-md hover:border-blue-300'
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    {isCompleted ? (
                      <CheckCircle className="text-green-600" size={20} />
                    ) : isUnlocked ? (
                      <Play className="text-blue-600" size={20} />
                    ) : (
                      <Lock className="text-gray-400" size={20} />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-500">
                        Lesson {lesson.order_num}
                      </span>
                      {isCompleted && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          Completed
                        </span>
                      )}
                      {!isUnlocked && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          Locked
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{lesson.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">{lesson.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{lesson.duration}</span>
                      <span>+{lesson.points} points</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

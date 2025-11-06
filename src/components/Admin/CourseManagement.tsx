import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '../../lib/auth';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  total_lessons: number;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  video_url: string;
  order_num: number;
  points: number;
  duration: string;
}

interface CourseManagementProps {
  currentUser: User;
}

export function CourseManagement({ currentUser }: CourseManagementProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [managingLessons, setManagingLessons] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCourse(courseId: string) {
    if (!confirm('Delete this course and all its lessons?')) return;

    try {
      await supabase.from('courses').delete().eq('id', courseId);
      loadCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showCreateCourse) {
    return <CourseForm currentUser={currentUser} onClose={() => { setShowCreateCourse(false); loadCourses(); }} />;
  }

  if (editingCourse) {
    return <CourseForm currentUser={currentUser} course={editingCourse} onClose={() => { setEditingCourse(null); loadCourses(); }} />;
  }

  if (managingLessons) {
    return <LessonManagement courseId={managingLessons} onBack={() => { setManagingLessons(null); loadCourses(); }} />;
  }

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <button
          onClick={() => setShowCreateCourse(true)}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Create New Course
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500">No courses yet. Create your first course!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start gap-4">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-32 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
                  <p className="text-gray-600 mb-2">{course.description}</p>
                  <p className="text-sm text-gray-500">{course.total_lessons} lessons</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setManagingLessons(course.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Manage Lessons
                  </button>
                  <button
                    onClick={() => setEditingCourse(course)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CourseForm({ currentUser, course, onClose }: { currentUser: User; course?: Course; onClose: () => void }) {
  const [title, setTitle] = useState(course?.title || '');
  const [description, setDescription] = useState(course?.description || '');
  const [thumbnail, setThumbnail] = useState(course?.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (course) {
        await supabase
          .from('courses')
          .update({ title, description, thumbnail })
          .eq('id', course.id);
      } else {
        await supabase.from('courses').insert({
          title,
          description,
          thumbnail,
          instructor_id: currentUser.id,
          total_lessons: 0,
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Failed to save course');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900">
          {course ? 'Edit Course' : 'Create Course'}
        </h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Thumbnail URL</label>
          <input
            type="url"
            value={thumbnail}
            onChange={(e) => setThumbnail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : course ? 'Update Course' : 'Create Course'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function LessonManagement({ courseId, onBack }: { courseId: string; onBack: () => void }) {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    loadLessons();
  }, [courseId]);

  async function loadLessons() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_num', { ascending: true });

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Error loading lessons:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteLesson(lessonId: string) {
    if (!confirm('Delete this lesson?')) return;

    try {
      await supabase.from('lessons').delete().eq('id', lessonId);
      await supabase
        .from('courses')
        .update({ total_lessons: Math.max(0, lessons.length - 1) })
        .eq('id', courseId);
      loadLessons();
    } catch (error) {
      console.error('Error deleting lesson:', error);
    }
  }

  if (showCreate || editingLesson) {
    return (
      <LessonForm
        courseId={courseId}
        lesson={editingLesson}
        nextOrderNum={lessons.length + 1}
        onClose={() => {
          setShowCreate(false);
          setEditingLesson(null);
          loadLessons();
        }}
      />
    );
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-6 text-gray-600 hover:text-gray-900 font-medium"
      >
        ← Back to Courses
      </button>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <button
          onClick={() => setShowCreate(true)}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          Add Lesson
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : lessons.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500">No lessons yet. Add your first lesson!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                      Lesson {lesson.order_num}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900">{lesson.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-2">{lesson.description}</p>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>{lesson.duration}</span>
                    <span>+{lesson.points} points</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingLesson(lesson)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button
                    onClick={() => handleDeleteLesson(lesson.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LessonForm({ courseId, lesson, nextOrderNum, onClose }: { courseId: string; lesson: Lesson | null; nextOrderNum: number; onClose: () => void }) {
  const [title, setTitle] = useState(lesson?.title || '');
  const [description, setDescription] = useState(lesson?.description || '');
  const [content, setContent] = useState(lesson?.content || '');
  const [videoUrl, setVideoUrl] = useState(lesson?.video_url || '');
  const [orderNum, setOrderNum] = useState(lesson?.order_num || nextOrderNum);
  const [points, setPoints] = useState(lesson?.points || 10);
  const [duration, setDuration] = useState(lesson?.duration || '5 min');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (lesson) {
        await supabase
          .from('lessons')
          .update({ title, description, content, video_url: videoUrl, order_num: orderNum, points, duration })
          .eq('id', lesson.id);
      } else {
        await supabase.from('lessons').insert({
          course_id: courseId,
          title,
          description,
          content,
          video_url: videoUrl,
          order_num: orderNum,
          points,
          duration,
        });

        const { data: course } = await supabase
          .from('courses')
          .select('total_lessons')
          .eq('id', courseId)
          .single();

        if (course) {
          await supabase
            .from('courses')
            .update({ total_lessons: course.total_lessons + 1 })
            .eq('id', courseId);
        }
      }
      onClose();
    } catch (error) {
      console.error('Error saving lesson:', error);
      alert('Failed to save lesson');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900">
          {lesson ? 'Edit Lesson' : 'Create Lesson'}
        </h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
            <input
              type="number"
              value={orderNum}
              onChange={(e) => setOrderNum(parseInt(e.target.value))}
              required
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Points</label>
            <input
              type="number"
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value))}
              required
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
              placeholder="5 min"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Video URL (YouTube embed)</label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/embed/..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : lesson ? 'Update Lesson' : 'Create Lesson'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

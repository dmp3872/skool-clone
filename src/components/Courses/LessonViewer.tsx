import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '../../lib/auth';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { getVideoUrl } from '../../lib/videoStorage';

function getYouTubeEmbedUrl(url: string): string {
  if (!url) return '';

  // If it's already an embed URL, return it
  if (url.includes('youtube.com/embed/')) {
    return url;
  }

  // Extract video ID from various YouTube URL formats
  let videoId = '';

  // Format: https://www.youtube.com/watch?v=VIDEO_ID
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('v=')[1]?.split('&')[0];
  }
  // Format: https://youtu.be/VIDEO_ID
  else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0];
  }
  // Format: https://www.youtube.com/embed/VIDEO_ID
  else if (url.includes('youtube.com/embed/')) {
    videoId = url.split('embed/')[1]?.split('?')[0];
  }

  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }

  // If not a YouTube URL, return as is (might be another video platform)
  return url;
}

interface LessonViewerProps {
  lesson: any;
  course: any;
  currentUser: User;
  isCompleted: boolean;
  onBack: () => void;
  onComplete: () => void;
}

export function LessonViewer({
  lesson,
  course,
  currentUser,
  isCompleted,
  onBack,
  onComplete,
}: LessonViewerProps) {
  const [loading, setLoading] = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    // If video is uploaded to storage, fetch the signed URL
    if (lesson.video_type === 'upload' && lesson.video_storage_path) {
      loadUploadedVideo();
    }
  }, [lesson]);

  async function loadUploadedVideo() {
    const url = await getVideoUrl(lesson.video_storage_path);
    setUploadedVideoUrl(url);
  }

  async function handleMarkComplete() {
    if (isCompleted) return;

    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from('user_progress')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('lesson_id', lesson.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('user_progress')
          .update({ completed: true, completed_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase.from('user_progress').insert({
          user_id: currentUser.id,
          lesson_id: lesson.id,
          course_id: course.id,
          completed: true,
          completed_at: new Date().toISOString(),
        });
      }

      await supabase
        .from('users')
        .update({ points: currentUser.points + lesson.points })
        .eq('id', currentUser.id);

      onComplete();
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} />
        Back to Course
      </button>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="bg-black aspect-video">
          {lesson.video_type === 'upload' ? (
            // Uploaded video from Supabase Storage
            uploadedVideoUrl ? (
              <video
                src={uploadedVideoUrl}
                controls
                className="w-full h-full"
                controlsList="nodownload"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            )
          ) : (
            // External URL (YouTube, etc.)
            <iframe
              src={getYouTubeEmbedUrl(lesson.video_url)}
              title={lesson.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="text-sm font-medium text-gray-500 block mb-1">
                Lesson {lesson.order_num}
              </span>
              <h1 className="text-3xl font-bold text-gray-900">{lesson.title}</h1>
            </div>
            {isCompleted && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle size={24} />
                <span className="font-semibold">Completed</span>
              </div>
            )}
          </div>

          <p className="text-gray-700 mb-6">{lesson.description}</p>

          <div className="border-t pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Lesson Content</h2>
            <div className="prose max-w-none text-gray-700">
              <p>{lesson.content}</p>
            </div>
          </div>

          {!isCompleted && (
            <div className="mt-8 bg-blue-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Ready to continue?</h3>
              <p className="text-gray-600 mb-4">
                Mark this lesson as complete to unlock the next one and earn {lesson.points} points!
              </p>
              <button
                onClick={handleMarkComplete}
                disabled={loading}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : `Mark as Complete (+${lesson.points} points)`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

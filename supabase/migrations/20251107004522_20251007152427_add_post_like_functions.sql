/*
  # Add Post Like Helper Functions

  ## Overview
  Creates database functions to safely increment and decrement post like counts.
  These functions ensure atomic updates and prevent race conditions.

  ## Functions Created
  1. increment_post_likes - Safely increments the likes_count on a post
  2. decrement_post_likes - Safely decrements the likes_count on a post

  ## Notes
  - Functions use atomic updates to prevent race conditions
  - Decrement function prevents negative values
*/

CREATE OR REPLACE FUNCTION increment_post_likes(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE posts
  SET likes_count = likes_count + 1
  WHERE id = post_id;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_post_likes(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE posts
  SET likes_count = GREATEST(likes_count - 1, 0)
  WHERE id = post_id;
END;
$$;
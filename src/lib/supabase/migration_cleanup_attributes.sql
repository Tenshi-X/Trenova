-- Remove unnecessary attributes from user_profiles table
ALTER TABLE user_profiles 
DROP COLUMN IF EXISTS limit_image_upload,
DROP COLUMN IF EXISTS limit_chat_input,
DROP COLUMN IF EXISTS current_image_upload_count,
DROP COLUMN IF EXISTS current_chat_input_count,
DROP COLUMN IF EXISTS last_usage_reset;

-- Add new columns for unified analysis limit
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS analysis_limit INTEGER DEFAULT 150,
ADD COLUMN IF NOT EXISTS current_analysis_count INTEGER DEFAULT 0;

-- Remove old columns (optional, or just ignore them)
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS limit_image_upload;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS limit_chat_input;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS current_image_upload_count;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS current_chat_input_count;
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS last_usage_reset;

-- If you want to migrate existing limits/usage, you can do so here
-- UPDATE user_profiles SET analysis_limit = 150;

-- Add tool category fields to skin_problems table
-- These fields are used to categorize problems by tool type (e.g., 'العناية بالبشرة', 'العناية بالشعر')

ALTER TABLE IF EXISTS public.skin_problems
ADD COLUMN IF NOT EXISTS tool_title VARCHAR DEFAULT NULL,
ADD COLUMN IF NOT EXISTS tool_description TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS tool_media_url TEXT DEFAULT NULL;

-- Add index for faster filtering by tool_title
CREATE INDEX IF NOT EXISTS idx_skin_problems_tool_title ON public.skin_problems(tool_title);

-- Add comments
COMMENT ON COLUMN public.skin_problems.tool_title IS 'Tool category title (e.g., العناية بالبشرة, العناية بالشعر)';
COMMENT ON COLUMN public.skin_problems.tool_description IS 'Tool category description';
COMMENT ON COLUMN public.skin_problems.tool_media_url IS 'Tool category media/image URL';

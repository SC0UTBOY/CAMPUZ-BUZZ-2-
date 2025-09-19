
import { z } from 'zod';

// Content validation schemas
export const PostContentSchema = z.object({
  content: z.string()
    .min(1, "Content cannot be empty")
    .max(5000, "Content cannot exceed 5000 characters")
    .refine(
      (content) => !/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(content),
      "Script tags are not allowed"
    )
    .refine(
      (content) => !/javascript:/i.test(content),
      "JavaScript URLs are not allowed"
    ),
  title: z.string()
    .max(200, "Title cannot exceed 200 characters")
    .optional(),
  tags: z.array(z.string().max(50)).max(10, "Maximum 10 tags allowed").optional(),
});

export const CommentContentSchema = z.object({
  content: z.string()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment cannot exceed 2000 characters")
    .refine(
      (content) => !/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(content),
      "Script tags are not allowed"
    ),
});

export const MessageContentSchema = z.object({
  content: z.string()
    .min(1, "Message cannot be empty")
    .max(1000, "Message cannot exceed 1000 characters")
    .refine(
      (content) => !/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(content),
      "Script tags are not allowed"
    ),
});

export const ProfileUpdateSchema = z.object({
  display_name: z.string()
    .min(1, "Display name is required")
    .max(100, "Display name cannot exceed 100 characters")
    .refine(
      (name) => !/[<>\"'&]/g.test(name),
      "Display name contains invalid characters"
    ),
  bio: z.string()
    .max(500, "Bio cannot exceed 500 characters")
    .optional(),
  major: z.string().max(100).optional(),
  school: z.string().max(200).optional(),
  skills: z.array(z.string().max(50)).max(20).optional(),
  interests: z.array(z.string().max(50)).max(20).optional(),
});

// File validation schemas
export const FileUploadSchema = z.object({
  file: z.object({
    size: z.number().max(10 * 1024 * 1024, "File size cannot exceed 10MB"),
    type: z.string().refine(
      (type) => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(type),
      "Only JPEG, PNG, GIF, and WebP images are allowed"
    ),
    name: z.string()
      .max(255, "Filename too long")
      .refine(
        (name) => !/[<>:"/\\|?*]/g.test(name),
        "Filename contains invalid characters"
      ),
  }),
});

// URL validation
export const URLSchema = z.string().url("Invalid URL format").max(2048, "URL too long");

// Validation functions
export const validatePostContent = (data: unknown) => {
  return PostContentSchema.safeParse(data);
};

export const validateCommentContent = (data: unknown) => {
  return CommentContentSchema.safeParse(data);
};

export const validateMessageContent = (data: unknown) => {
  return MessageContentSchema.safeParse(data);
};

export const validateProfileUpdate = (data: unknown) => {
  return ProfileUpdateSchema.safeParse(data);
};

export const validateFileUpload = (data: unknown) => {
  return FileUploadSchema.safeParse(data);
};

export const validateURL = (url: string) => {
  return URLSchema.safeParse(url);
};

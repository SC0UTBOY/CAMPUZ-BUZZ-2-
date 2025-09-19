
import { supabase } from '@/integrations/supabase/client';
import { sanitizeFilename } from '@/utils/contentSanitization';
import { validateFileUpload } from '@/utils/inputValidation';

// File type validation - check actual file headers, not just MIME types
const getFileSignature = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const uint8Array = new Uint8Array(arrayBuffer);
      const signature = Array.from(uint8Array.slice(0, 8))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
      resolve(signature);
    };
    reader.readAsArrayBuffer(file.slice(0, 8));
  });
};

const validateFileSignature = (signature: string, fileType: string): boolean => {
  const signatures: Record<string, string[]> = {
    'image/jpeg': ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2', 'ffd8ffe3', 'ffd8ffe8'],
    'image/png': ['89504e47'],
    'image/gif': ['47494638'],
    'image/webp': ['52494646'] // RIFF header for WebP
  };

  const validSignatures = signatures[fileType] || [];
  return validSignatures.some(validSig => signature.startsWith(validSig));
};

export interface SecureUploadOptions {
  bucket: 'avatars' | 'posts' | 'attachments' | 'communities';
  maxSizeBytes?: number;
  allowedTypes?: string[];
  userId?: string;
}

export const secureFileUpload = async (
  file: File, 
  options: SecureUploadOptions
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    // Basic validation
    const validationResult = validateFileUpload({ file });
    if (!validationResult.success) {
      return { 
        success: false, 
        error: validationResult.error.issues[0]?.message || 'File validation failed' 
      };
    }

    // Check file signature to prevent MIME type spoofing
    const signature = await getFileSignature(file);
    const isValidSignature = validateFileSignature(signature, file.type);
    
    if (!isValidSignature) {
      return { 
        success: false, 
        error: 'File type validation failed. The file may be corrupted or not a valid image.' 
      };
    }

    // Apply size limits based on user role/bucket
    const maxSize = options.maxSizeBytes || (options.bucket === 'avatars' ? 2 * 1024 * 1024 : 10 * 1024 * 1024);
    if (file.size > maxSize) {
      return {
        success: false,
        error: `File size exceeds limit of ${Math.round(maxSize / 1024 / 1024)}MB`
      };
    }

    // Sanitize filename
    const sanitizedName = sanitizeFilename(file.name);
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileName = `${timestamp}_${randomSuffix}_${sanitizedName}`;

    // Create file path based on bucket and user
    let filePath: string;
    if (options.userId) {
      filePath = `${options.userId}/${fileName}`;
    } else {
      filePath = `public/${fileName}`;
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(options.bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return { 
        success: false, 
        error: 'Failed to upload file. Please try again.' 
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(options.bucket)
      .getPublicUrl(data.path);

    return { 
      success: true, 
      url: urlData.publicUrl 
    };

  } catch (error) {
    console.error('Secure upload error:', error);
    return { 
      success: false, 
      error: 'Upload failed due to an unexpected error.' 
    };
  }
};

// Function to scan uploaded files for potential threats (placeholder for future integration)
export const scanFileForThreats = async (file: File): Promise<boolean> => {
  // This is a placeholder for virus scanning integration
  // In a real implementation, you would integrate with a service like VirusTotal
  // or implement server-side scanning
  
  // For now, we'll do basic checks
  const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
  const fileName = file.name.toLowerCase();
  
  for (const ext of suspiciousExtensions) {
    if (fileName.endsWith(ext)) {
      return false; // File is suspicious
    }
  }
  
  return true; // File appears safe
};

// Enhanced file upload with threat scanning
export const enhancedSecureUpload = async (
  file: File,
  options: SecureUploadOptions
): Promise<{ success: boolean; url?: string; error?: string }> => {
  // First, scan for threats
  const isSafe = await scanFileForThreats(file);
  if (!isSafe) {
    return {
      success: false,
      error: 'File rejected due to security concerns.'
    };
  }

  // Proceed with normal secure upload
  return secureFileUpload(file, options);
};

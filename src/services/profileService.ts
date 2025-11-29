import { supabase } from '@/integrations/supabase/client';

/**
 * Upload avatar image to Supabase storage
 * @param userId - User ID for folder organization
 * @param file - Image file to upload
 * @returns Public URL of uploaded avatar
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
    console.log('Starting avatar upload:', { userId, fileName: file.name, fileSize: file.size, fileType: file.type });

    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}/${Date.now()}.${fileExt}`;

    console.log('Upload path:', filePath);

    const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

    if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

    console.log('Upload successful! Public URL:', data.publicUrl);
    return data.publicUrl; // This is the avatar_url to save in DB
}

/**
 * Delete avatar from Supabase storage
 * @param avatarUrl - Full URL of the avatar to delete
 */
export async function deleteAvatar(avatarUrl: string): Promise<void> {
    if (!avatarUrl) return;

    try {
        // Extract file path from URL
        const urlParts = avatarUrl.split('/avatars/');
        if (urlParts.length < 2) return;

        const filePath = urlParts[1];

        const { error } = await supabase.storage
            .from('avatars')
            .remove([filePath]);

        if (error) {
            console.error('Error deleting avatar:', error);
        }
    } catch (error) {
        console.error('Error in deleteAvatar:', error);
    }
}

/**
 * Update user profile avatar URL in user metadata
 * @param userId - User ID (not used, kept for compatibility)
 * @param avatarUrl - New avatar URL (null to remove)
 */
export async function updateProfileAvatar(
    userId: string,
    avatarUrl: string | null
): Promise<{ success: boolean; error?: any }> {
    // Update user metadata in auth.users (profiles is a view, cannot be updated directly)
    const { error } = await supabase.auth.updateUser({
        data: {
            avatar_url: avatarUrl
        }
    });

    if (error) {
        console.error('Error updating avatar in user metadata:', error);
    }

    return {
        success: !error,
        error
    };
}

/**
 * Validate image file before upload
 * @param file - File to validate
 * @returns Validation result with error message if invalid
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Invalid file format. Please upload JPG, PNG, or WebP images.'
        };
    }

    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
        return {
            valid: false,
            error: 'File size exceeds 5MB. Please choose a smaller image.'
        };
    }

    return { valid: true };
}

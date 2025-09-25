
import { supabase } from '@/integrations/supabase/client';
import CryptoJS from 'crypto-js';

export class LeakedPasswordService {
  // Check if password has been compromised
  static async isPasswordCompromised(password: string): Promise<boolean> {
    try {
      const passwordHash = CryptoJS.SHA256(password).toString();
      
      const { data, error } = await supabase
        .from('compromised_passwords')
        .select('id')
        .eq('password_hash', passwordHash)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking compromised password:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in password compromise check:', error);
      return false;
    }
  }

  // Add compromised password to database
  static async reportCompromisedPassword(password: string, source: string = 'user_report'): Promise<void> {
    try {
      const passwordHash = CryptoJS.SHA256(password).toString();
      
      await supabase
        .from('compromised_passwords')
        .insert({
          password_hash: passwordHash,
          source: source
        });
    } catch (error) {
      console.error('Error reporting compromised password:', error);
    }
  }

  // Bulk import compromised passwords (admin only)
  static async importCompromisedPasswords(passwords: string[], source: string): Promise<void> {
    try {
      const hashedPasswords = passwords.map(password => ({
        password_hash: CryptoJS.SHA256(password).toString(),
        source: source
      }));

      // Insert in batches to avoid timeout
      const batchSize = 1000;
      for (let i = 0; i < hashedPasswords.length; i += batchSize) {
        const batch = hashedPasswords.slice(i, i + batchSize);
        await supabase
          .from('compromised_passwords')
          .insert(batch);
      }
    } catch (error) {
      console.error('Error importing compromised passwords:', error);
    }
  }
}

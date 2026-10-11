import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import { memoryStore, ProfileRecord } from './store.js';

export class ProfileService {
  async getProfile(userId: string, email: string = ''): Promise<ProfileRecord & { email: string }> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        // Create initial profile if not present
        const { data: created, error: insertError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: userId,
            full_name: 'FinTrack Member',
            avatar_url: null,
            currency: 'INR',
            monthly_income: 0,
            average_monthly_spending: 0,
            average_monthly_savings: 0,
            preferred_payment_method: 'UPI',
            onboarding_completed: false,
            preferred_language: 'en',
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return { ...created, email };
      }

      return { ...data, email };
    }

    const profile = memoryStore.getProfile(userId);
    return { ...profile, email };
  }

  async updateProfile(
    userId: string,
    data: Partial<ProfileRecord>
  ): Promise<ProfileRecord> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: updated, error } = await supabaseAdmin
        .from('profiles')
        .update(data)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return updated;
    }

    return memoryStore.updateProfile(userId, data);
  }
}

export const profileService = new ProfileService();

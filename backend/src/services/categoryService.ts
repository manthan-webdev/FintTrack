import { supabaseAdmin, isSupabaseConfigured } from '../config/supabase.js';
import { memoryStore, CategoryRecord } from './store.js';

export class CategoryService {
  async getCategories(userId: string): Promise<CategoryRecord[]> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    }
    return memoryStore.getCategories(userId);
  }

  async createCategory(
    userId: string,
    data: { name: string; type: 'income' | 'expense'; icon: string; color: string }
  ): Promise<CategoryRecord> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: created, error } = await supabaseAdmin
        .from('categories')
        .insert({
          user_id: userId,
          name: data.name,
          type: data.type,
          icon: data.icon,
          color: data.color,
          is_default: false,
        })
        .select()
        .single();

      if (error) throw error;
      return created;
    }
    return memoryStore.createCategory(userId, data);
  }

  async updateCategory(
    userId: string,
    categoryId: string,
    data: Partial<{ name: string; type: 'income' | 'expense'; icon: string; color: string }>
  ): Promise<CategoryRecord> {
    if (isSupabaseConfigured && supabaseAdmin) {
      const { data: updated, error } = await supabaseAdmin
        .from('categories')
        .update(data)
        .eq('id', categoryId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return updated;
    }
    return memoryStore.updateCategory(userId, categoryId, data);
  }

  async deleteCategory(userId: string, categoryId: string): Promise<void> {
    if (isSupabaseConfigured && supabaseAdmin) {
      // Check if transactions exist for this category
      const { count, error: countError } = await supabaseAdmin
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', categoryId)
        .eq('user_id', userId);

      if (countError) throw countError;
      if (count && count > 0) {
        const err: any = new Error('Cannot delete category because active transactions are linked to it.');
        err.code = '23503';
        throw err;
      }

      const { error } = await supabaseAdmin
        .from('categories')
        .delete()
        .eq('id', categoryId)
        .eq('user_id', userId);

      if (error) throw error;
      return;
    }
    return memoryStore.deleteCategory(userId, categoryId);
  }
}

export const categoryService = new CategoryService();

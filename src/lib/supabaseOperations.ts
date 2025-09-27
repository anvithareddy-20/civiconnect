import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Issue {
  id: string;
  title: string;
  category: string;
  description: string;
  location?: string;
  priority: string;
  status: string;
  image_url?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface Suggestion {
  id: string;
  issue_id: string;
  user_id: string;
  content: string;
  likes: number;
  created_at: string;
  updated_at: string;
}

// Issue operations
export const saveIssue = async (issueData: {
  title: string;
  category: string;
  description: string;
  location?: string;
  priority?: string;
  images?: File[];
}): Promise<Issue | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to report an issue.",
        variant: "destructive",
      });
      return null;
    }

    let imageUrl = null;

    // Upload image if provided
    if (issueData.images && issueData.images.length > 0) {
      const file = issueData.images[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('issue-images')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: "Image upload failed",
          description: "Issue saved without image.",
          variant: "destructive",
        });
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('issue-images')
          .getPublicUrl(uploadData.path);
        imageUrl = publicUrl;
      }
    }

    const { data, error } = await supabase
      .from('issues')
      .insert({
        title: issueData.title,
        category: issueData.category,
        description: issueData.description,
        location: issueData.location,
        priority: issueData.priority || 'medium',
        status: 'reported',
        image_url: imageUrl,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      toast({
        title: "Error saving issue",
        description: "Please try again later.",
        variant: "destructive",
      });
      return null;
    }

    toast({
      title: "Issue reported successfully",
      description: "Thank you for reporting this issue.",
    });

    return data;
  } catch (error) {
    console.error('Error saving issue:', error);
    toast({
      title: "Unexpected error",
      description: "Please try again later.",
      variant: "destructive",
    });
    return null;
  }
};

export const getIssues = async (): Promise<Issue[]> => {
  try {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching issues:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching issues:', error);
    return [];
  }
};

export const deleteIssue = async (issueId: string): Promise<boolean> => {
  try {
    // First delete all suggestions related to this issue
    const { error: suggestionError } = await supabase
      .from('suggestions')
      .delete()
      .eq('issue_id', issueId);
    
    if (suggestionError) {
      console.error('Error deleting suggestions:', suggestionError);
      // Continue with issue deletion even if suggestion deletion fails
    }
    
    // Then delete the issue itself
    const { error } = await supabase
      .from('issues')
      .delete()
      .eq('id', issueId);

    if (error) {
      console.error('Error deleting issue:', error);
      toast({
        title: "Error deleting issue",
        description: "Please try again later.",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Issue deleted",
      description: "The issue and all related suggestions have been removed.",
    });

    return true;
  } catch (error) {
    console.error('Error deleting issue:', error);
    return false;
  }
};

// Suggestion operations
export const saveSuggestion = async (suggestionData: {
  issueId: string;
  content: string;
}): Promise<Suggestion | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to add a suggestion.",
        variant: "destructive",
      });
      return null;
    }

    const { data, error } = await supabase
      .from('suggestions')
      .insert({
        issue_id: suggestionData.issueId,
        content: suggestionData.content,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving suggestion:', error);
      toast({
        title: "Error saving suggestion",
        description: "Please try again later.",
        variant: "destructive",
      });
      return null;
    }

    toast({
      title: "Suggestion added",
      description: "Your suggestion has been recorded.",
    });

    return data;
  } catch (error) {
    console.error('Error saving suggestion:', error);
    return null;
  }
};

export const getSuggestions = async (issueId?: string): Promise<Suggestion[]> => {
  try {
    let query = supabase.from('suggestions').select('*');
    
    if (issueId) {
      query = query.eq('issue_id', issueId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching suggestions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return [];
  }
};

export const updateSuggestionLikes = async (suggestionId: string, likes: number): Promise<void> => {
  try {
    const { error } = await supabase
      .from('suggestions')
      .update({ likes })
      .eq('id', suggestionId);

    if (error) {
      console.error('Error updating suggestion likes:', error);
    }
  } catch (error) {
    console.error('Error updating suggestion likes:', error);
  }
};

export const completeIssue = async (issueId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('issues')
      .update({ 
        status: 'resolved',
        completed_at: new Date().toISOString()
      })
      .eq('id', issueId);

    if (error) {
      console.error('Error completing issue:', error);
      toast({
        title: "Error completing issue",
        description: "Please try again later.",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Issue completed",
      description: "The issue has been marked as resolved.",
    });

    return true;
  } catch (error) {
    console.error('Error completing issue:', error);
    return false;
  }
};
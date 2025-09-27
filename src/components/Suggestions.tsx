import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  ArrowLeft,
  MessageSquare,
  ThumbsUp,
  Send,
  Camera,
  User,
  Calendar,
  MapPin,
  Lightbulb
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getSuggestions, saveSuggestion, updateSuggestionLikes, Suggestion as StoredSuggestion, Issue as DatabaseIssue } from '@/lib/supabaseOperations';
import { useAuth } from '@/contexts/AuthContext';

type Suggestion = StoredSuggestion;

type Issue = DatabaseIssue;

const Suggestions = ({ issue, onBack }: { issue: Issue; onBack: () => void }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [newSuggestion, setNewSuggestion] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [likedSuggestions, setLikedSuggestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchSuggestions = async () => {
      const fetchedSuggestions = await getSuggestions(issue.id);
      setSuggestions(fetchedSuggestions);
    };
    fetchSuggestions();
  }, [issue.id]);

  const handleSubmitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add suggestions.",
        variant: "destructive"
      });
      return;
    }
    
    if (!newSuggestion.trim()) {
      toast({
        title: "Empty Suggestion",
        description: "Please write a suggestion before submitting.",
        variant: "destructive"
      });
      return;
    }

    const suggestion = await saveSuggestion({
      issueId: issue.id,
      content: newSuggestion.trim()
    });

    if (suggestion) {
      setSuggestions(prev => [suggestion, ...prev]);
      setNewSuggestion('');
    }
  };

  const handleLike = async (suggestionId: string) => {
    const isLiked = likedSuggestions.has(suggestionId);
    const currentSuggestion = suggestions.find(s => s.id === suggestionId);
    if (!currentSuggestion) return;
    
    const newLikes = currentSuggestion.likes + (isLiked ? -1 : 1);
    
    setSuggestions(prev => 
      prev.map(suggestion => 
        suggestion.id === suggestionId 
          ? { ...suggestion, likes: newLikes }
          : suggestion
      )
    );

    await updateSuggestionLikes(suggestionId, newLikes);

    setLikedSuggestions(prev => {
      const newSet = new Set(prev);
      if (isLiked) {
        newSet.delete(suggestionId);
      } else {
        newSet.add(suggestionId);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reported':
        return <Badge className="bg-status-reported text-white">Reported</Badge>;
      case 'progress':
        return <Badge className="bg-status-progress text-white">In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-status-resolved text-white">Resolved</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Status Tracker
        </Button>
      </div>

      {/* Issue Details */}
      <Card className="p-6 mb-6 shadow-card bg-gradient-card">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground">{issue.title}</h1>
              {getStatusBadge(issue.status)}
            </div>
            <p className="text-muted-foreground mb-4">{issue.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {issue.location}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Reported {new Date(issue.created_at).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {suggestions.length} Suggestions
              </div>
            </div>
          </div>
          
          {/* Issue Images */}
          {issue.image_url && (
            <div className="lg:w-80">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Issue Photo</h3>
              <img
                src={issue.image_url}
                alt="Issue photo"
                className="w-full h-48 object-cover rounded-lg border shadow-soft"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Add New Suggestion */}
      <Card className="p-6 mb-6 shadow-soft">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Add Your Suggestion</h3>
        </div>
        
        <form onSubmit={handleSubmitSuggestion} className="space-y-4">
          <div>
            <Label htmlFor="suggestion" className="sr-only">Your suggestion</Label>
            <Textarea
              id="suggestion"
              value={newSuggestion}
              onChange={(e) => setNewSuggestion(e.target.value)}
              placeholder="Share your ideas on how to resolve this issue or improve the solution..."
              className="min-h-[100px] resize-none transition-smooth focus:shadow-soft"
            />
          </div>
          
          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Add Photos
            </Button>
            
            <Button
              type="submit"
              className="flex items-center gap-2 bg-gradient-primary hover:shadow-soft transition-smooth"
            >
              <Send className="w-4 h-4" />
              Submit Suggestion
            </Button>
          </div>
        </form>
      </Card>

      {/* Suggestions List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Community Suggestions ({suggestions.length})
        </h3>
        
        {suggestions.map((suggestion) => (
          <Card key={suggestion.id} className="p-6 shadow-soft hover:shadow-card transition-smooth">
            <div className="flex gap-4">
              <Avatar className="w-10 h-10 bg-gradient-primary">
                <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                  {suggestion.user_id.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">User {suggestion.user_id.slice(0, 8)}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(suggestion.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <p className="text-foreground mb-4 leading-relaxed">{suggestion.content}</p>
                
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(suggestion.id)}
                    className={`flex items-center gap-2 transition-smooth ${
                      likedSuggestions.has(suggestion.id) 
                        ? 'text-primary bg-primary/10' 
                        : 'text-muted-foreground hover:text-primary'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    {suggestion.likes}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {suggestions.length === 0 && (
        <Card className="p-8 text-center shadow-soft">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No suggestions yet. Be the first to share your ideas!</p>
        </Card>
      )}
    </div>
  );
};

export default Suggestions;
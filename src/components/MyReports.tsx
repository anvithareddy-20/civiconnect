import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar,
  MapPin,
  Eye,
  Trash2,
  Car,
  Lightbulb,
  Droplets,
  Trash,
  Construction,
  TreePine,
  AlertCircle,
  AlertTriangle,
  Shield,
  CheckCircle
} from 'lucide-react';
import { getIssues, deleteIssue, completeIssue, type Issue } from '@/lib/supabaseOperations';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

const MyReports = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadUserIssues();
  }, []);

  const loadUserIssues = async () => {
    try {
      const allIssues = await getIssues();
      // Filter to show only current user's issues
      const userIssues = allIssues.filter(issue => issue.user_id === user?.id);
      setIssues(userIssues);
    } catch (error) {
      console.error('Error loading user issues:', error);
      toast({
        title: "Error",
        description: "Failed to load your reports.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIssue = async (issueId: string) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      const success = await deleteIssue(issueId);
      if (success) {
        setIssues(issues.filter(issue => issue.id !== issueId));
      }
    }
  };

  const handleCompleteIssue = async (issueId: string) => {
    if (window.confirm('Are you sure you want to mark this issue as completed?')) {
      const success = await completeIssue(issueId);
      if (success) {
        setIssues(issues.map(issue => 
          issue.id === issueId 
            ? { ...issue, status: 'resolved', completed_at: new Date().toISOString() }
            : issue
        ));
      }
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      potholes: Car,
      streetlights: Lightbulb,
      water: Droplets,
      trash: Trash,
      construction: Construction,
      parks: TreePine,
      corpse: AlertCircle,
      corruption: AlertTriangle,
      municipal: Shield
    };
    return icons[category] || AlertCircle;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported': return 'bg-yellow-500';
      case 'in-progress': return 'bg-blue-500';
      case 'resolved': return 'bg-green-500';
      case 'escalated': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">My Reports</h2>
        <p className="text-muted-foreground">
          View and manage all the issues you've reported. Track their progress and status updates.
        </p>
      </div>

      {issues.length === 0 ? (
        <Card className="p-8 text-center bg-gradient-card border-0 shadow-card">
          <div className="text-muted-foreground mb-4">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Reports Yet</h3>
            <p>You haven't reported any issues yet. Start by reporting your first issue.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => {
            const CategoryIcon = getCategoryIcon(issue.category);
            return (
              <Card key={issue.id} className="p-6 bg-gradient-card border-0 shadow-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="p-2 rounded-lg bg-muted">
                      <CategoryIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{issue.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {issue.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}</span>
                        </div>
                        {issue.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-32">{issue.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Badge variant={getPriorityColor(issue.priority)} className="text-xs">
                      {issue.priority}
                    </Badge>
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(issue.status)}`}></div>
                      <span className="text-xs text-muted-foreground capitalize">{issue.status}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      ID: {issue.id.slice(0, 8)}...
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {issue.category}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {issue.image_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(issue.image_url!, '_blank')}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Image
                      </Button>
                    )}
                    {(issue.status === 'reported' || issue.status === 'in-progress') && !issue.completed_at && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCompleteIssue(issue.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Complete
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteIssue(issue.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyReports;
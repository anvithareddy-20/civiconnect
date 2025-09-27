import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search,
  Calendar,
  MapPin,
  MessageCircle,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Trash,
  CheckCircle2
} from 'lucide-react';
import { getIssues, Issue, deleteIssue, completeIssue } from '@/lib/supabaseOperations';
import { useToast } from '@/hooks/use-toast';

const StatusTracker = ({ onViewSuggestions }: { onViewSuggestions: (issue: Issue) => void }) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [issues, setIssues] = useState<Issue[]>([]);

  useEffect(() => {
    const fetchIssues = async () => {
      const fetchedIssues = await getIssues();
      setIssues(fetchedIssues);
    };
    fetchIssues();
  }, []);

  const getCategoryLabel = (issue: Issue) => {
    const categoryLabels: Record<string, string> = {
      potholes: 'Potholes & Road Issues',
      streetlights: 'Street Lighting',
      water: 'Water Issue',
      trash: 'Waste Management',
      construction: 'Construction Issues',
      parks: 'Parks & Recreation',
      authority: 'Authority Issues',
      corpse: 'Corpse on Streets',
      other: 'Other Issues'
    };
    
    return categoryLabels[issue.category] || issue.category;
  };

  const handleDeleteIssue = async (issueId: string) => {
    const success = await deleteIssue(issueId);
    if (success) {
      const fetchedIssues = await getIssues();
      setIssues(fetchedIssues);
    }
  };

  const handleCompleteIssue = async (issueId: string) => {
    const success = await completeIssue(issueId);
    if (success) {
      const fetchedIssues = await getIssues();
      setIssues(fetchedIssues);
    }
  };

  const getStatusInfo = (status: Issue['status']) => {
    switch (status) {
      case 'reported':
        return {
          label: 'Reported',
          color: 'bg-status-reported text-white',
          icon: AlertTriangle
        };
      case 'progress':
        return {
          label: 'In Progress',
          color: 'bg-status-progress text-white',
          icon: Clock
        };
      case 'resolved':
        return {
          label: 'Resolved',
          color: 'bg-status-resolved text-white',
          icon: CheckCircle
        };
      default:
        return {
          label: 'Unknown',
          color: 'bg-muted text-muted-foreground',
          icon: AlertTriangle
        };
    }
  };

  const filteredIssues = issues.filter(issue => {
    const categoryLabel = getCategoryLabel(issue);
    const matchesSearch = issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         categoryLabel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    reported: issues.filter(i => i.status === 'reported').length,
    progress: issues.filter(i => i.status === 'progress').length,
    resolved: issues.filter(i => i.status === 'resolved').length
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-3 bg-gradient-primary/10 px-6 py-3 rounded-2xl border border-primary/20">
          <Eye className="w-6 h-6 text-primary animate-glow" />
          <h2 className="text-4xl font-bold gradient-text">Issue Status Dashboard</h2>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Monitor real-time progress of community reports with our advanced tracking system
        </p>
      </div>

      {/* Animated Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass card-hover p-6 border-status-reported/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-status-reported/5 to-transparent" />
          <div className="relative flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Reported Issues</p>
              <p className="text-4xl font-bold text-status-reported animate-bounce-in">{statusCounts.reported}</p>
              <div className="w-full bg-secondary/30 rounded-full h-2 progress-bar">
                <div 
                  className="h-2 bg-gradient-to-r from-status-reported to-status-reported/70 rounded-full animate-progress"
                  style={{ width: `${Math.min((statusCounts.reported / Math.max(1, issues.length)) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="p-4 bg-status-reported/20 rounded-2xl">
              <AlertTriangle className="w-10 h-10 text-status-reported animate-float" />
            </div>
          </div>
        </Card>
        
        <Card className="glass card-hover p-6 border-status-progress/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-status-progress/5 to-transparent" />
          <div className="relative flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">In Progress</p>
              <p className="text-4xl font-bold text-status-progress animate-bounce-in">{statusCounts.progress}</p>
              <div className="w-full bg-secondary/30 rounded-full h-2 progress-bar">
                <div 
                  className="h-2 bg-gradient-to-r from-status-progress to-status-progress/70 rounded-full animate-progress"
                  style={{ width: `${Math.min((statusCounts.progress / Math.max(1, issues.length)) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="p-4 bg-status-progress/20 rounded-2xl">
              <Clock className="w-10 h-10 text-status-progress animate-float" />
            </div>
          </div>
        </Card>
        
        <Card className="glass card-hover p-6 border-status-resolved/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-status-resolved/5 to-transparent" />
          <div className="relative flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Resolved</p>
              <p className="text-4xl font-bold text-status-resolved animate-bounce-in">{statusCounts.resolved}</p>
              <div className="w-full bg-secondary/30 rounded-full h-2 progress-bar">
                <div 
                  className="h-2 bg-gradient-to-r from-status-resolved to-status-resolved/70 rounded-full animate-progress"
                  style={{ width: `${Math.min((statusCounts.resolved / Math.max(1, issues.length)) * 100, 100)}%` }}
                />
              </div>
            </div>
            <div className="p-4 bg-status-resolved/20 rounded-2xl">
              <CheckCircle className="w-10 h-10 text-status-resolved animate-float" />
            </div>
          </div>
        </Card>
      </div>

      {/* Enhanced Filters */}
      <Card className="glass p-6 shadow-elegant border-primary/20">
        <div className="flex flex-col lg:flex-row gap-6 items-center">
          <div className="flex-1 w-full">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-primary w-5 h-5 group-focus-within:animate-glow" />
              <Input
                placeholder="Search by title, location, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 bg-secondary/50 border-primary/30 rounded-xl text-lg focus:border-primary focus:shadow-glow transition-all duration-300"
              />
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            {[
              { id: 'all', label: 'All Issues', icon: Eye },
              { id: 'reported', label: 'Reported', icon: AlertTriangle },
              { id: 'progress', label: 'In Progress', icon: Clock },
              { id: 'resolved', label: 'Resolved', icon: CheckCircle }
            ].map((status) => {
              const Icon = status.icon;
              const isActive = statusFilter === status.id;
              return (
                <Button
                  key={status.id}
                  variant={isActive ? "default" : "outline"}
                  onClick={() => setStatusFilter(status.id)}
                  className={`
                    flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-300
                    ${isActive 
                      ? 'bg-gradient-primary text-white shadow-glow border-primary' 
                      : 'border-primary/30 hover:border-primary hover:bg-primary/5'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'animate-glow' : ''}`} />
                  <span>{status.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Enhanced Issues List */}
      <div className="space-y-6">
        {filteredIssues.map((issue, index) => {
          const statusInfo = getStatusInfo(issue.status);
          const StatusIcon = statusInfo.icon;
          
          return (
            <Card 
              key={issue.id} 
              className="glass card-hover p-8 border border-primary/20 relative overflow-hidden group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Background gradient effect */}
              <div className="absolute inset-0 bg-gradient-mesh opacity-5 group-hover:opacity-10 transition-opacity duration-500" />
              
              <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                <div className="flex-1 space-y-4">
                  {/* Header with title and status */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <h3 className="text-2xl font-bold text-foreground group-hover:gradient-text transition-all duration-300">
                      {issue.title}
                    </h3>
                    <div className="flex items-center gap-3">
                      <Badge className={`${statusInfo.color} status-indicator text-sm px-4 py-2 rounded-2xl shadow-soft`}>
                        <StatusIcon className="w-4 h-4" />
                        {statusInfo.label}
                      </Badge>
                      <Badge variant="outline" className="text-sm px-3 py-1 border-primary/30 text-primary">
                        {getCategoryLabel(issue)}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {issue.description}
                  </p>
                  
                  {/* Meta information */}
                  <div className="flex flex-wrap items-center gap-6 text-muted-foreground">
                    <div className="flex items-center gap-2 bg-secondary/50 px-3 py-2 rounded-lg">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="font-medium">{issue.location || 'Location not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-secondary/50 px-3 py-2 rounded-lg">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span>{new Date(issue.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                    {issue.image_url && (
                      <div className="flex items-center gap-2 bg-secondary/50 px-3 py-2 rounded-lg">
                        <Eye className="w-4 h-4 text-primary" />
                        <span>Photo attached</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex items-center gap-4">
                  {(issue.status === 'reported' || issue.status === 'progress') && !issue.completed_at && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (window.confirm('Mark this issue as completed? This will change the status to resolved.')) {
                          handleCompleteIssue(issue.id);
                        }
                      }}
                      className="flex items-center gap-2 px-6 py-3 text-green-600 border-green-500/50 hover:border-green-500 hover:bg-green-500/10 transition-all duration-300"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Mark Complete
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => onViewSuggestions(issue)}
                    className="btn-modern flex items-center gap-2 px-6 py-3 text-white border-primary/50 hover:border-primary hover:shadow-glow"
                  >
                    <MessageCircle className="w-5 h-5" />
                    View Suggestions
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteIssue(issue.id)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-destructive to-destructive/80 hover:shadow-hover transition-all duration-300"
                  >
                    <Trash className="w-5 h-5" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredIssues.length === 0 && (
        <Card className="p-8 text-center shadow-soft">
          <p className="text-muted-foreground">No issues found matching your criteria.</p>
        </Card>
      )}
    </div>
  );
};

export default StatusTracker;
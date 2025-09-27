import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Clock, CheckCircle2, AlertTriangle, Users, MapPin, Calendar, BarChart3, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  totalComplaints: number;
  resolvedComplaints: number;
  pendingComplaints: number;
  highPriorityComplaints: number;
  categoryData: Array<{ category: string; count: number; color: string }>;
  statusData: Array<{ status: string; count: number; color: string }>;
  monthlyData: Array<{ month: string; complaints: number; resolved: number }>;
  priorityData: Array<{ priority: string; count: number; color: string }>;
}

const COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  destructive: 'hsl(var(--destructive))',
  muted: 'hsl(var(--muted))',
};

const Analytics = () => {
  const [data, setData] = useState<AnalyticsData>({
    totalComplaints: 0,
    resolvedComplaints: 0,
    pendingComplaints: 0,
    highPriorityComplaints: 0,
    categoryData: [],
    statusData: [],
    monthlyData: [],
    priorityData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const { data: issues, error } = await supabase
        .from('issues')
        .select('*');

      if (error) throw error;

      if (issues) {
        // Calculate totals
        const totalComplaints = issues.length;
        const resolvedComplaints = issues.filter(issue => issue.status === 'resolved').length;
        const pendingComplaints = issues.filter(issue => issue.status === 'reported').length;
        const highPriorityComplaints = issues.filter(issue => issue.priority === 'high').length;

        // Category data
        const categoryCount = issues.reduce((acc: Record<string, number>, issue) => {
          acc[issue.category] = (acc[issue.category] || 0) + 1;
          return acc;
        }, {});

        const categoryData = Object.entries(categoryCount).map(([category, count], index) => ({
          category,
          count: count as number,
          color: `hsl(${index * 45}, 70%, 60%)`
        }));

        // Status data
        const statusCount = issues.reduce((acc: Record<string, number>, issue) => {
          acc[issue.status] = (acc[issue.status] || 0) + 1;
          return acc;
        }, {});

        const statusData = [
          { status: 'reported', count: statusCount.reported || 0, color: COLORS.warning },
          { status: 'in-progress', count: statusCount['in-progress'] || 0, color: COLORS.primary },
          { status: 'resolved', count: statusCount.resolved || 0, color: COLORS.success }
        ];

        // Priority data
        const priorityCount = issues.reduce((acc: Record<string, number>, issue) => {
          acc[issue.priority] = (acc[issue.priority] || 0) + 1;
          return acc;
        }, {});

        const priorityData = [
          { priority: 'low', count: priorityCount.low || 0, color: COLORS.success },
          { priority: 'medium', count: priorityCount.medium || 0, color: COLORS.warning },
          { priority: 'high', count: priorityCount.high || 0, color: COLORS.destructive }
        ];

        // Monthly data (mock for demo)
        const monthlyData = [
          { month: 'Jan', complaints: 45, resolved: 32 },
          { month: 'Feb', complaints: 52, resolved: 41 },
          { month: 'Mar', complaints: 61, resolved: 38 },
          { month: 'Apr', complaints: 58, resolved: 45 },
          { month: 'May', complaints: 67, resolved: 52 },
          { month: 'Jun', complaints: totalComplaints, resolved: resolvedComplaints }
        ];

        setData({
          totalComplaints,
          resolvedComplaints,
          pendingComplaints,
          highPriorityComplaints,
          categoryData,
          statusData,
          monthlyData,
          priorityData
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, description, color = "primary" }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
      className="group"
    >
      <Card className="glass border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-glow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <div className="flex items-center space-x-2">
                <p className="text-3xl font-bold gradient-text">{value}</p>
                {trend && (
                  <Badge variant={trend > 0 ? "default" : "destructive"} className="text-xs">
                    {trend > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {Math.abs(trend)}%
                  </Badge>
                )}
              </div>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
            <div className={`p-3 rounded-xl bg-gradient-${color} group-hover:shadow-glow transition-all duration-300`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const resolutionRate = data.totalComplaints > 0 ? Math.round((data.resolvedComplaints / data.totalComplaints) * 100) : 0;
  const avgResolutionTime = '5.2 days';

  // Mock data for missing sections
  const topLocations = [
    { location: 'Downtown Area', issues: 24 },
    { location: 'Residential Zone A', issues: 18 },
    { location: 'Industrial District', issues: 15 },
    { location: 'Commercial Center', issues: 12 },
    { location: 'Suburban Area', issues: 9 }
  ];

  const recentActivity = [
    { type: 'report', action: 'New issue reported', item: 'Broken streetlight on Main St', time: '2 hours ago' },
    { type: 'resolve', action: 'Issue resolved', item: 'Pothole repair completed', time: '4 hours ago' },
    { type: 'progress', action: 'Status updated', item: 'Drainage system maintenance', time: '6 hours ago' },
    { type: 'report', action: 'New issue reported', item: 'Traffic signal malfunction', time: '8 hours ago' }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'report':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'resolve':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'progress':
        return <Clock className="w-4 h-4 text-primary" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl font-bold gradient-text">Analytics Dashboard</h1>
        <p className="text-xl text-muted-foreground">Real-time insights into community complaints</p>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Issues</p>
              <p className="text-2xl font-bold text-foreground">{data.totalComplaints}</p>
              <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +12% this month
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Resolution Rate</p>
              <p className="text-2xl font-bold text-foreground">{resolutionRate}%</p>
              <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +5% this month
              </p>
            </div>
            <div className="w-12 h-12 bg-status-resolved/10 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-status-resolved" />
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Resolution Time</p>
              <p className="text-2xl font-bold text-foreground">{avgResolutionTime}</p>
              <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                -2.1 days
              </p>
            </div>
            <div className="w-12 h-12 bg-status-progress/10 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-status-progress" />
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Citizens</p>
              <p className="text-2xl font-bold text-foreground">1,247</p>
              <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +156 this month
              </p>
            </div>
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-accent" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Issue Categories */}
        <Card className="p-6 shadow-card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Issues by Category
          </h3>
          <div className="space-y-4">
            {data.categoryData.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">{category.category}</span>
                  <span className="text-sm text-muted-foreground">{category.count}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${data.totalComplaints > 0 ? (category.count / data.totalComplaints) * 100 : 0}%`,
                      backgroundColor: category.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Locations */}
        <Card className="p-6 shadow-card">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Most Reported Locations
          </h3>
          <div className="space-y-3">
            {topLocations.map((location, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary">
                    {index + 1}
                  </div>
                  <span className="text-sm font-medium text-foreground">{location.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{location.issues}</span>
                  <span className="text-xs text-muted-foreground">issues</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6 shadow-card">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Recent Activity
        </h3>
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center gap-4 p-3 hover:bg-muted/30 rounded-lg transition-smooth">
              <div className="flex items-center justify-center w-8 h-8">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{activity.action}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-sm text-muted-foreground">{activity.time}</span>
                </div>
                <p className="text-sm text-muted-foreground">{activity.item}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Analytics;
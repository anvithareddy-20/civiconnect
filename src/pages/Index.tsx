import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import ReportIssues from '@/components/ReportIssues';
import StatusTracker from '@/components/StatusTracker';
import Suggestions from '@/components/Suggestions';
import Analytics from '@/components/Analytics';
import MyReports from '@/components/MyReports';
import EnhancedAIChatbot from '@/components/EnhancedAIChatbot';
import BlockchainReports from '@/components/BlockchainReports';
import civicHero from '@/assets/civic-hero.jpg';
import { Shield, Eye, MessageSquare } from 'lucide-react';
const Index = () => {
  const [activeTab, setActiveTab] = useState('reports');
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }
  const handleViewSuggestions = (issue: any) => {
    setSelectedIssue(issue);
    setActiveTab('suggestions');
  };
  const handleBackToStatus = () => {
    setSelectedIssue(null);
    setActiveTab('status');
  };
  const renderContent = () => {
    switch (activeTab) {
      case 'reports':
        return <ReportIssues />;
      case 'suggestions':
        return selectedIssue ? <Suggestions issue={selectedIssue} onBack={handleBackToStatus} /> : <div className="max-w-4xl mx-auto p-6 text-center">
            <p className="text-muted-foreground">Select an issue from the Status Tracker to view suggestions.</p>
          </div>;
      case 'status':
        return <StatusTracker onViewSuggestions={handleViewSuggestions} />;
      case 'myreports':
        return <MyReports />;
      case 'blockchain':
        return <BlockchainReports />;
      case 'analytics':
        return <Analytics />;
      default:
        return <ReportIssues />;
    }
  };
  return <div className="min-h-screen bg-background">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Hero Section - Only show on reports tab */}
      {activeTab === 'reports' && <section className="relative overflow-hidden bg-gradient-hero min-h-[70vh] flex items-center">
          {/* Animated background mesh */}
          <div className="absolute inset-0 bg-gradient-mesh opacity-60" />
          <div className="absolute inset-0 opacity-20">
            <img src={civicHero} alt="Civic community illustration" className="w-full h-full object-cover animate-float" />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <div className="space-y-8 animate-fade-in">
              <div className="space-y-6">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
                  Build <span className="gradient-text">Better</span>
                  <br />
                  Together
                </h1>
                <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto text-white/90 leading-relaxed">
                  Your Streets. Your Voice. Your Power.
                  <br />
                  <span className="text-lg text-white/80">Transform your community with AI-powered civic reporting</span>
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <button 
                  onClick={() => document.getElementById('report-form')?.scrollIntoView({ behavior: 'smooth' })} 
                  className="btn-modern px-10 py-4 text-xl font-bold rounded-2xl shadow-glow hover:shadow-hover transform hover:scale-105 transition-all duration-300"
                >
                  Report an Issue
                </button>
                <button 
                  onClick={() => setActiveTab('status')} 
                  className="glass px-10 py-4 text-xl font-semibold rounded-2xl text-white border border-white/30 hover:bg-white/20 hover:shadow-glow transition-all duration-300"
                >
                  View Dashboard
                </button>
              </div>
              
              {/* Feature highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto">
                <div className="glass p-6 rounded-2xl text-center border border-white/20">
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl mx-auto mb-4 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">AI-Powered</h3>
                  <p className="text-white/80">Smart classification and priority detection</p>
                </div>
                <div className="glass p-6 rounded-2xl text-center border border-white/20">
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl mx-auto mb-4 flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Real-time Tracking</h3>
                  <p className="text-white/80">Monitor progress with live updates</p>
                </div>
                <div className="glass p-6 rounded-2xl text-center border border-white/20">
                  <div className="w-12 h-12 bg-gradient-primary rounded-xl mx-auto mb-4 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Community Driven</h3>
                  <p className="text-white/80">Collaborative problem solving</p>
                </div>
              </div>
            </div>
          </div>
        </section>}

      {/* Main Content */}
      <main id="report-form">
        {renderContent()}
      </main>
      
      {/* Footer */}
      <footer className="glass border-t border-primary/20 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-2xl font-bold gradient-text">CivicConnect</h3>
          </div>
          <p className="text-muted-foreground text-lg">
            Empowering communities through technology and transparency
          </p>
          <div className="mt-6 text-sm text-muted-foreground">
            © 2024 CivicConnect. Building better communities together.
          </div>
        </div>
      </footer>

      {/* AI Chatbot */}
      <EnhancedAIChatbot />
    </div>;
};
export default Index;
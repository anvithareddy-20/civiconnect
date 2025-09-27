import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Menu,
  X,
  LogOut,
  User,
  Shield,
  Camera,
  ChevronDown
} from 'lucide-react';

const Header = ({ activeTab, setActiveTab }: { 
  activeTab: string; 
  setActiveTab: (tab: string) => void; 
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  // Load avatar from localStorage on mount
  useEffect(() => {
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) {
      setAvatarUrl(savedAvatar);
    }
  }, []);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    }
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setAvatarUrl(result);
        localStorage.setItem('userAvatar', result);
        toast({
          title: "Profile photo updated! 📸",
          description: "Your profile picture has been updated successfully",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const navItems = [
    { id: 'reports', label: 'Report Issues', icon: FileText },
    { id: 'status', label: 'Status Tracker', icon: BarChart3 },
    { id: 'myreports', label: 'My Reports', icon: User },
    { id: 'blockchain', label: 'Blockchain', icon: Shield },
    { id: 'suggestions', label: 'Suggestions', icon: MessageSquare },
    { id: 'analytics', label: 'Analytics', icon: Settings }
  ];

  return (
    <header className="glass bg-gradient-primary/10 backdrop-blur-md text-foreground shadow-glass sticky top-0 z-50 border-b border-glass-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow transform transition-transform group-hover:scale-110 animate-glow">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">CivicConnect</h1>
              <p className="text-sm text-muted-foreground">Smart Community Reporting</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <nav className="flex space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() => setActiveTab(item.id)}
                    className={`
                      flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium
                      transition-all duration-300 ease-smooth relative overflow-hidden
                      ${isActive 
                        ? 'bg-gradient-primary text-white shadow-glow' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                      }
                    `}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'animate-glow' : ''}`} />
                    <span>{item.label}</span>
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-primary opacity-20 animate-shimmer" />
                    )}
                  </Button>
                );
              })}
            </nav>
            
            {/* User Profile Dropdown */}
            <div className="flex items-center space-x-4 border-l border-border/50 pl-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center space-x-3 cursor-pointer hover:bg-secondary/50 rounded-xl px-3 py-2 transition-colors">
                    <div className="relative group">
                      <Avatar className="w-10 h-10 ring-2 ring-primary/20 hover:ring-primary/40 transition-all shadow-soft">
                        <AvatarImage src={avatarUrl} alt={getUserDisplayName()} />
                        <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="hidden lg:block">
                      <p className="text-sm font-medium text-foreground">{getUserDisplayName()}</p>
                      <p className="text-xs text-muted-foreground">Active User</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                    <Camera className="w-4 h-4 mr-2" />
                    Change Avatar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setActiveTab('myreports')}>
                    <User className="w-4 h-4 mr-2" />
                    My Reports
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden hover:bg-primary-foreground/10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4">
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={activeTab === item.id ? "secondary" : "ghost"}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center space-x-2 justify-start px-4 py-2 transition-smooth ${
                      activeTab === item.id 
                        ? 'bg-primary-foreground/20 text-primary-foreground' 
                        : 'hover:bg-primary-foreground/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
              
              {/* Mobile User Info and Dropdown */}
              <div className="border-t border-primary-foreground/20 pt-2 mt-2">
                <div className="flex items-center justify-between px-4 py-2">
                  <div className="flex items-center space-x-3">
                    <div className="relative" onClick={() => fileInputRef.current?.click()}>
                      <Avatar className="w-8 h-8 cursor-pointer">
                        <AvatarImage src={avatarUrl} alt={getUserDisplayName()} />
                        <AvatarFallback className="bg-gradient-primary text-white text-xs font-semibold">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">{getUserDisplayName()}</div>
                      <div className="text-muted-foreground text-xs">{user?.email}</div>
                    </div>
                  </div>
                </div>
                <div className="px-2 space-y-1">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setActiveTab('myreports');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full justify-start px-4 py-2 hover:bg-primary-foreground/10"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    <span>My Reports</span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="w-full justify-start px-4 py-2 hover:bg-primary-foreground/10 text-red-400 hover:text-red-300"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Sign Out</span>
                  </Button>
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
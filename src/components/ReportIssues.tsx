import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Camera, 
  Upload, 
  AlertCircle, 
  Construction,
  Lightbulb,
  Trash2,
  Car,
  TreePine,
  Shield,
  Droplets,
  AlertTriangle,
  Mic,
  MicOff,
  Square,
  Sparkles,
  Bot,
  Zap,
  TestTube
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveIssue } from '@/lib/supabaseOperations';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useAIComplaintAssistant } from '@/hooks/useAIComplaintAssistant';
import AISuggestionCard from '@/components/AISuggestionCard';

const ReportIssues = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    subcategory: '',
    description: '',
    location: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    images: [] as File[]
  });

  const [showAISuggestions, setShowAISuggestions] = useState(true);
  const [activeField, setActiveField] = useState<'title' | 'description' | 'location' | null>(null);
  
  const { 
    isSupported: speechSupported, 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    resetTranscript 
  } = useSpeechRecognition();

  const {
    isAnalyzing,
    aiSuggestions,
    analyzeComplaintText,
    analyzeUploadedImage,
    acceptAISuggestion,
    resetAIAssistant
  } = useAIComplaintAssistant();

  // Handle speech recognition transcript updates
  useEffect(() => {
    if (transcript && activeField) {
      setFormData(prev => ({
        ...prev,
        [activeField]: transcript
      }));
    }
  }, [transcript, activeField]);

  // AI Analysis Effect - Analyze text with debouncing
  useEffect(() => {
    if ((formData.title.trim() || formData.description.trim()) && showAISuggestions) {
      const timer = setTimeout(() => {
        analyzeComplaintText(formData.title, formData.description);
      }, 1000); // 1 second debounce

      return () => clearTimeout(timer);
    }
  }, [formData.title, formData.description, analyzeComplaintText, showAISuggestions]);

  const categories = [
    { id: 'municipal', label: 'Municipal Corporation', icon: Shield },
    { id: 'corruption', label: 'Political Corruption', icon: AlertTriangle },
    { id: 'test_case', label: 'TEST CASE', icon: TestTube }
  ];

  const subcategories = {
    municipal: [
      { id: 'potholes', label: 'Potholes & Road Issues', icon: Car },
      { id: 'streetlights', label: 'Street Lighting', icon: Lightbulb },
      { id: 'water', label: 'Water Issue', icon: Droplets },
      { id: 'trash', label: 'Waste Management', icon: Trash2 },
      { id: 'construction', label: 'Construction Issues', icon: Construction },
      { id: 'parks', label: 'Parks & Recreation', icon: TreePine },
      { id: 'corpse', label: 'Corpse on Streets', icon: AlertCircle }
    ],
    corruption: []
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = [...formData.images, ...files].slice(0, 5); // Max 5 images
    
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));

    // Analyze first uploaded image with AI if AI suggestions are enabled
    if (files.length > 0 && showAISuggestions) {
      await analyzeUploadedImage(files[0]);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to report an issue.",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.title || !formData.category || !formData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (formData.category === 'municipal' && !formData.subcategory) {
      toast({
        title: "Missing Information",
        description: "Please select a subcategory for Municipal Corporation issues.",
        variant: "destructive"
      });
      return;
    }

    try {
      const categoryValue = formData.category === 'municipal' && formData.subcategory 
        ? formData.subcategory 
        : formData.category;
      
      const result = await saveIssue({
        title: formData.title,
        category: categoryValue,
        description: formData.description,
        location: formData.location,
        priority: formData.priority,
        images: formData.images
      });

      if (result) {
        // Send TEST CASE notifications if category is test_case
        if (formData.category === 'test_case') {
          try {
            const { error: notificationError } = await supabase.functions.invoke('send-test-notifications', {
              body: {
                title: formData.title,
                description: formData.description,
                category: 'TEST CASE',
                subcategory: formData.subcategory,
                location: formData.location,
                priority: formData.priority,
                userName: user?.user_metadata?.display_name || user?.email || 'Unknown User',
                userEmail: user?.email || 'unknown@email.com',
                submissionTime: new Date().toLocaleString()
              }
            });

            if (notificationError) {
              console.error('Error sending TEST CASE notifications:', notificationError);
              toast({
                title: "Report Submitted",
                description: "Issue reported successfully, but there was an issue sending notifications.",
                variant: "default"
              });
            } else {
              toast({
                title: "TEST CASE Alert Sent",
                description: "Report submitted and notifications sent to specified contacts.",
                variant: "default"
              });
            }
          } catch (notificationError) {
            console.error('Error with TEST CASE notifications:', notificationError);
            toast({
              title: "Report Submitted",
              description: "Issue reported successfully, but there was an issue sending notifications.",
              variant: "default"
            });
          }
        } else {
          toast({
            title: "Issue Reported",
            description: "Your issue has been submitted successfully.",
            variant: "default"
          });
        }
        
        // Reset form and AI
        setFormData({
          title: '',
          category: '',
          subcategory: '',
          description: '',
          location: '',
          priority: 'medium',
          images: []
        });
        resetAIAssistant();
        resetTranscript();
      }
    } catch (error) {
      console.error('Error submitting issue:', error);
      toast({
        title: "Error",
        description: "Failed to submit issue. Please try again.",
        variant: "destructive"
      });
    }
  };

  const startSpeechRecognition = (field: 'title' | 'description' | 'location') => {
    if (!speechSupported) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive"
      });
      return;
    }

    setActiveField(field);
    resetTranscript();
    startListening();
    
    toast({
      title: "Listening...",
      description: `Speak your ${field}. Click stop when finished.`
    });
  };

  const stopSpeechRecognition = () => {
    stopListening();
    setActiveField(null);
    
    toast({
      title: "Recording Stopped",
      description: "Your speech has been converted to text."
    });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setFormData(prev => ({
          ...prev,
          location: `${position.coords.latitude}, ${position.coords.longitude}`
        }));
        toast({
          title: "Location Added",
          description: "Your current location has been added to the report."
        });
      });
    }
  };

  const handleAISuggestionAccept = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    acceptAISuggestion(field, value);
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <h2 className="text-3xl font-bold text-foreground">Report an Issue</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAISuggestions(!showAISuggestions)}
            className={`ml-auto ${showAISuggestions ? 'bg-primary/10 border-primary' : ''}`}
          >
            <Bot className="w-4 h-4 mr-2" />
            {showAISuggestions ? 'AI Enabled' : 'AI Disabled'}
          </Button>
        </div>
        <p className="text-muted-foreground">
          Civic Crowdsourced Reporting System for Telangana - Report municipal issues or political corruption cases. 
          Municipal issues will be forwarded to Greater Hyderabad Municipal Corporation (155304), 
          corruption cases to Anti Corruption Bureau Telangana (040-2325-1555).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="p-6 shadow-card bg-gradient-card border-0">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Issue Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">Issue Title *</Label>
                <div className="flex space-x-2">
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief description of the issue"
                    className="flex-1 transition-smooth focus:shadow-soft"
                    required
                  />
                  {speechSupported && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (isListening && activeField === 'title') {
                          stopSpeechRecognition();
                        } else {
                          startSpeechRecognition('title');
                        }
                      }}
                      className={`px-3 hover:shadow-soft transition-smooth ${
                        isListening && activeField === 'title' ? 'bg-destructive text-white hover:bg-destructive/90' : ''
                      }`}
                    >
                      {isListening && activeField === 'title' ? (
                        <Square className="w-4 h-4" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
                {isListening && activeField === 'title' && (
                  <p className="text-xs text-primary animate-pulse flex items-center">
                    <Mic className="w-3 h-3 mr-1" />
                    Listening... Click stop when finished
                  </p>
                )}
              </div>

              {/* Category Selection */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value, subcategory: '' }))}>
                  <SelectTrigger className="transition-smooth focus:shadow-soft">
                    <SelectValue placeholder="Select issue category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center space-x-2">
                            <Icon className="w-4 h-4" />
                            <span>{category.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Selection */}
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm font-medium">Priority</Label>
                <div className="flex space-x-2">
                  <Select value={formData.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setFormData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger className="transition-smooth focus:shadow-soft">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-success rounded-full" />
                          <span>Low Priority</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="medium">
                        <div className="flex items-center space-x-2">
                          <Zap className="w-4 h-4 text-warning" />
                          <span>Medium Priority</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                          <span>High Priority (Emergency)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Badge variant={getPriorityBadgeVariant(formData.priority)} className="self-center">
                    {formData.priority.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="description" className="text-sm font-medium">Description *</Label>
                  {speechSupported && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (isListening && activeField === 'description') {
                          stopSpeechRecognition();
                        } else {
                          startSpeechRecognition('description');
                        }
                      }}
                      className={`px-3 hover:shadow-soft transition-smooth ${
                        isListening && activeField === 'description' ? 'bg-destructive text-white hover:bg-destructive/90' : ''
                      }`}
                    >
                      {isListening && activeField === 'description' ? (
                        <>
                          <Square className="w-4 h-4 mr-1" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 mr-1" />
                          Voice
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide detailed information about the issue, including when you noticed it and how it affects the community."
                  className="min-h-[120px] transition-smooth focus:shadow-soft"
                  required
                />
                {isListening && activeField === 'description' && (
                  <p className="text-xs text-primary animate-pulse flex items-center">
                    <Mic className="w-3 h-3 mr-1" />
                    Listening... Speak your description. Click stop when finished
                  </p>
                )}
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                <div className="flex space-x-2">
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Enter address or coordinates"
                    className="flex-1 transition-smooth focus:shadow-soft"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={getCurrentLocation}
                    className="px-3 hover:shadow-soft transition-smooth"
                  >
                    <MapPin className="w-4 h-4" />
                  </Button>
                  {speechSupported && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (isListening && activeField === 'location') {
                          stopSpeechRecognition();
                        } else {
                          startSpeechRecognition('location');
                        }
                      }}
                      className={`px-3 hover:shadow-soft transition-smooth ${
                        isListening && activeField === 'location' ? 'bg-destructive text-white hover:bg-destructive/90' : ''
                      }`}
                    >
                      {isListening && activeField === 'location' ? (
                        <Square className="w-4 h-4" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
                {isListening && activeField === 'location' && (
                  <p className="text-xs text-primary animate-pulse flex items-center">
                    <Mic className="w-3 h-3 mr-1" />
                    Listening... Speak the location. Click stop when finished
                  </p>
                )}
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Photos (Optional)</Label>
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-smooth">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Camera className="w-8 h-8 mb-3 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG up to 10MB (max 5 photos)</p>
                        {showAISuggestions && (
                          <p className="text-xs text-primary mt-1 flex items-center">
                            <Sparkles className="w-3 h-3 mr-1" />
                            AI will analyze your photos
                          </p>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>

                  {/* Preview uploaded images */}
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {formData.images.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-smooth"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:shadow-glow transition-smooth py-3 text-base font-medium"
                disabled={isAnalyzing}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isAnalyzing ? 'Analyzing...' : 'Submit Report'}
              </Button>
            </form>
          </Card>
        </div>

        {/* AI Suggestions Panel */}
        {showAISuggestions && (
          <div className="lg:col-span-1 space-y-4">
            <AISuggestionCard
              suggestions={aiSuggestions}
              isAnalyzing={isAnalyzing}
              onAcceptSuggestion={handleAISuggestionAccept}
              onDismiss={() => setShowAISuggestions(false)}
              currentValues={{
                category: formData.category,
                subcategory: formData.subcategory,
                priority: formData.priority
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportIssues;
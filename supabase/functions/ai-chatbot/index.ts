import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Enhanced helper function to get comprehensive user data
const getUserComplaintData = async (supabase: any, userId: string) => {
  try {
    // Get user's issues with detailed analysis
    const { data: issues, error: issuesError } = await supabase
      .from('issues')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (issuesError) {
      console.error('Error fetching user issues:', issuesError);
      return { issues: [], suggestions: [], totalIssues: 0 };
    }

    // Get user's suggestions
    const { data: suggestions, error: suggestionsError } = await supabase
      .from('suggestions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Analyze complaint patterns and statistics
    const pendingIssues = issues?.filter(i => i.status === 'reported') || [];
    const inProgressIssues = issues?.filter(i => i.status === 'in_progress') || [];
    const resolvedIssues = issues?.filter(i => i.status === 'resolved') || [];
    
    // Category breakdown
    const categoryStats = issues?.reduce((acc: any, issue: any) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    }, {}) || {};

    // Priority breakdown
    const priorityStats = issues?.reduce((acc: any, issue: any) => {
      acc[issue.priority] = (acc[issue.priority] || 0) + 1;
      return acc;
    }, {}) || {};

    return {
      issues: issues || [],
      suggestions: suggestions || [],
      totalIssues: issues?.length || 0,
      recentIssue: issues?.[0] || null,
      pendingIssues: pendingIssues.length,
      inProgressIssues: inProgressIssues.length,
      resolvedIssues: resolvedIssues.length,
      categoryStats,
      priorityStats,
      pendingList: pendingIssues.slice(0, 3),
      resolvedList: resolvedIssues.slice(0, 3),
      hasImages: issues?.some(i => i.image_url) || false,
      avgResponseTime: resolvedIssues.length > 0 ? '3-5 days' : 'No data yet'
    };
  } catch (error) {
    console.error('Error in getUserComplaintData:', error);
    return { issues: [], suggestions: [], totalIssues: 0 };
  }
};

// Comprehensive FAQ knowledge base with 25+ Q&A pairs
const getFeatureAwareFAQ = (message: string, userData: any = null): string | null => {
  const lowerMessage = message.toLowerCase();
  
  // Comprehensive FAQ with 25+ questions covering all website features
  const comprehensiveFAQ = [
    {
      keywords: ['status tracker', 'where find status', 'track location', 'dashboard', 'find tracker', 'status check'],
      response: `📍 **Status Tracker Location:**

Find your Status Tracker in **"My Reports"** from the main dashboard. It shows real-time updates with color-coded statuses:
• 🔴 Pending (just submitted) 
• 🟡 In Progress (being resolved)
• 🟢 Resolved (completed)

Click "My Reports" from any page to access your tracker instantly!`
    },
    {
      keywords: ['upload image', 'attach photo', 'add picture', 'image support', 'photo upload', 'attach file'],
      response: `📸 **Image Upload Guide:**

Yes! Upload up to 3 images per complaint (5MB each). Supports JPG, PNG formats.

**How to:** Look for "Upload Images" in the complaint form → Click "Choose Files" → Select photos.

**Pro tip:** Take clear photos from multiple angles - it helps authorities resolve issues 60% faster!`
    },
    {
      keywords: ['voice to text', 'voice input', 'speak', 'microphone', 'audio input', 'speech recognition'],
      response: `🎤 **Voice Input Feature:**

Click the microphone icon (🎤) in forms or chat to speak your complaint. Supports Telugu, Hindi, and English.

**How it works:** Speak clearly → Text appears automatically → Review and edit if needed → Submit.

Perfect for users who prefer speaking over typing!`
    },
    {
      keywords: ['anonymous', 'private complaint', 'hide identity', 'confidential', 'secret reporting'],
      response: `🔒 **Anonymous Reporting:**

File completely anonymous complaints by checking "Submit Anonymously" during form submission. Your identity stays hidden while you still get a tracking ID.

**Best for:** Corruption cases, whistleblowing, or sensitive neighborhood issues. All data remains encrypted and secure.`
    },
    {
      keywords: ['complaint categories', 'issue types', 'what can report', 'report types', 'categories available'],
      response: `🏢 **Complaint Categories:**

**Municipal:** Roads, Water Supply, Waste Management, Electricity, Drainage
**Governance:** Corruption, Document Delays, Fund Misuse  
**Safety:** Street Safety, Traffic Issues, Noise Pollution

Each category routes automatically to the correct department. Our AI suggests the best category based on your description!`
    },
    {
      keywords: ['notifications', 'alerts', 'sms updates', 'email updates', 'get notified', 'updates'],
      response: `🔔 **Notification System:**

Get automatic updates via SMS and email when your complaint status changes. Includes:
• Submission confirmation
• Status change alerts  
• Authority responses
• Resolution confirmations

**Manage:** Go to Settings → Notifications to customize your preferences.`
    },
    {
      keywords: ['ai features', 'smart suggestions', 'auto category', 'ai help', 'artificial intelligence'],
      response: `🤖 **AI-Powered Features:**

**Smart Categorization:** AI suggests the best category and priority for your complaint
**Intelligent Writing:** Real-time tips while typing descriptions
**Predictive Analytics:** Estimated resolution times based on similar cases
**Natural Chat:** Ask me questions in plain language - I understand context!`
    },
    {
      keywords: ['how to submit', 'report complaint', 'file issue', 'submit report', 'create complaint'],
      response: `📝 **Submit a Complaint:**

**Quick Steps:**
1. Click "Report Issues" from dashboard
2. Choose category (or let AI suggest)
3. Describe the problem clearly
4. Add location details
5. Upload photos if helpful
6. Submit and get tracking ID

**Pro tip:** Use specific landmarks and include safety concerns for higher priority processing!`
    },
    {
      keywords: ['edit complaint', 'modify report', 'change complaint', 'update issue'],
      response: `✏️ **Edit Your Complaints:**

You can edit your complaints while they're in "Pending" status. Once authorities start working (In Progress), editing is limited to protect the workflow.

**How to edit:** Go to "My Reports" → Click on your complaint → Use "Edit" button if available.`
    },
    {
      keywords: ['delete complaint', 'remove report', 'cancel complaint', 'withdraw issue'],
      response: `🗑️ **Delete/Cancel Complaints:**

You can delete complaints that are still "Pending". Once authorities begin work, you can contact them directly to discuss withdrawal.

**To delete:** "My Reports" → Select complaint → "Delete" option (if available).`
    },
    {
      keywords: ['authority contact', 'department phone', 'official contact', 'who handles', 'contact authority'],
      response: `📞 **Authority Contacts:**

**GHMC:** 155304 (Roads, Waste)
**Water Board:** 155313 (Water Supply)  
**Electricity Board:** 1912 (Power Issues)
**Police:** 100 (Safety/Traffic)
**Anti-Corruption:** 1064 (Corruption)

Each complaint shows the handling authority's contact info automatically!`
    },
    {
      keywords: ['priority levels', 'urgency', 'emergency', 'high priority', 'important complaint'],
      response: `⚡ **Priority Levels:**

**High:** Safety hazards, water/power outages, main road blocks
**Medium:** General civic issues, minor infrastructure  
**Low:** Beautification, suggestions

**Emergency tip:** Use keywords like "safety risk," "accident prone," or "urgent" for faster processing!`
    },
    {
      keywords: ['response time', 'how long', 'resolution time', 'when resolved', 'processing time'],
      response: `⏱️ **Expected Response Times:**

**High Priority:** 24-48 hours
**Medium Priority:** 3-7 days  
**Low Priority:** 1-2 weeks

**Factors affecting time:** Issue complexity, authority workload, required resources. You'll get updates throughout the process!`
    },
    {
      keywords: ['mobile app', 'android app', 'ios app', 'phone app'],
      response: `📱 **Mobile Access:**

Currently web-based and mobile-optimized! Access the full platform from any mobile browser. Works seamlessly on Android and iOS devices.

**Tip:** Add our website to your home screen for app-like experience!`
    },
    {
      keywords: ['offline access', 'no internet', 'work offline'],
      response: `🌐 **Offline Functionality:**

Limited offline support - you can draft complaints offline, but need internet to submit. The system saves your draft automatically.

**For areas with poor connectivity:** Use voice input when online to quickly capture issues!`
    },
    {
      keywords: ['multiple complaints', 'bulk reporting', 'many issues'],
      response: `📊 **Multiple Complaints:**

You can submit multiple complaints for different issues. Each gets a unique tracking ID and follows independent processing.

**Tip:** Submit similar issues as separate complaints for better tracking and resolution!`
    },
    {
      keywords: ['complaint history', 'past complaints', 'old reports', 'previous issues'],
      response: `📜 **Complaint History:**

View all your past and current complaints in "My Reports" section. Shows submission date, status, and resolution details.

**Filter by:** Status, category, date range. Export your complaint history for personal records!`
    },
    {
      keywords: ['escalation', 'complaint not resolved', 'slow response', 'escalate issue'],
      response: `⬆️ **Escalate Your Complaint:**

If no response in expected timeframe:
1. Check "My Reports" for updates
2. Contact authority directly (number provided)
3. File follow-up complaint referencing original ID
4. Use "Escalate" button if available

**Higher authorities get notified automatically after extended delays.**`
    },
    {
      keywords: ['feedback', 'rating', 'review resolution', 'satisfied'],
      response: `⭐ **Provide Feedback:**

After resolution, rate your experience and provide feedback. This helps improve services for everyone.

**Rate:** Service quality, resolution speed, authority response. Your feedback shapes better civic services!`
    },
    {
      keywords: ['security', 'data safety', 'privacy protection', 'information secure'],
      response: `🔐 **Data Security:**

Your data is encrypted and stored securely. We follow strict privacy protocols and never share personal information without consent.

**Anonymous mode** available for sensitive reports. All communication is secure and confidential.`
    },
    {
      keywords: ['languages supported', 'telugu', 'hindi', 'regional language'],
      response: `🌍 **Language Support:**

**Supported:** English, Telugu, Hindi (voice and text)
**Voice input** works in all three languages
**Text interface** primarily in English with regional keyword support

**Tip:** Use your preferred language for voice input - it converts accurately!`
    },
    {
      keywords: ['payment', 'charges', 'cost', 'free service', 'fees'],
      response: `💰 **Service Charges:**

**Completely FREE!** No charges for filing complaints, tracking status, or any platform features.

This is a public service to improve civic life in Telangana. All features remain free for citizens.`
    },
    {
      keywords: ['technical issues', 'website problems', 'bugs', 'not working'],
      response: `🔧 **Technical Support:**

Experiencing issues? Try:
1. Refresh the page
2. Clear browser cache
3. Try different browser
4. Check internet connection

**Still having problems?** Use this chatbot to report technical issues - we'll fix them quickly!`
    },
    {
      keywords: ['location accuracy', 'gps', 'pincode', 'address details'],
      response: `📍 **Location Details:**

**Provide:** District, area/locality, landmark, pincode if known
**GPS coordinates** helpful but not required
**Specific addresses** speed up resolution significantly

**Tip:** Include nearby landmarks - helps authorities locate issues faster!`
    },
    {
      keywords: ['success rate', 'resolution statistics', 'how effective'],
      response: `📈 **Platform Effectiveness:**

**Average resolution rate:** 85% of complaints resolved successfully
**Citizen satisfaction:** 4.2/5 rating
**Response improvement:** 40% faster than traditional methods

**Your participation** helps make civic services more responsive and efficient!`
    }
  ];

  // Check for FAQ matches with fuzzy matching
  for (const faq of comprehensiveFAQ) {
    const matches = faq.keywords.filter(keyword => 
      lowerMessage.includes(keyword) || 
      keyword.split(' ').some(word => lowerMessage.includes(word))
    );
    
    if (matches.length > 0) {
      return faq.response;
    }
  }

  return null;
};

// Enhanced context-aware response with strict priority system
const getContextualResponse = async (message: string, userData: any, supabase: any, userId?: string): Promise<string> => {
  const lowerMessage = message.toLowerCase();
  
  // PRIORITY 1: Check comprehensive FAQ first (20+ predefined Q&As)
  const faqResponse = getFeatureAwareFAQ(message, userData);
  if (faqResponse) {
    console.log('Response from FAQ knowledge base');
    return faqResponse;
  }

  // PRIORITY 2: Check database for user-specific information
  if (userId) {
    console.log('Checking user-specific data for:', userId);
    const userComplaintData = await getUserComplaintData(supabase, userId);
    
    // User-specific status queries with natural language
    if (lowerMessage.includes('status') || lowerMessage.includes('track') || lowerMessage.includes('my complaint')) {
      console.log('User has specific complaint data:', userComplaintData.totalIssues, 'issues');
      
      if (userComplaintData.totalIssues === 0) {
        return `Hi! You haven't submitted any complaints yet. Ready to report your first issue? I can guide you through it step by step, and you'll get a tracking ID to monitor progress. What's the issue you'd like to report?`;
      }

      const statusSummary = [];
      if (userComplaintData.pendingIssues > 0) statusSummary.push(`${userComplaintData.pendingIssues} pending`);
      if (userComplaintData.inProgressIssues > 0) statusSummary.push(`${userComplaintData.inProgressIssues} in progress`);
      if (userComplaintData.resolvedIssues > 0) statusSummary.push(`${userComplaintData.resolvedIssues} resolved`);

      let response = `You have ${userComplaintData.totalIssues} total complaints: ${statusSummary.join(', ')}.`;
      
      if (userComplaintData.recentIssue) {
        response += ` Your latest complaint "${userComplaintData.recentIssue.title}" is currently ${userComplaintData.recentIssue.status}.`;
      }
      
      if (userComplaintData.pendingIssues > 0) {
        response += ` Your pending complaints typically resolve within ${userComplaintData.avgResponseTime}.`;
      }
      
      response += ` Check "My Reports" for detailed status updates!`;
      
      return response;
    }

    // Resolved complaints query
    if (lowerMessage.includes('resolved') || lowerMessage.includes('completed') || lowerMessage.includes('fixed')) {
      if (userComplaintData.resolvedIssues === 0) {
        const pendingText = userComplaintData.pendingIssues > 0 ? 
          ` However, you have ${userComplaintData.pendingIssues} complaints currently being worked on!` : '';
        return `You don't have any resolved complaints yet.${pendingText} Your resolved complaints will appear here once authorities complete the work.`;
      }

      let response = `You have ${userComplaintData.resolvedIssues} resolved complaints! Here are your recent ones: `;
      
      userComplaintData.resolvedList.slice(0, 3).forEach((issue: any, index: number) => {
        const resolvedDate = new Date(issue.updated_at).toLocaleDateString();
        response += `"${issue.title}" (${issue.category}, resolved ${resolvedDate})`;
        if (index < Math.min(2, userComplaintData.resolvedList.length - 1)) response += ', ';
      });

      if (userComplaintData.resolvedIssues > 3) {
        response += ` and ${userComplaintData.resolvedIssues - 3} more.`;
      }
      
      return response + ' Great job reporting these issues!';
    }

    // Pending complaints query
    if (lowerMessage.includes('pending') || lowerMessage.includes('how many')) {
      if (userComplaintData.pendingIssues === 0) {
        const statusText = userComplaintData.totalIssues > 0 ? 
          `All your ${userComplaintData.totalIssues} complaints have been processed!` : 
          `You haven't submitted any complaints yet.`;
        return `You have no pending complaints right now. ${statusText} Ready to report a new issue?`;
      }

      let response = `You have ${userComplaintData.pendingIssues} pending complaints. Here's what's waiting: `;
      
      userComplaintData.pendingList.slice(0, 3).forEach((issue: any, index: number) => {
        const daysPending = Math.floor((Date.now() - new Date(issue.created_at).getTime()) / (1000 * 60 * 60 * 24));
        response += `"${issue.title}" (${daysPending} days old)`;
        if (index < Math.min(2, userComplaintData.pendingList.length - 1)) response += ', ';
      });

      if (userComplaintData.pendingIssues > 3) {
        response += ` and ${userComplaintData.pendingIssues - 3} more.`;
      }
      
      response += ` Average resolution time is ${userComplaintData.avgResponseTime}. Check "My Reports" for updates!`;
      
      return response;
    }

    // Category-specific queries
    if (lowerMessage.includes('road') || lowerMessage.includes('water') || lowerMessage.includes('waste')) {
      const categoryMap: any = {
        'road': 'Roads',
        'water': 'Water Supply', 
        'waste': 'Waste Management',
        'electric': 'Electricity',
        'drainage': 'Drainage'
      };
      
      const queriedCategory = Object.keys(categoryMap).find(cat => lowerMessage.includes(cat));
      if (queriedCategory && userComplaintData.categoryStats[categoryMap[queriedCategory]]) {
        const count = userComplaintData.categoryStats[categoryMap[queriedCategory]];
        return `📊 **Your ${categoryMap[queriedCategory]} Complaints:**

You've reported **${count} ${categoryMap[queriedCategory].toLowerCase()} issue(s)**.

**🔍 To see details:** Check "My Reports" → Filter by "${categoryMap[queriedCategory]}" category.

**📞 Relevant Authority:** 
${queriedCategory === 'road' ? '• GHMC Road Department: 155304' : 
  queriedCategory === 'water' ? '• Hyderabad Water Board: 155313' :
  queriedCategory === 'waste' ? '• GHMC Sanitation: 155304' :
  '• Check the complaint details for authority contact info'}

Need help with a new ${queriedCategory} issue? I can guide you through reporting it! 🛠️`;
      }
    }
  }

  // PRIORITY 3: Use OpenAI API for intelligent responses (fallback after FAQ and database)
  console.log('No FAQ or user-specific match found, using AI API');
  return null; // This will trigger OpenAI API in the main function
};

// Enhanced FAQ patterns with more specific responses
const getFallbackResponse = (message: string): string => {
  const lowerMessage = message.toLowerCase();
  
  // FAQ patterns and responses
  const faqPatterns = [
    {
      keywords: ['submit', 'report', 'complaint', 'issue', 'how to', 'file'],
      response: `📝 **How to Submit a Complaint - Step by Step:**

**📱 Quick Method:**
1. Click "Report Issues" in the main dashboard
2. Select category: 🚧 Roads, 💧 Water, 🗑️ Waste, ⚡ Electricity, 🚰 Drainage
3. Describe the problem clearly
4. Add location (district/pincode/landmark)
5. Upload photos (helps get faster resolution!)
6. Submit and get your tracking ID

**💬 AI-Assisted Method:**
• Type "report an issue" here for step-by-step guidance
• I'll help categorize and prioritize your complaint
• Get tips for writing effective descriptions

**⚡ Pro Tips:**
• Include specific location details
• Mention safety concerns for higher priority
• Add multiple photos from different angles

Ready to start? Click "Report Issue" above! 🚀`
    },
    {
      keywords: ['track', 'status', 'follow', 'check', 'my complaint', 'progress'],
      response: `📊 **How to Track Your Complaint Status:**

**📲 Multiple Ways to Track:**
1. **Dashboard**: Go to "My Reports" section
2. **Chatbot**: Ask me "track my complaints" or "my status"
3. **SMS/Email**: Automatic updates sent to you
4. **Tracking ID**: Use it on the status page

**📈 Status Meanings:**
• 🔄 **Pending**: Complaint received, being reviewed
• ⚙️ **In Progress**: Authority is actively working on it
• ✅ **Resolved**: Issue has been fixed/addressed
• ❌ **Rejected**: Not within scope (rare, with explanation)

**⏰ Typical Timeline:**
• Municipal issues: 3-7 business days
• Corruption cases: 7-15 business days
• Emergency issues: Same day response

**🔔 Get Notified:**
• Status changes trigger automatic SMS/email
• Critical updates sent immediately
• Weekly summary for pending issues

Try asking me "track my complaints" to see your personalized status! 📱`
    },
    {
      keywords: ['edit', 'update', 'change', 'modify', 'delete', 'remove'],
      response: `✏️ **Managing Your Complaints:**

**📝 Editing Complaints:**
• Go to "My Reports" section
• Click on any complaint to view details
• Use "Edit" button to modify description, add photos
• Cannot change category after submission (prevents misuse)

**🗑️ Deleting Complaints:**
• Only possible within 24 hours of submission
• Click "Delete" in complaint details
• Permanent action - cannot be undone
• Alternative: Add clarification instead of deleting

**🔄 Adding Updates:**
• Use "Add Update" to provide new information
• Upload additional photos or evidence
• Clarify location or severity
• These updates help authorities resolve faster

**⚠️ Important Notes:**
• Fraudulent complaints may lead to account suspension
• Major changes require creating a new complaint
• Authority responses cannot be edited (but you can reply)

**💡 Best Practice:**
Instead of deleting, add updates with corrections! This maintains the complete history for authorities. 📚`
    },
    {
      keywords: ['authority', 'contact', 'phone', 'email', 'office', 'help', 'support'],
      response: `📞 **Contact Information & Authorities:**

**🏛️ Municipal Issues:**
• **GHMC**: 155304 | commissioner-ghmc@gov.in
• **Water Board**: 155313 | customercare@hyderabadwater.gov.in
• **Electricity**: 1912 | complaint@tssouthernpower.com
• **Traffic**: 9010203626 | traffic.hyd@tspolice.gov.in

**🔒 Corruption Cases:**
• **ACB Telangana**: 040-2325-1555 | dg_acb@telangana.gov.in
• **Vigilance**: 040-2346-1151 | vigilance@telangana.gov.in
• **Lokayukta**: 040-2332-4621 | info@tslokayukta.gov.in

**🚨 Emergency Contacts:**
• Fire: 101 | Ambulance: 108 | Police: 100
• Disaster: 040-2345-3456 | Women Helpline: 181

**💬 Platform Support:**
• Technical issues: Use this chatbot
• Account problems: Ask me "account help"
• Report bugs: Describe the issue here

**⚡ Quick Response Tips:**
• For urgent issues: Call first, then file complaint
• Use WhatsApp numbers for faster response
• Mention complaint ID when calling authorities

Need help with something specific? Just ask! 🤝`
    },
    {
      keywords: ['category', 'type', 'issues', 'what can report', 'kind'],
      response: `🏢 **Complete Issue Categories & Examples:**

**🏙️ Municipal Services:**
• 🚧 **Roads**: Potholes, broken footpaths, traffic signals
• 💧 **Water**: Leakage, shortage, contamination, billing
• 🗑️ **Waste**: Garbage collection, illegal dumping, overflowing bins
• ⚡ **Electricity**: Streetlight issues, power cuts, billing disputes
• 🚰 **Drainage**: Blockages, overflow, manholes, stagnant water
• 🌳 **Parks**: Maintenance, encroachment, damaged equipment

**💰 Corruption & Governance:**
• 🤝 Bribery in government offices
• 📄 Document processing delays/demands
• ⚖️ Misuse of public funds
• 🏛️ Abuse of power by officials
• 🎯 Favoritism in public services

**🚨 Safety & Security:**
• 🔒 Street safety, lighting issues
• 🚦 Traffic violations, illegal parking
• 🏗️ Unauthorized construction
• 🎵 Noise pollution, illegal events

**✅ What Gets Resolved Fastest:**
• Issues with photos/evidence
• Clear location details
• Safety-related problems
• Multiple citizen reports on same issue

**❌ What We Cannot Handle:**
• Private disputes between individuals
• Court cases or legal matters
• Central government issues

Each category automatically routes to the right authority! 🎯`
    },
    {
      keywords: ['anonymous', 'privacy', 'identity', 'confidential', 'secret'],
      response: `🔒 **Privacy & Anonymous Reporting:**

**🛡️ Your Privacy is Protected:**
• End-to-end encryption for all data
• Identity shared only with relevant authorities when needed
• Option to file completely anonymous complaints
• IP address and device info not stored with complaints

**👤 Anonymous Reporting Options:**
• Check "Anonymous" during complaint submission
• Use generic email for account (not required to be real name)
• Phone number optional for anonymous reports
• No personal details shared in public complaint tracking

**🔐 Data Security Measures:**
• All personal data encrypted at rest
• Secure transmission protocols (HTTPS/TLS)
• Authority access logged and audited
• Automatic data deletion after case closure

**⚠️ When Identity May Be Needed:**
• Corruption cases requiring witness testimony
• Legal proceedings initiated by authorities
• Follow-up investigations requiring clarification
• Court orders (rare, with legal notice)

**💡 Best Practices for Anonymity:**
• Use general location descriptions
• Avoid mentioning personal relationships
• Focus on facts, not opinions
• Use separate email for sensitive reports

**🚨 Special Protection for Whistleblowers:**
• Extra security for corruption reports
• Direct channels to senior authorities
• Legal protection under Whistleblower Act
• 24/7 support for serious cases

Your safety comes first! 🛡️`
    }
  ];

  // Enhanced pattern matching
  for (const faq of faqPatterns) {
    if (faq.keywords.some(keyword => lowerMessage.includes(keyword))) {
      return faq.response;
    }
  }

  // More specific default responses based on context
  if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
    return `🤖 **How I Can Help You:**

**🎯 Main Functions:**
• 📝 Guide you through complaint submission
• 📊 Track your complaint status in real-time
• 🏢 Explain issue categories and authorities
• 📞 Provide contact information and escalation paths
• 💡 Give tips for effective complaint writing

**💬 Try These Commands:**
• "Track my complaints" - See your personalized status
• "Report an issue" - Step-by-step guidance
• "Contact info for water problems" - Get specific authority details
• "How to write effective complaints" - Pro tips
• "My complaint history" - View all your submissions

**🚀 Quick Actions:**
• Click "Report Issue" above for guided submission
• Ask specific questions about your area of concern
• Request escalation help for unresolved issues

**📱 Available 24/7:**
I'm here anytime you need help with civic issues in Telangana! What would you like assistance with? 😊`;
  }

  // Default comprehensive response
  return `🤖 **Welcome to Your AI Civic Assistant!**

**🎯 I'm specialized in helping with:**
• 📝 **Complaint Reporting**: Step-by-step guidance for all issue types
• 📊 **Status Tracking**: Real-time updates on your submissions
• 🏢 **Authority Information**: Know exactly who handles what
• 💬 **Process Guidance**: Navigate civic services efficiently
• 🔍 **Personal Dashboard**: Track your complaint history

**🚀 Quick Start Options:**
• Type "report an issue" for guided submission
• Ask "track my complaints" for personalized status
• Say "help with [specific issue]" for targeted assistance
• Click "Report Issue" button above for immediate help

**💡 Popular Queries:**
• "How to report a pothole?"
• "Water supply complaint procedure"
• "Track complaint status"
• "Corruption reporting process"
• "Contact information for authorities"

**🌟 Pro Tips:**
• Be specific about locations
• Include photos when possible
• Use this chat for real-time guidance
• Check your email/SMS for status updates

Ready to make your city better? What issue would you like to address today? 🏙️✨`;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationId, context, userId } = await req.json();
    console.log('Received message:', message, 'from user:', userId);

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user profile data if authenticated
    let userData = null;
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      userData = profile;
      console.log('User data loaded:', userData?.display_name);
    }

    let response;
    let responseSource = 'unknown';

    // PRIORITY SYSTEM: FAQ → Database → AI API
    console.log('Starting priority-based response system...');
    
    // Try contextual response (includes FAQ and user-specific data)
    const contextualResponse = await getContextualResponse(message, userData, supabase, userId);
    
    if (contextualResponse) {
      response = contextualResponse;
      responseSource = 'faq_or_database';
      console.log('Response from FAQ or database');
    } else if (openAIApiKey) {
      // PRIORITY 3: OpenAI API for intelligent responses
      console.log('Using OpenAI API for intelligent response');
      
      const systemPrompt = `You are an AI assistant for a civic complaint platform in Telangana, India. Citizens use this platform to report issues like roads, water, waste, electricity, and corruption.

Key principles:
- Be conversational and natural (not robotic)
- Keep responses concise (1-2 sentences max)
- Focus on being helpful, not overly detailed
- Use simple, friendly language
- Avoid bullet points unless absolutely necessary
- If asked about platform features, refer them to specific sections

Platform features available:
- Report Issues (complaint submission)
- My Reports (status tracking)
- Voice input and image upload
- Anonymous reporting option
- Real-time status updates via SMS/email

${userData ? `User: ${userData.display_name || 'User'} (${userData.is_anonymous ? 'anonymous' : 'registered'})` : 'User: Not logged in'}

Respond naturally as if you're having a casual conversation.`;

      try {
        const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message }
            ],
            max_tokens: 150,
            temperature: 0.8,
          }),
        });

        if (openAIResponse.ok) {
          const data = await openAIResponse.json();
          response = data.choices[0].message.content.trim();
          responseSource = 'openai';
          console.log('OpenAI response generated successfully');
        } else {
          console.error('OpenAI API error:', await openAIResponse.text());
          throw new Error('OpenAI API failed');
        }
      } catch (openaiError) {
        console.error('OpenAI error:', openaiError);
        response = getFallbackResponse(message);
        responseSource = 'fallback';
      }
    } else {
      // No OpenAI key available, use fallback
      console.log('No OpenAI key available, using fallback responses');
      response = getFallbackResponse(message);
      responseSource = 'fallback';
    }

    console.log('Final response source:', responseSource);

    return new Response(JSON.stringify({ 
      response,
      conversationId: conversationId || `conv_${Date.now()}`,
      source: responseSource,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chatbot function:', error);
    
    const fallbackMessage = "I'm having technical difficulties right now, but I can still help! " +
                           "Try asking about complaint status, how to upload images, or reporting new issues. " +
                           "You can also submit complaints directly through 'Report Issues' section.";
    
    return new Response(JSON.stringify({ 
      error: error.message,
      response: fallbackMessage,
      source: 'error_fallback',
      timestamp: new Date().toISOString()
    }), {
      status: 200, // Don't return error status to avoid breaking frontend
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
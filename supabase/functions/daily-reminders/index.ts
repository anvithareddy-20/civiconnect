import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Category-specific email mappings
const getCategoryEmails = (category: string): string[] => {
  const categoryEmailMap: { [key: string]: string[] } = {
    'potholes': ['ghmc.roads@telangana.gov.in', 'sricharan.dhupati@gmail.com'],
    'streetlights': ['ghmc.electrical@telangana.gov.in', 'sricharan.dhupati@gmail.com'],
    'water': ['waterboard@telangana.gov.in', 'sricharan.dhupati@gmail.com'],
    'trash': ['ghmc.sanitation@telangana.gov.in', 'sricharan.dhupati@gmail.com'],
    'construction': ['ghmc.engineering@telangana.gov.in', 'sricharan.dhupati@gmail.com'],
    'parks': ['ghmc.parks@telangana.gov.in', 'sricharan.dhupati@gmail.com'],
    'corpse': ['ghmc.health@telangana.gov.in', 'sricharan.dhupati@gmail.com'],
    'drainage': ['ghmc.drainage@telangana.gov.in', 'sricharan.dhupati@gmail.com'],
    'corruption': ['acb@telangana.gov.in', 'sricharan.dhupati@gmail.com'],
    'test_case': ['sricharan.dhupati@gmail.com']
  };

  return categoryEmailMap[category] || ['sricharan.dhupati@gmail.com'];
};

const getCategoryDepartment = (category: string): string => {
  const departmentMap: { [key: string]: string } = {
    'potholes': 'GHMC Roads Department',
    'streetlights': 'GHMC Electrical Department',
    'water': 'Hyderabad Water Board',
    'trash': 'GHMC Sanitation Department',
    'construction': 'GHMC Engineering Department',
    'parks': 'GHMC Parks & Recreation',
    'corpse': 'GHMC Health Department',
    'drainage': 'GHMC Drainage Department',
    'corruption': 'Anti-Corruption Bureau',
    'test_case': 'Test Department'
  };

  return departmentMap[category] || 'Municipal Corporation';
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting daily reminders job...");

    // Get all reported issues from the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data: reportedIssues, error: issuesError } = await supabase
      .from('issues')
      .select(`
        id,
        title,
        description,
        category,
        location,
        priority,
        status,
        created_at,
        user_id,
        profiles!inner(email, display_name)
      `)
      .eq('status', 'reported')
      .gte('created_at', yesterday.toISOString());

    if (issuesError) {
      console.error("Error fetching reported issues:", issuesError);
      throw issuesError;
    }

    console.log(`Found ${reportedIssues?.length || 0} reported issues from last 24 hours`);

    if (!reportedIssues || reportedIssues.length === 0) {
      return new Response(JSON.stringify({ 
        message: "No new reported issues found",
        processed: 0
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Group issues by category for batch processing
    const issuesByCategory = reportedIssues.reduce((acc: any, issue: any) => {
      if (!acc[issue.category]) {
        acc[issue.category] = [];
      }
      acc[issue.category].push(issue);
      return acc;
    }, {});

    const notificationResults = [];

    // Send notifications for each category
    for (const [category, issues] of Object.entries(issuesByCategory)) {
      const categoryIssues = issues as any[];
      const departmentEmails = getCategoryEmails(category);
      const departmentName = getCategoryDepartment(category);

      // Create summary email for the department
      const issuesList = categoryIssues.map((issue: any, index: number) => `
        <div style="background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid ${
          issue.priority === 'high' ? '#dc3545' : 
          issue.priority === 'medium' ? '#ffc107' : '#28a745'
        };">
          <h4 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">${index + 1}. ${issue.title}</h4>
          <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;"><strong>Location:</strong> ${issue.location || 'Not specified'}</p>
          <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;"><strong>Priority:</strong> 
            <span style="padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; ${
              issue.priority === 'high' ? 'background: #ffebee; color: #c62828;' :
              issue.priority === 'medium' ? 'background: #fff3e0; color: #ef6c00;' :
              'background: #e8f5e8; color: #2e7d32;'
            }">${issue.priority.toUpperCase()}</span>
          </p>
          <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;"><strong>Reported by:</strong> ${issue.profiles.display_name || 'Anonymous'}</p>
          <p style="margin: 0; color: #555; font-size: 14px;">${issue.description}</p>
          <p style="margin: 8px 0 0 0; color: #888; font-size: 12px;"><strong>Issue ID:</strong> ${issue.id}</p>
        </div>
      `).join('');

      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #1976d2; margin-bottom: 20px; font-size: 28px; text-align: center;">📋 Daily Issue Report</h1>
            
            <div style="background-color: #e3f2fd; border: 1px solid #1976d2; padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center;">
              <h2 style="color: #1565c0; margin: 0 0 10px 0; font-size: 20px;">${departmentName}</h2>
              <p style="color: #1565c0; margin: 0; font-size: 16px;"><strong>${categoryIssues.length}</strong> new ${category.replace('_', ' ')} issue${categoryIssues.length > 1 ? 's' : ''} reported in the last 24 hours</p>
            </div>
            
            <h3 style="color: #333; margin-bottom: 20px; font-size: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px;">📝 Issue Details:</h3>
            
            ${issuesList}
            
            <div style="margin-top: 30px; padding: 20px; background-color: #fff3cd; border-radius: 8px; border: 1px solid #ffc107;">
              <h4 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">⚡ Action Required:</h4>
              <ul style="color: #856404; margin: 0; padding-left: 20px;">
                <li>Review and prioritize these issues based on urgency</li>
                <li>Assign appropriate teams for resolution</li>
                <li>Update status in the system as work progresses</li>
                <li>Contact citizens for additional information if needed</li>
              </ul>
            </div>
            
            <div style="margin-top: 25px; text-align: center; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
              <p style="margin: 0; color: #666; font-size: 14px;">
                📊 <strong>Platform Statistics:</strong> This automated report helps track and manage civic issues efficiently.
                <br>
                🕒 <strong>Report Generated:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
              </p>
            </div>
          </div>
          
          <footer style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>This is an automated daily report from CivicConnect - Smart Community Reporting Platform</p>
            <p>For technical support, contact: support@civicconnect.gov.in</p>
          </footer>
        </div>
      `;

      // Send email to department
      try {
        const emailResult = await resend.emails.send({
          from: "CivicConnect Daily Reports <reports@resend.dev>",
          to: departmentEmails,
          subject: `📋 Daily Report: ${categoryIssues.length} New ${category.replace('_', ' ').toUpperCase()} Issue${categoryIssues.length > 1 ? 's' : ''} - ${new Date().toLocaleDateString('en-IN')}`,
          html: emailContent,
        });

        console.log(`Email sent to ${departmentName} for ${categoryIssues.length} ${category} issues`);
        notificationResults.push({
          category,
          department: departmentName,
          issueCount: categoryIssues.length,
          emailStatus: emailResult.error ? 'failed' : 'sent',
          emails: departmentEmails
        });

      } catch (emailError) {
        console.error(`Error sending email for ${category}:`, emailError);
        notificationResults.push({
          category,
          department: departmentName,
          issueCount: categoryIssues.length,
          emailStatus: 'failed',
          error: emailError.message
        });
      }
    }

    const successCount = notificationResults.filter(result => result.emailStatus === 'sent').length;
    const failureCount = notificationResults.filter(result => result.emailStatus === 'failed').length;

    console.log(`Daily notifications completed: ${successCount} categories notified, ${failureCount} failed`);

    return new Response(JSON.stringify({
      message: "Daily notifications sent to departments",
      totalIssues: reportedIssues.length,
      categoriesProcessed: Object.keys(issuesByCategory).length,
      successfulNotifications: successCount,
      failedNotifications: failureCount,
      results: notificationResults
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in daily reminders function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
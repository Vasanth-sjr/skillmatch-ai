// Mock API Service Layer for SkillMatch ATS Interactive Features
import { mockApplicants } from "@/data/hrMockData";

/**
 * Upload files via mock backend API
 * Simulates a delay processing the request. Validates up to 10MB per file.
 */
export async function uploadFiles(files: File[]): Promise<{
  id: string;
  name: string;
  success: boolean;
  message?: string;
}[]> {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const validTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ];

  const results = [];

  for (const file of files) {
    const fileId = Math.random().toString(36).substring(2, 9);
    
    // Server-side validation simulation
    if (!validTypes.includes(file.type)) {
      results.push({ id: fileId, name: file.name, success: false, message: "Invalid file format." });
      continue;
    }
    if (file.size > maxSize) {
      results.push({ id: fileId, name: file.name, success: false, message: "File exceeds 10MB limit." });
      continue;
    }

    // Simulate network and processing delay per file
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1000));
    
    // Simulate ~5% random processing error
    if (Math.random() > 0.95) {
      results.push({ id: fileId, name: file.name, success: false, message: "Server error occurred during parsing." });
    } else {
      results.push({ id: fileId, name: file.name, success: true });
    }
  }

  return results;
}

/**
 * Export data via mock backend API
 * Triggers a browser download of a CSV file containing mock applicants
 */
export async function exportData(format: 'csv' | 'excel' = 'csv'): Promise<void> {
  // Simulate network delay to generate report
  await new Promise((resolve) => setTimeout(resolve, 1500));

  let content = '';
  let filename = '';
  let mimeType = '';

  if (format === 'csv') {
    // Generate simple CSV from mock data
    const headers = ['Name', 'Position', 'Status', 'Authenticity Score', 'Submitted Date'];
    const rows = mockApplicants.map(a => 
      `"${a.name}","${a.position}","${a.status}",${a.authenticityScore},"${a.submittedAt}"`
    );
    
    content = [headers.join(','), ...rows].join('\n');
    filename = `skillmatch-export-${new Date().toISOString().split('T')[0]}.csv`;
    mimeType = 'text/csv;charset=utf-8;';
  } else {
    // Just mock an excel fallback by generating a simple text file
    content = "This is a mock excel export.";
    filename = `skillmatch-export-${new Date().toISOString().split('T')[0]}.xlsx`;
    mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }

  // Trigger browser download
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Search globally across candidates, jobs, and events
 */
export async function search(query: string): Promise<Record<string, { id: string, title: string, subtitle?: string }[]>> {
  if (!query || query.trim().length < 2) return {};

  const lowerQuery = query.toLowerCase();
  
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const results: Record<string, { id: string, title: string, subtitle?: string }[]> = {
    Candidates: [],
    'Job Openings': [],
    Events: []
  };

  // Search Candidates
  mockApplicants.forEach(app => {
    if (app.name.toLowerCase().includes(lowerQuery) || app.position.toLowerCase().includes(lowerQuery)) {
      results.Candidates.push({
        id: app.id,
        title: app.name,
        subtitle: app.position
      });
    }
  });

  // Mock Job Openings Search
  const mockJobs = [
    { id: 'j1', title: 'Senior Frontend Engineer', subtitle: 'San Francisco, CA' },
    { id: 'j2', title: 'Product Manager', subtitle: 'Remote' },
    { id: 'j3', title: 'Data Scientist', subtitle: 'New York, NY' },
  ];
  mockJobs.forEach(job => {
    if (job.title.toLowerCase().includes(lowerQuery)) {
      results['Job Openings'].push({
        id: job.id,
        title: job.title,
        subtitle: job.subtitle
      });
    }
  });

  // Clean empty categories
  for (const key of Object.keys(results)) {
    if (results[key].length === 0) {
      delete results[key];
    }
  }

  return results;
}

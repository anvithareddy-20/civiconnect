export interface Suggestion {
  id: string;
  issueId: string;
  author: string;
  content: string;
  date: string;
  likes: number;
  images?: string[];
}

export interface Issue {
  id: string;
  title: string;
  category: string;
  customCategory?: string;
  location: string;
  date: string;
  status: 'reported' | 'progress' | 'resolved';
  description: string;
  images: string[];
  suggestions: number;
  enquiries: number;
}

const STORAGE_KEY = 'civic-issues';
const SUGGESTIONS_STORAGE_KEY = 'civic-suggestions';

export const saveIssue = (issueData: Omit<Issue, 'id' | 'date' | 'status' | 'suggestions' | 'enquiries'>): Issue => {
  const issues = getIssues();
  const newIssue: Issue = {
    ...issueData,
    id: Date.now().toString(),
    date: new Date().toISOString().split('T')[0],
    status: 'reported',
    suggestions: 0,
    enquiries: 0
  };
  
  issues.push(newIssue);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
  
  return newIssue;
};

export const getIssues = (): Issue[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : getMockIssues();
  } catch {
    return getMockIssues();
  }
};

export const deleteIssue = (issueId: string): boolean => {
  try {
    const issues = getIssues();
    const filteredIssues = issues.filter(issue => issue.id !== issueId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredIssues));
    
    // Also delete associated suggestions
    const suggestions = getSuggestions();
    const filteredSuggestions = suggestions.filter(suggestion => suggestion.issueId !== issueId);
    localStorage.setItem(SUGGESTIONS_STORAGE_KEY, JSON.stringify(filteredSuggestions));
    
    return true;
  } catch {
    return false;
  }
};

export const saveSuggestion = (suggestionData: Omit<Suggestion, 'id' | 'date' | 'likes'>): Suggestion => {
  const suggestions = getSuggestions();
  const newSuggestion: Suggestion = {
    ...suggestionData,
    id: Date.now().toString(),
    date: new Date().toISOString().split('T')[0],
    likes: 0
  };
  
  suggestions.push(newSuggestion);
  localStorage.setItem(SUGGESTIONS_STORAGE_KEY, JSON.stringify(suggestions));
  
  // Update suggestion count for the issue
  const issues = getIssues();
  const updatedIssues = issues.map(issue => 
    issue.id === suggestionData.issueId 
      ? { ...issue, suggestions: issue.suggestions + 1 }
      : issue
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedIssues));
  
  return newSuggestion;
};

export const getSuggestions = (issueId?: string): Suggestion[] => {
  try {
    const stored = localStorage.getItem(SUGGESTIONS_STORAGE_KEY);
    const allSuggestions = stored ? JSON.parse(stored) : getMockSuggestions();
    return issueId ? allSuggestions.filter((s: Suggestion) => s.issueId === issueId) : allSuggestions;
  } catch {
    return getMockSuggestions();
  }
};

export const updateSuggestionLikes = (suggestionId: string, likes: number): void => {
  try {
    const suggestions = getSuggestions();
    const updatedSuggestions = suggestions.map(suggestion =>
      suggestion.id === suggestionId ? { ...suggestion, likes } : suggestion
    );
    localStorage.setItem(SUGGESTIONS_STORAGE_KEY, JSON.stringify(updatedSuggestions));
  } catch {
    // Handle error silently
  }
};

const getMockSuggestions = (): Suggestion[] => [
  {
    id: '1',
    issueId: '1',
    author: 'Sarah Chen',
    content: 'I suggest using a more durable asphalt mix for this area since it gets heavy truck traffic. The city should also consider installing proper drainage to prevent water pooling.',
    date: '2024-01-16',
    likes: 12
  },
  {
    id: '2',
    issueId: '1',
    author: 'Mike Rodriguez',
    content: 'Temporary solution: Place warning cones around the pothole until repairs can be made. I can volunteer to help coordinate with local businesses for temporary signage.',
    date: '2024-01-15',
    likes: 8
  }
];

const getMockIssues = (): Issue[] => [
  {
    id: '1',
    title: 'Large pothole on Main Street',
    category: 'potholes',
    location: 'Main Street & 5th Ave',
    date: '2024-01-15',
    status: 'progress',
    description: 'Deep pothole causing damage to vehicles. Multiple cars have reported tire damage.',
    images: [],
    suggestions: 2,
    enquiries: 2
  },
  {
    id: '2',
    title: 'Broken streetlight in park',
    category: 'streetlights',
    location: 'Central Park East Entrance',
    date: '2024-01-14',
    status: 'resolved',
    description: 'Streetlight has been out for over a week, making the area unsafe for evening joggers.',
    images: [],
    suggestions: 0,
    enquiries: 1
  },
  {
    id: '3',
    title: 'Overflowing trash bins',
    category: 'trash',
    location: '2nd Street Bus Stop',
    date: '2024-01-16',
    status: 'reported',
    description: 'Multiple trash bins overflowing for days, creating unsanitary conditions.',
    images: [],
    suggestions: 0,
    enquiries: 3
  }
];
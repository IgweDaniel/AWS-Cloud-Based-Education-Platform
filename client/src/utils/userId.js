export function getUserId() {
    // Try to get existing userId from localStorage
    let userId = localStorage.getItem('userId');
    
    // If no userId exists, create a new one
    if (!userId) {
      userId = 'user-' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('userId', userId);
    }
    
    return userId;
  }
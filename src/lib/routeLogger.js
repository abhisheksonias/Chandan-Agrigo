// A simple utility to log route transitions
export const logRouteTransition = (from, to) => {
  console.log(`Route transition: ${from} -> ${to}`);
  
  // Check for any existing issues with the to route
  const potentialIssues = [];
  if (to === '/signup' || to === '/SignUpPage' || to === '/SignUp') {
    potentialIssues.push('Navigating to signup page - check that SignUpPage.jsx is correctly exported');
    potentialIssues.push('Check that the route is correctly defined in App.jsx');
  }
  
  if (potentialIssues.length > 0) {
    console.log('Potential issues:');
    potentialIssues.forEach(issue => console.log(`- ${issue}`));
  }
  
  // Return the intended destination for debugging
  return to;
};

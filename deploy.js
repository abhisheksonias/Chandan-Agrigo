// This script helps deploy the app to a server
// Run this with: node deploy.js

const fs = require('fs');
const path = require('path');

// Create public/_redirects file for SPA routing
const createRedirectsFile = () => {
  const redirectsContent = `
# Redirect all routes to index.html for SPA routing
/*    /index.html    200
  `.trim();
  
  fs.writeFileSync(
    path.join(__dirname, 'public', '_redirects'),
    redirectsContent
  );
  console.log('Created _redirects file for SPA routing');
};

// Create a diagnostics page to help with debugging
const createDiagnosticsFile = () => {
  const diagnosticsContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Routing Diagnostics</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 2rem; line-height: 1.6; }
    h1 { color: #2563eb; }
    .card { background: #f0f4f8; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; }
    button { background: #2563eb; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.25rem; cursor: pointer; }
    button:hover { background: #1d4ed8; }
    pre { background: #f1f1f1; padding: 1rem; border-radius: 0.25rem; overflow: auto; }
  </style>
</head>
<body>
  <h1>Routing Diagnostics</h1>
  
  <div class="card">
    <h2>Current Location</h2>
    <pre id="location-info">Loading...</pre>
  </div>

  <div class="card">
    <h2>Navigation Tests</h2>
    <button onclick="testNavigation('/login')">Go to Login</button>
    <button onclick="testNavigation('/signup')">Go to Sign Up</button>
    <button onclick="testNavigation('/SignUpPage')">Go to SignUpPage</button>
    <button onclick="testNavigation('/test')">Go to Test Routes</button>
  </div>

  <div class="card">
    <h2>Navigation Log</h2>
    <pre id="nav-log"></pre>
  </div>

  <script>
    // Update location info
    function updateLocationInfo() {
      const locationInfo = document.getElementById('location-info');
      locationInfo.textContent = JSON.stringify({
        href: window.location.href,
        pathname: window.location.pathname,
        hash: window.location.hash,
        search: window.location.search
      }, null, 2);
    }

    // Test navigation
    function testNavigation(path) {
      const navLog = document.getElementById('nav-log');
      navLog.textContent += \`\\nNavigating to \${path}...\`;
      
      try {
        window.location.href = path;
      } catch (error) {
        navLog.textContent += \`\\nError: \${error.message}\`;
      }
    }

    // Initialize
    updateLocationInfo();
    window.addEventListener('popstate', updateLocationInfo);
    
    const navLog = document.getElementById('nav-log');
    navLog.textContent = \`Navigation log initialized at \${new Date().toISOString()}\`;
  </script>
</body>
</html>
  `.trim();
  
  fs.writeFileSync(
    path.join(__dirname, 'public', 'diagnostics.html'),
    diagnosticsContent
  );
  console.log('Created diagnostics.html for route debugging');
};

// Main function
const main = () => {
  console.log('Starting deployment preparation...');
  
  // Create the public directory if it doesn't exist
  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }
  
  // Create necessary files
  createRedirectsFile();
  createDiagnosticsFile();
  
  console.log('Deployment preparation complete!');
  console.log('Build your app with: npm run build');
  console.log('After deployment, visit /diagnostics.html to test routing');
};

main();

export function buildPortalCredentialsEmail(name: string, email: string, tempPassword: string) {
  const subject = "Your Rynex Security Portal Credentials";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body {
          font-family: 'IBM Plex Sans', Helvetica, Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
          color: #262626;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .header {
          background-color: #1a1f36;
          padding: 30px;
          text-align: center;
          border-bottom: 3px solid #00d4ff;
        }
        .header h1 {
          color: #ffffff;
          margin: 0;
          font-size: 20px;
          letter-spacing: 1px;
          font-weight: 500;
        }
        .content {
          padding: 40px 30px;
        }
        .welcome {
          font-size: 18px;
          font-weight: 500;
          margin-bottom: 20px;
        }
        .text {
          font-size: 15px;
          line-height: 1.6;
          color: #525252;
          margin-bottom: 30px;
        }
        .credentials-card {
          background-color: #f8f9fa;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .credential-row {
          margin-bottom: 12px;
          font-size: 15px;
        }
        .credential-row:last-child {
          margin-bottom: 0;
        }
        .label {
          font-weight: 600;
          color: #262626;
          display: inline-block;
          width: 90px;
        }
        .value {
          font-family: 'IBM Plex Mono', monospace;
          color: #0089ab;
        }
        .cta-container {
          text-align: center;
          margin-bottom: 30px;
        }
        .btn {
          background-color: #262626;
          color: #ffffff !important;
          text-decoration: none;
          padding: 12px 30px;
          font-size: 15px;
          font-weight: 500;
          border-radius: 2px;
          display: inline-block;
        }
        .btn:hover {
          background-color: #000000;
        }
        .warning {
          font-size: 13px;
          color: #da1e28;
          border-top: 1px solid #e0e0e0;
          padding-top: 20px;
        }
        .footer {
          background-color: #f4f4f4;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #6f6f6f;
          border-top: 1px solid #e0e0e0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>RYNEX SECURITY</h1>
        </div>
        <div class="content">
          <div class="welcome">Hello ${name},</div>
          <div class="text">
            Your internal portal account has been created by the administrator. You now have access to the Rynex Security internal portal where you can view projects, tasks, and submit deliverables.
          </div>
          
          <div class="credentials-card">
            <div class="credential-row">
              <span class="label">Portal URL:</span>
              <span class="value">portal.rynexsecurity.com</span>
            </div>
            <div class="credential-row">
              <span class="label">Email:</span>
              <span class="value">${email}</span>
            </div>
            <div class="credential-row">
              <span class="label">Password:</span>
              <span class="value">${tempPassword}</span>
            </div>
          </div>
          
          <div class="cta-container">
            <a href="${process.env.SITE_URL || 'https://rynexsecurity-redesign.vercel.app'}/portal/login" class="btn">Login to Portal</a>
          </div>
          
          <div class="warning">
            <strong>Security Warning:</strong> For security reasons, you will be forced to change this temporary password immediately upon your first login. Please choose a strong, unique password.
          </div>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Rynex Security. All Rights Reserved.<br>
          This is an automated system message. Please do not reply.
        </div>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
}

# Cloud-Based Education Platform (CBEP)

## Overview

The Cloud-Based Education Platform (CBEP) is a robust virtual classroom solution designed to facilitate seamless interaction between teachers and students in a remote learning environment. Leveraging AWS infrastructure, CBEP offers real-time video conferencing, class management, enrollment tracking, and user role management.

## Features

- **Live Video Classes**: Real-time video conferencing with audio and video controls.
- **Role-Based Access**: Tailored interfaces and permissions for administrators, teachers, and students.
- **Class Management**: Create, view, edit, and delete classes.
- **User Management**: Manage users with distinct roles.
- **Student Enrollment**: Enroll and remove students from classes.
- **Dashboard Views**: Customized dashboards for each user role.

## Architecture

- **Frontend**: Built with React, Tailwind CSS, and shadcn/ui components.
- **Authentication**: Powered by AWS Cognito.
- **Video Conferencing**: Utilizes Amazon Chime SDK.
- **Database**: Backed by AWS DynamoDB.
- **Backend**: Implemented using AWS Lambda functions.
- **Deployment**: Serverless architecture hosted on AWS.

## Prerequisites

- Node.js (v16+)
- AWS Account
- AWS CLI configured with appropriate permissions
- Yarn package manager

## Installation

### Backend Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/cbep.git
   cd cbep
   ```

2. Install backend dependencies:

   ```bash
   cd functions
   npm install
   ```

3. Create a `serverless.params.json` file in the `functions` directory:

   ```json
   {
     "USER_POOL_ID": "your-prod-user-pool-id",
     "CLIENT_ID": "your-prod-client-id"
   }
   ```

4. Deploy AWS resources:
   ```bash
   npm install -g serverless
   npm run deploy
   ```

### Frontend Setup

1. Navigate to the client directory:

   ```bash
   cd ../client
   ```

2. Install frontend dependencies:

   ```bash
   yarn install
   ```

3. Create a `.env` file in the `client` directory with the following variables:

   ```dotenv
   AWS_REGION=us-east-1
   COGNITO_IDENTITY_POOL_ID=your-identity-pool-id
   COGNITO_REGION=us-east-1
   USER_POOLS_ID=your-user-pool-id
   USER_POOLS_CLIENT_ID=your-user-pool-client-id
   VITE_API_BASE_URL= https://your-api-endpoint.execute-api.us-east-1.amazonaws.com/dev
   ```

4. Generate the AWS exports file:

```bash
   npm run gen:aws-exports
```

5. Run the development server

```bash
npm run dev
```

### Running the Application

#### Development Mode

1. Start the client application:

   ```bash
   cd client
   yarn dev
   ```

2. Access the application at [http://localhost:5173](http://localhost:5173).

## User Roles and Permissions

The platform supports three user roles:

### SUPER_ADMIN

- Create and manage classes.
- Create and manage users.
- Assign teachers to classes.
- Access all classes and data.

### TEACHER

- Manage assigned classes.
- Start and manage live meetings.
- View enrolled students.

### STUDENT

- View and join enrolled classes.
- Participate in live meetings.

## Usage Instructions

### For Administrators

- Log in with administrator credentials.
- Use the admin dashboard to create classes and users.
- Assign teachers to classes.
- Manage student enrollments.

### For Teachers

- Log in with teacher credentials.
- View assigned classes on the dashboard.
- Start live sessions and manage them.
- Control audio/video during live sessions.

### For Students

- Log in with student credentials.
- View enrolled classes on the dashboard.
- Join active class sessions.

## API Endpoints

- `/classes` - Create and list classes.
- `/classes/{id}` - Get, update, or delete a class.
- `/classes/{id}/enroll` - Enroll students in a class.
- `/users` - Create and list users.
- `/users/role` - Assign roles to users.
- `/create-meeting` - Start a new meeting.
- `/join-meeting` - Join an existing meeting.
- `/delete-meeting` - Delete a meeting.

## Troubleshooting

### Common Issues

- **Authentication failures**: Ensure AWS Cognito is configured correctly and the `aws-exports.js` file is generated.
- **Video meeting issues**: Verify browser permissions for camera and microphone access.
- **API connection errors**: Confirm the API endpoint in `endpoint.js` is correct and accessible.

## Tools/Frameworks

### Frontend

- React
- AWS Amplify
- Amazon Chime SDK
- Tailwind CSS
- shadcn/ui

### Api

- AWS Lambda
- AWS DynamoDB
- AWS Cognito
- Amazon Chime SDK
- Serverless Framework
- Node.js
- AWS SDK

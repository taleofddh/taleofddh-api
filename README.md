<div align="center">

# 🚀 Tale of DDH API

**Multi-module serverless Lambda repository with automated deployment scripts and comprehensive CI/CD workflows**

[![Node.js](https://img.shields.io/badge/Node.js-24.0.0+-green.svg)](https://nodejs.org/)
[![Version](https://img.shields.io/badge/Version-5.1.0-orange.svg)](package.json)
[![AWS Lambda](https://img.shields.io/badge/AWS-Lambda-orange.svg)](https://aws.amazon.com/lambda/)
[![Serverless](https://img.shields.io/badge/Serverless-Framework-red.svg)](https://www.serverless.com/)
[![License](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](LICENSE)

</div>

---

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [🏗️ Architecture](#️-architecture)
  - [🔧 Serverless Lambda Architecture](#-serverless-lambda-architecture)
  - [📦 Lambda Modules](#-lambda-modules)
  - [⚙️ Deployment Automation System](#️-deployment-automation-system)
- [🛠️ Development Setup](#️-development-setup)
  - [📋 Prerequisites](#-prerequisites)
  - [☁️ AWS Configuration](#️-aws-configuration)
  - [📥 Installation](#-installation)
- [📜 Script Usage](#-script-usage)
  - [📦 Installation Script](#-installation-script)
  - [🚀 Deployment Script](#-deployment-script)
  - [⚡ Available npm Scripts](#-available-npm-scripts)
- [🚢 Deployment Procedures](#-deployment-procedures)
  - [🔧 Development Deployment](#-development-deployment)
  - [🏭 Production Deployment](#-production-deployment)

- [🔄 GitHub Actions Workflow](#-github-actions-workflow)
- [📁 Project Structure](#-project-structure)
- [📋 Module Details](#-module-details)
- [🔐 Role-Based Access (Cognito Groups)](#-role-based-access-cognito-groups)
- [🔧 Troubleshooting](#-troubleshooting)
- [🤝 Contributing](#-contributing)
- [ℹ️ Repository Information](#ℹ️-repository-information)

---

## 🎯 Overview

This project is a **serverless API** built with AWS Lambda functions using the Serverless Framework. The architecture promotes modularity, scalability, and maintainability across multiple independent Lambda services. Each module is deployed independently while sharing common deployment automation and CI/CD workflows.

### ✨ Key Features

- 🏗️ **Multi-module serverless architecture**
- 🤖 **Automated deployment scripts**
- 🔄 **Comprehensive CI/CD workflows**
- 🎯 **Smart change detection**
- 🌍 **Multi-environment support** (dev, prod)
- ⚡ **Parallel processing** for installations and deployments
- 📊 **Detailed progress reporting**

---

## 🏗️ Architecture

### 🔧 Serverless Lambda Architecture

The repository follows a **multi-module serverless architecture** where each Lambda module:

- 🔄 Operates as an independent microservice
- 📦 Has its own `package.json`, `handler.js`, and `serverless.yml` configuration
- 🚀 Can be deployed independently to different environments (dev, prod)
- 🤝 Shares common deployment automation scripts and workflows

### 📦 Lambda Modules

The repository contains **10 Lambda modules**:

| Module | Purpose | Key Features |
|--------|---------|--------------|
| �‍💼a **admin** | Administrative operations | Admin APIs, CSV processing, email integration |
| � **authi** | Authentication and authorization service | User management, security, CSV processing |
| 📝 **blog** | Blog management APIs | Blog posts, content management, storage |
| ⚙️ **core** | Core business logic APIs | Fundamental application functionality |
| � **emtail** | Email service APIs | Email notifications, mail parsing |
| �️* **gallery** | Gallery and media management | Image galleries, CloudFront distribution, media storage |
| 🔗 **integration** | Third-party integrations | Gmail, WhatsApp, Google Drive, etc. |
| � **linuk** | Link management APIs | URL shortening, link tracking |
| 🏢 **org** | Organization management APIs | About us, people management, role-based menus |
| 📝 **request** | Request handling APIs | Request processing, management |

### ⚙️ Deployment Automation System

The project includes a comprehensive deployment automation system with:

- 🛠️ **Development Scripts**: Automated installation and deployment scripts for local development
- 🔄 **GitHub Actions Workflow**: CI/CD pipeline for production deployments
- 🎯 **Change Detection**: Smart deployment that only deploys modules with changes
- 🌍 **Multi-Environment Support**: Support for dev and prod environments

---

## 🛠️ Development Setup

### 📋 Prerequisites

Before getting started, ensure you have the following installed:

| Requirement | Version | Installation |
|-------------|---------|--------------|
| 🟢 **Node.js** | &gt;= 24.0.0 | [Download](https://nodejs.org/) |
| 📦 **npm** | &gt;= 11.0.0 | Included with Node.js |
| ☁️ **AWS CLI** | Latest | `pip install awscli` |
| ⚡ **Serverless Framework** | v4.x | `npm install -g serverless` |
| 🔧 **Git** | Latest | [Download](https://git-scm.com/) |

### ☁️ AWS Configuration

#### 🔧 Local Development
Set up AWS credentials using a profile (recommended):

```bash
# Configure AWS CLI with your profile
aws configure --profile taleofddh

# Set the profile for this project
export AWS_PROFILE=taleofddh
```

### ⚡ Serverless Framework v4 Authentication

#### 🔧 Local Development
Get your access key from [Serverless Dashboard](https://app.serverless.com/) and set it:

```bash
# Set Serverless access key
export SERVERLESS_ACCESS_KEY=your_access_key_here
```

#### 🤖 CI/CD (GitHub Actions)
The repository uses GitHub Secrets for AWS credentials and Serverless authentication:
- `AWS_ACCESS_KEY_ID` - AWS access key ID
- `AWS_SECRET_ACCESS_KEY` - AWS secret access key
- `SERVERLESS_ACCESS_KEY` - Serverless Framework v4 access key

### 📥 Installation

1. **📥 Clone the repository:**
```bash
git clone https://github.com/taleofddh/taleofddh-api.git
cd taleofddh-api
```

2. **📦 Install dependencies for all Lambda modules:**
```bash
# Install dependencies for all modules automatically
npm run install:all

# Or install manually for a specific module
cd auth
npm install
```

The `install:all` script will:
- 🔍 Discover all Lambda modules automatically
- ⚡ Install dependencies in parallel for faster setup
- ⏭️ Skip modules with no changes (smart installation)
- 📊 Provide detailed progress reporting

---

## 📜 Script Usage

The repository provides automated scripts for common development and deployment tasks:

### 📦 Installation Script

Install dependencies for all Lambda modules:

```bash
# Basic installation (installs only modules with changes)
npm run install:all

# Force install all modules regardless of changes
node scripts/install.js --force

# Install with custom concurrency (1-5 parallel installations)
node scripts/install.js --concurrency=3

# Verbose output for debugging
node scripts/install.js --verbose
```

#### ✨ Features:
- 🎯 **Smart Change Detection**: Only installs modules with package.json changes
- ⚡ **Parallel Processing**: Configurable concurrency for faster installation
- 📊 **Progress Reporting**: Detailed status for each module
- 🛡️ **Error Handling**: Continues with other modules if one fails

### 🚀 Deployment Script

Deploy Lambda modules to different environments:

```bash
# Deploy changed modules to development (default)
npm run deploy:dev

# Deploy changed modules to production
npm run deploy:prod



# Force deploy all modules regardless of changes
node scripts/deploy.js dev --force

# Deploy with custom concurrency (1-3 parallel deployments)
node scripts/deploy.js prod --concurrency=1

# Get help and see all options
node scripts/deploy.js --help
```

#### ✨ Features:
- 🎯 **Change Detection**: 
  - Dev: Uses file hash comparison
  - Production: Uses Git commit comparison
- 🌍 **Multi-Environment**: Support for dev and prod stages
- ⚡ **Controlled Concurrency**: Respects AWS API rate limits
- 🔄 **Rollback Support**: Maintains deployment state for rollback capabilities
- 📊 **Endpoint Reporting**: Shows deployed API Gateway endpoints

### ⚡ Available npm Scripts

| Script | Command | Description |
|--------|---------|-------------|
| 📦 Install All | `npm run install:all` | Install dependencies for all modules |
| 🔧 Deploy Dev | `npm run deploy:dev` | Deploy to development environment |
| 🏭 Deploy Prod | `npm run deploy:prod` | Deploy to production environment |

---

## 🚢 Deployment Procedures

### 🔧 Development Deployment

For local development and testing:

1. **☁️ Set up AWS credentials:**
```bash
export AWS_PROFILE=taleofddh
```

2. **📦 Install dependencies:**
```bash
npm run install:all
```

3. **🚀 Deploy to development environment:**
```bash
npm run deploy:dev
```

4. **🎯 Deploy specific modules (if needed):**
```bash
cd auth
serverless deploy --stage dev
```

### 🏭 Production Deployment

Production deployments are automated through GitHub Actions:

#### 🤖 Automatic Deployment
- **🎯 Trigger**: Push to `production` branch
- **⚙️ Process**: Automatically installs dependencies and deploys all changed modules
- **🌍 Environment**: Production (prod)

#### 🔧 Manual Deployment
You can also trigger deployments manually:

1. Go to **Actions** tab in GitHub repository
2. Select **Deploy to Production** workflow
3. Click **Run workflow**
4. Choose deployment stage (prod, dev)
5. Click **Run workflow**

#### 🚨 Local Production Deployment
For emergency production deployments from local environment:

```bash
# Ensure you're on the production branch
git checkout production

# Set AWS credentials for production
export AWS_PROFILE=taleofddh

# Deploy to production
npm run deploy:prod
```



---

## 🔄 GitHub Actions Workflow

The repository includes a comprehensive CI/CD pipeline with the following jobs:

### 1. 🔍 Setup and Validate
- ✅ Checks out code and sets up Node.js
- ☁️ Configures AWS credentials
- 🔐 Validates AWS access
- 🎯 Determines deployment stage

### 2. 📦 Install Dependencies
- 📥 Installs root dependencies (if package.json exists)
- 🏃 Runs installation script for all Lambda modules
- 💾 Caches node_modules for faster subsequent runs

### 3. 🚀 Deploy Modules
- 🔄 Restores cached dependencies
- ⚡ Installs Serverless Framework
- 🚢 Deploys all modules to specified environment
- 📊 Generates deployment summary

### 4. 📢 Notify Status
- ✅ Sends success/failure notifications
- 📋 Provides deployment details and commit information

#### 🎯 Workflow Triggers

- **🤖 Automatic**: Push to `production` branch
- **🔧 Manual**: Workflow dispatch with stage selection (prod, dev)

---

## 📁 Project Structure

```
taleofddh-api/
├── 🔄 .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Actions CI/CD workflow
├── ⚙️ .kiro/
│   ├── settings/                   # Kiro IDE settings
│   └── specs/                      # Feature specifications
│       └── deployment-automation/  # Deployment automation spec
├── 📜 scripts/
│   ├── deploy.js                   # Deployment automation script
│   ├── install.js                  # Installation automation script
│   └── utils.js                    # Shared utilities for scripts
├── � ‍💼 admin/                       # Admin service
│   ├── handler.js                  # Lambda function handlers
│   ├── package.json               # Module dependencies
│   ├── serverless.yml             # Serverless configuration
│   └── .env                       # Environment variables
├── � auth/  /                      # Authentication service
├── 📝 blog/                        # Blog management service
├── ⚙️ core/                        # Core business logic service
├── � emtail/                       # Email service
├── �️ gaillery/                     # Gallery and media management service
├── 🔗 integration/                 # Third-party integrations service
├── � rlink/                        # Link management service
├── 📝 request/                     # Request handling service
├── 📦 package.json                 # Root package.json with scripts
└── 📖 README.md                    # This documentation
```

### 📦 Module Structure

Each Lambda module follows a consistent structure:

```
module-name/
├── 🔧 handler.js                   # Lambda function handlers
├── 📦 package.json                 # Module-specific dependencies
├── ⚙️ serverless.yml               # Serverless Framework configuration
├── 🔐 .env                         # Environment variables (optional)
├── 📊 data/                        # Sample data and fixtures
├── ☁️ resources/                   # CloudFormation resources
└── 📁 node_modules/                # Installed dependencies
```

---

## 📋 Module Details

### �‍💼 Admtin Service (admin)
- **🎯 Purpose**: Administrative operations and management
- **📦 Dependencies**: @taleofddh/database, @taleofddh/email, @taleofddh/storage, @taleofddh/secret, @taleofddh/response, fast-csv, mailparser
- **✨ Key Features**: Admin APIs, CSV data processing, email integration, secure storage

### � Ahuthentication Service (auth)
- **🎯 Purpose**: User authentication and authorization
- **📦 Dependencies**: @taleofddh/database, @taleofddh/response, fast-csv
- **✨ Key Features**: User management, security, CSV processing

### 📝 Blog Service (blog)
- **🎯 Purpose**: Blog content management
- **📦 Dependencies**: @taleofddh/database, @taleofddh/storage, @taleofddh/response, fast-csv
- **✨ Key Features**: Blog post management, content storage, CSV data import/export

### ⚙️ Core Service (core)
- **🎯 Purpose**: Fundamental application business logic
- **📦 Dependencies**: @taleofddh/array, @taleofddh/response, @taleofddh/storage
- **✨ Key Features**: Core functionality, data processing

### � Email Servnice (email)
- **🎯 Purpose**: Email notifications and processing
- **📦 Dependencies**: @taleofddh/response, @taleofddh/notification, mailparser
- **✨ Key Features**: Email sending, mail parsing, notification integration

### 🖼️ Gallery Service (gallery)
- **🎯 Purpose**: Image gallery and media management
- **📦 Dependencies**: @taleofddh/database, @taleofddh/storage, @taleofddh/distribution, @taleofddh/date, @taleofddh/array, @taleofddh/secret, fast-csv, uuid
- **✨ Key Features**: Image galleries, CloudFront distribution, media storage, CSV data management

### 🔗 Integration Service (integration)
- **🎯 Purpose**: Third-party service integrations
- **✨ Key Features**: Gmail, WhatsApp, Google Drive, and other external API integrations

### 🔗 Link Service (link)
- **🎯 Purpose**: Link management and URL operations
- **📦 Dependencies**: @taleofddh/database, @taleofddh/storage, @taleofddh/response, fast-csv
- **✨ Key Features**: URL shortening, link tracking, CSV data management

### 📝 Request Service (request)
- **🎯 Purpose**: Request processing and management
- **✨ Key Features**: Request lifecycle, processing workflows

---

## 🔐 Role-Based Access (Cognito Groups)

Admin endpoints are authorized by permissions. A user's Cognito groups are their roles. Each service owns a `rolePermissions` table that maps each role to that service's permissions. Adding or changing a role is a data change only, with no code change or deploy. Profile `roles` (auth service) are not used for authorization.

| Endpoint (service)                          | Permission                      |
|---------------------------------------------|---------------------------------|
| `createOrUpdateAlbum` (gallery)             | `gallery:createOrUpdateAlbum`   |
| `album/{name}/{startDateTime}` (gallery)    | `gallery:findAlbum`             |
| `albums` (gallery)                          | `gallery:findAlbums`            |
| `processMessage` (admin)                    | `messages:processStoredMessage` |
| `messageList` (admin)                       | `messages:findMessageList`      |
| `emailMessage` (admin)                      | `messages:getEmailMessage`      |

Each service also has `GET /<service>/permissions` (Cognito authorizer, no permission needed). It returns the signed-in user's permissions in that service, for example `{"permissions": ["gallery:findAlbums"]}`. It is for the UI only: it shows menus, and the endpoints still enforce access. A `*` row comes back scoped to the service (`gallery:*`, `messages:*`), so it never reads as access to another service.

### ⚙ How It Works

1. API Gateway's Cognito user pool authorizer (`cognitoUserPoolAuthorizer`) verifies the token in the `Authorization` header. A missing or invalid token gets a **401** from API Gateway before the Lambda runs.
2. The handler calls `requirePermission(event, '<service>:<action>')` from `@taleofddh/auth`. It reads `cognito:groups` from the verified claims only and looks each group up in the service's own `rolePermissions` table. If none of the caller's roles has the permission (or `*`), the handler returns **403**. Groups with no row in the table, such as `<poolId>_Google`, grant nothing.
3. Who did it comes from `getCaller(event).sub`, never from the request body.

The UI must send the raw **ID token** as the header value (`Authorization: <idToken>`). These methods have no OAuth scopes configured, so API Gateway accepts ID tokens. The ID token is what carries `cognito:groups`.

User pools (account `216439337168`, `eu-west-1`):

| Stage | Pool name                 | Pool ID               |
|-------|---------------------------|-----------------------|
| dev   | `taleofddh-user-pool-dev` | `eu-west-1_Bp47pzJru` |
| prod  | `taleofddh-user-pool`     | `eu-west-1_EV9nheb0T` |

The ARNs live in `custom.userPoolArns` in `admin/serverless.yml` and `gallery/serverless.yml`. You can override them with `USER_POOL_ARN_DEV` / `USER_POOL_ARN_PROD`.

### 🗂 Role Permissions Tables

Authorization is per service, so each service owns `<stage>.taleofddh.<service>.rolePermissions` (partition key `role`, string). Each table holds one item per Cognito group that has access to that service: `{ "role": "<group>", "permissions": ["<service>:<action>", ...] }`. `"*"` grants every permission in that service.

| Table                  | Role              | Seeded permissions                                                       | Seed script                     |
|------------------------|-------------------|--------------------------------------------------------------------------|---------------------------------|
| `gallery.rolePermissions` | `admin`        | `*`                                                                      | `gallery/dataload4.js`          |
|                        | `gallery-manager` | `gallery:createOrUpdateAlbum`, `gallery:findAlbum`, `gallery:findAlbums` |                                 |
| `admin.rolePermissions`   | `admin`        | `*`                                                                      | `admin/dataload.js`             |

- Seed or re-seed: `cd <service> && AWS_PROFILE=taleofddh REGION=eu-west-1 ENVIRONMENT=<stage> node <seed script>` (also run by `dataload.cmd`). The table must exist first; nothing in this repo creates DynamoDB tables. The script upserts the rows above and leaves other rows alone.
- Each service reads its table through `ROLE_PERMISSIONS_TABLE`. An IAM `Deny` makes the table read-only for the service's Lambdas.
- Permissions are cached in each Lambda instance for 5 minutes (`ROLE_PERMISSIONS_CACHE_TTL_SECONDS`), so a table edit can take up to 5 minutes to apply.
- If the table can't be read, that service's admin endpoints return **500** and deny access.

**Adding a new role:** create the Cognito group and add the users. Then put a row in the table of each service the role should use. No code change or deploy is needed.

### 👥 Managing Groups

The groups `admin`, `gallery-manager` and `blog-manager` exist in both pools.

```bash
POOL=eu-west-1_Bp47pzJru   # dev; use eu-west-1_EV9nheb0T for prod

# Create a group
aws cognito-idp create-group --profile taleofddh --region eu-west-1 \
  --user-pool-id "$POOL" --group-name <group>

# Grant a role
aws cognito-idp admin-add-user-to-group --profile taleofddh --region eu-west-1 \
  --user-pool-id "$POOL" --username <username> --group-name <group>

# List a user's groups
aws cognito-idp admin-list-groups-for-user --profile taleofddh --region eu-west-1 \
  --user-pool-id "$POOL" --username <username>
```

Each federated sign-in (Google, Facebook) is a separate user in the pool. To grant a role, add that user to the group as well (for example, `google_<id>`). Cognito also puts federated users in the provider groups it manages, such as `<poolId>_Google`. Those groups show up in `cognito:groups` but grant nothing.

Group changes take effect on the next token refresh (sign out and in again, or wait for the ID token to expire).

### ⏱ Token Lifetime (Optional)

```bash
aws cognito-idp update-user-pool-client --profile taleofddh --region eu-west-1 \
  --user-pool-id "$POOL" --client-id <app-client-id> \
  --id-token-validity 60 --access-token-validity 60 \
  --token-validity-units IdToken=minutes,AccessToken=minutes
```

`update-user-pool-client` resets any setting you leave out to its default. Run `describe-user-pool-client` first and pass the existing settings back in (callback URLs, auth flows, refresh token validity, and so on).

### 🚫 Revoking Access Immediately

```bash
aws cognito-idp admin-remove-user-from-group --profile taleofddh --region eu-west-1 \
  --user-pool-id "$POOL" --username <username> --group-name <group>
aws cognito-idp admin-user-global-sign-out --profile taleofddh --region eu-west-1 \
  --user-pool-id "$POOL" --username <username>
```

Global sign-out revokes refresh tokens. An ID token that was already issued keeps working until it expires, which is why a short ID token lifetime helps.

### 📜 Audit

`CreateGroup`, `AdminAddUserToGroup`, `AdminRemoveUserFromGroup` and `AdminUserGlobalSignOut` are recorded as CloudTrail management events (event source `cognito-idp.amazonaws.com`):

```bash
aws cloudtrail lookup-events --profile taleofddh --region eu-west-1 \
  --lookup-attributes AttributeKey=EventName,AttributeValue=AdminAddUserToGroup
```

### 🚀 Rollout

1. lib release (`@taleofddh/*` 5.2.0, including `@taleofddh/auth` with `requirePermission`)
2. Create the groups and add the owner (dev), then create and seed the gallery and admin `rolePermissions` tables (dev)
3. Deploy `admin` and `gallery` to dev
4. Ship the UI story on dev (send the ID token, menus driven by groups)
5. Verify the acceptance criteria
6. prod
7. IAM clean-up (below)

### 🧹 IAM Clean-up (After the Switch Is Verified)

These roles are not managed in this repo. On the Cognito identity pool **authenticated** roles (dev and prod):

- Remove the `execute-api:Invoke` entries for `admin/*` (`processMessage`, `messageList`, `emailMessage`) and gallery `createOrUpdateAlbum`, `album/*`, `albums`. Also remove their hard-coded identity-ID conditions.
- Remove the `taleofddh-messages` S3 statements if the admin pages only use the API.
- Keep the `execute-api` permissions for the endpoints that are still `aws_iam`: `albumViewCount`, `photoViewCount`, `albumWithMedia`, and the other services' `aws_iam` endpoints.

---

## 🔧 Troubleshooting

### 🚨 Common Issues

#### 1. ☁️ AWS Credentials Not Configured
**❌ Error**: `Unable to locate credentials`

**✅ Solution**:
```bash
# For local development
export AWS_PROFILE=taleofddh
aws configure --profile taleofddh

# Verify credentials
aws sts get-caller-identity
```

#### 2. ⚡ Serverless Framework Not Found
**❌ Error**: `serverless: command not found`

**✅ Solution**:
```bash
npm install -g serverless
```

#### 3. 📦 Module Installation Failures
**❌ Error**: `npm install failed for module X`

**✅ Solutions**:
- Check Node.js version (must be &gt;= 24.0.0)
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Use force installation: `node scripts/install.js --force`

#### 4. 🚀 Deployment Failures
**❌ Error**: Various deployment errors

**✅ Solutions**:
- Verify AWS credentials and permissions
- Check if all dependencies are installed
- Ensure serverless.yml configuration is valid
- Use verbose mode: `serverless deploy --verbose`

#### 5. 🔄 GitHub Actions Failures
**❌ Error**: CI/CD pipeline failures

**✅ Solutions**:
- Check GitHub Secrets are properly configured
- Verify AWS credentials have necessary permissions
- Review workflow logs for specific error messages
- Ensure production branch is up to date

### 🆘 Getting Help

1. **📋 Check the logs**: Use `--verbose` flag for detailed output
2. **✅ Validate environment**: Ensure all prerequisites are installed
3. **🔍 Review configuration**: Check serverless.yml and package.json files
4. **🧪 Test locally**: Deploy individual modules to isolate issues
5. **☁️ Check AWS console**: Verify resources are created correctly

---

## 🤝 Contributing

### 🔄 Development Workflow

1. **🌿 Create a feature branch:**
```bash
git checkout -b feature/your-feature-name
```

2. **✏️ Make your changes** to the relevant Lambda modules

3. **🧪 Test locally:**
```bash
npm run install:all
npm run deploy:dev
```

4. **📤 Commit and push:**
```bash
git add .
git commit -m "Add your feature description"
git push origin feature/your-feature-name
```

5. **🔄 Create a Pull Request** to the main branch

6. **🏭 Production deployment**: Merge to `production` branch for automatic deployment

### 📏 Code Standards

- ✨ Use **ES6+ modules** (type: "module" in package.json)
- 📝 Follow **consistent naming conventions** for modules and functions
- 🛡️ Include **proper error handling** in all Lambda functions
- 🔐 Use **environment variables** for configuration
- 📋 Write **clear commit messages** describing changes
- 🧪 Test changes in **development environment** before production

### ➕ Adding New Modules

1. **📁 Create module directory** with required files:
   - `handler.js` - Lambda function handlers
   - `package.json` - Module dependencies and metadata
   - `serverless.yml` - Serverless Framework configuration

2. **📝 Follow naming conventions**:
   - Module name: `kebab-case`
   - Package name: `module-name-service`
   - Handler functions: `camelCase`

3. **📖 Update documentation** to include the new module

4. **🧪 Test thoroughly** in development environment

---

## ℹ️ Repository Information

| Information | Details |
|-------------|---------|
| 📂 **Repository** | https://github.com/taleofddh/taleofddh-api |
| 🐛 **Issues** | https://github.com/taleofddh/taleofddh-api/issues |
| 👨‍💻 **Author** | Devadyuti Das |
| 🏷️ **Version** | 5.1.0 |
| 🟢 **Node.js** | &gt;= 24.0.0 |
| 📦 **npm** | &gt;= 11.0.0 |

---

<div align="center">

**Made with ❤️ for serverless development**

[![GitHub stars](https://img.shields.io/github/stars/taleofddh/taleofddh-api?style=social)](https://github.com/taleofddh/taleofddh-api/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/taleofddh/taleofddh-api?style=social)](https://github.com/taleofddh/taleofddh-api/network/members)

</div>
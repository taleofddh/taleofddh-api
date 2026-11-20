
# 🚀 Tale of DDH API

**Multi-module serverless Lambda repository with automated deployment scripts and comprehensive CI/CD workflows**

[![Node.js](https://img.shields.io/badge/Node.js-24.0.0+-green.svg)](https://nodejs.org/)
[![Version](https://img.shields.io/badge/Version-5.2.0-orange.svg)](package.json)
[![AWS Lambda](https://img.shields.io/badge/AWS-Lambda-orange.svg)](https://aws.amazon.com/lambda/)
[![Serverless](https://img.shields.io/badge/Serverless-Framework-red.svg)](https://www.serverless.com/)
[![License](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](LICENSE)


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
- [🤖 Album Text Generation (gallery)](#-album-text-generation-gallery)
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
- **✨ Key Features**: Image galleries, CloudFront distribution, media storage, CSV data management, AI-drafted album text (see [Album Text Generation](#-album-text-generation-gallery))

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

## 🔎 SEO Metadata (blog and gallery)

The UI builds static pages, so titles, descriptions, alt text and sitemap dates come from these API fields. All changes are additive: existing fields and response shapes are unchanged.

### Field rules

Plain-text fields are trimmed, have markdown syntax stripped, and are rejected with `400` if they contain HTML, `javascript:`/`data:` URLs, control characters (including newlines) or invisible bidi characters. `description` is markdown: it keeps markdown, but HTML, script URLs and control characters (other than newline and tab) are rejected. The UI must escape markdown on output. A field left out of an update request keeps its stored value; send `""` to clear it.

| Field | Where | Rules |
|---|---|---|
| `summary` | blog, album, level | Meta description. 120 to 160 characters when set. Blog: the UI falls back to `title` when empty. Album: when empty, the public list responses derive it from `description` (markdown stripped, cut at a word boundary, `…` added). |
| `titlePhotoAlt` | blog | Hero image alt text, at most 125 characters. |
| `coverAlt` | album, level | Cover image alt text, at most 125 characters. |
| `description` | album, level | Markdown intro, at most 3,000 characters (was 300). Aim for 150 to 300 words; only the character limit is enforced. |
| `locationLabel` | album | Coarse public location such as "Lake District, England", at most 100 characters. `albumLocation` is unchanged and never returned publicly. |
| `videoCount` | album | Set by the API on save from the protected `videos/` folder. Back-fill with `gallery/dataload5.js --video-count`. |
| `updatedDateTime` | blog, album, level | ISO string set by the API on every create or update. Responses fall back to `endDateTime` when it was never set. |

### Blog

- `findBlog`, `findCategorizedBlogList` and `findHistoricalBlogNames` return `summary`, `titlePhotoAlt` and `updatedDateTime`. `createOrUpdateBlog` validates and stores them, and `blogForEdit` returns them.
- Blog images are public and unsigned. `signedUrl` on blog responses is a plain URL (the name is kept for the UI list module). Use it for `og:image`. The stable format is `<MEDIA_HOST>/public/images/blogs/<category-lower>/<name>/<name>.jpg`, for example `https://media.taleofddh.com/public/images/blogs/travel/cape-town/cape-town.jpg`.

### Gallery: public album data (no sign-in)

`findAlbumHistoricalNames` (`albumHistoricalNames/{category}/{subCategory}/{collection}`) and `findRecentAlbumNames` (`albumRecentNames`) now also return `description`, `summary`, `coverAlt`, `locationLabel`, `videoCount` and `updatedDateTime`. No dedicated teaser endpoint was added: the UI reads the album from its collection list at build time.

- The response is built from an allow-list in `gallery/seo-text.js` (`PUBLIC_ALBUM_FIELDS`), not by spreading the stored item. It never contains `photoList`, `videoList`, signed URLs, `albumLocation`, `titlePhoto`, `searchName`, `id`, `production`, `restrictedFlag` or `defaultFlag`. Only `production = true` albums are returned.
- `signedUrl` is the public, unsigned cover: `<MEDIA_HOST>/public/images/gallery/<category>/<sub-category>/<collection>/<album>.jpg` (slugged).
- `findAlbumWithMedia` stays `aws_iam`. Its cover now uses the same public URL (it used the signed `protected/` cover path, which breaks now that covers are in `public/`). Photos and videos are still listed from `protected/` and signed per file.
- `createOrUpdateAlbum` sets `updatedDateTime` and `videoCount`, validates the new fields and still triggers the rebuild.

### Gallery: level text (category, sub-category, collection)

Table `<stage>.<app>.gallery.galleryLevelMeta` (partition key `level`, sort key `path`; create it before deploying, nothing in this repo creates tables). `level` is `category`, `subCategory` or `collection`. `path` is the slugs joined by `/`, with 1, 2 or 3 parts to match the level, for example `vacations/europe/turkey`. Fields: `title` (required, at most 120 characters), `summary`, `description`, `coverAlt`, `updatedDateTime`. The cover image is the existing `gallery/<path>.jpg`.

| Endpoint | Auth | Notes |
|---|---|---|
| `GET /albumLevelMeta/{level}/{path+}` | none | `path` contains slashes, for example `/albumLevelMeta/collection/vacations/europe/turkey`. 404 when unknown. |
| `GET /albumLevelMetaList` | none | All levels, for build time. |
| `POST /createOrUpdateAlbumLevelMeta` | Cognito + `gallery:createOrUpdateLevelMeta` | Full replace of the item for `level` + `path`. Triggers the rebuild. |

Responses return only `level`, `path`, `title`, `summary`, `description`, `coverAlt`, `updatedDateTime` and `signedUrl` (the public cover URL). Run `gallery/dataload4.js` to give `gallery-manager` the new permission.

### Sitemap dates

Existing shapes are kept; these fields are added. Each value is `updatedDateTime`, falling back to `endDateTime`.

| Endpoint | Added |
|---|---|
| `findBlogCategoryNames` | per category: `updatedDateTime` (latest) and `updatedDateTimes` (one per entry in `names`, same order) |
| `findAlbumCategorySubCategoryCollectionNames` | per collection: `updatedDateTime` (latest) and `updatedDateTimes` (one per entry in `names`) |
| `findAlbumCategorySubCategoryCollections` | per sub-category: `updatedDateTime` (latest) |

### Back-fill

`gallery/dataload5.js` and `blog/dataload3.js`. Dry run is the default and writes nothing.

```
cd gallery
ENVIRONMENT=dev AWS_PROFILE=taleofddh node dataload5.js                    # dry run + report
ENVIRONMENT=dev AWS_PROFILE=taleofddh node dataload5.js --write            # apply
ENVIRONMENT=prod AWS_PROFILE=taleofddh node dataload5.js --write --backup-confirmed
```

It sets `updatedDateTime` from `endDateTime`, stores a derived album `summary` only when the description is at least 120 characters, optionally sets `videoCount` from the protected media folder where missing or different (`--video-count`), then reports albums or blogs missing `summary`, `coverAlt`, `locationLabel` or `titlePhotoAlt`, and lists the most viewed ones (`--top=N`, default 15) for editors to rewrite first. Writing to `prod` is refused without `--backup-confirmed`. Take a backup first: `aws dynamodb create-backup --table-name prod.taleofddh.gallery.gallery --backup-name gallery-pre-seo-backfill`.

### Privacy

Editors must not put family member names, exact addresses or private dates in public fields. `summary`, `description`, `coverAlt`, `locationLabel` and level text all end up in public HTML and JSON.

---

## 🤖 Album Text Generation (gallery)
The gallery manager has a **Generate text** button. A worker Lambda reads the album photos and returns a **draft** of `summary`, `description`, `coverAlt` and `locationLabel`. The editor edits the draft and saves it with the normal `createOrUpdateAlbum`. The worker never writes to the album record. The full story is in `stories/album-text-generation.md`.
### Flow
1. **Offline, unchanged.** The editor syncs photos to `protected/images/gallery/<category>/<subCategory>/<collection>/<name>/` with `aws s3 sync`. Videos go to `protected/videos/gallery/...`.
2. The editor creates or opens the album in the gallery manager and saves it. For a new album, leave **Ready for Production?** unticked on this first save: the album is not public yet, so no Amplify build runs. `createOrUpdateAlbum` starts a build only when the album is production now or was before the save.
3. **Generate text** calls `POST /albumText` (`startAlbumText`). The Lambda checks the Cognito token and the `gallery:generateAlbumText` permission, applies the per-user daily limit, writes a draft with status `running`, publishes one message with `template: "ALBUM_TEXT"` to the SNS topic `taleofddh-genai-<stage>`, and returns `202 { draftId }`. It does not wait.
4. The worker (`generateAlbumText`) is subscribed to that topic for `ALBUM_TEXT` messages only. It reads the album, lists the folder, picks up to 12 photos spread through it, resizes them to a long edge of 1024 px, and makes one Bedrock Converse call. Each photo is sent with its file name in the text before it. It validates the answer, retries once with the error message, runs the privacy scan, and writes the draft to the draft table as `ready` or `failed`.
5. The UI polls `GET /albumText/{name}/{startDateTime}` (`findAlbumTextDraft`) every few seconds.
6. The editor edits the draft, ticks **Ready for Production?** and saves through `createOrUpdateAlbum`, which runs the one Amplify build. That endpoint applies the same length rules and the same privacy patterns, so the generated path and the manual path give the same data.

If the folder has fewer than 3 photos, the draft is `failed` with "No photos found in the album folder. Finish the S3 sync and try again." and no model call is made. A draft that stays `running` for more than 5 minutes is reported as `failed`.
### Where things live
All gallery code is in `gallery/handler.js`, the same as every other service. Shared AWS access comes from the `@taleofddh/*` lib packages.

| What | Where |
|---|---|
| Start and status endpoints (`startAlbumText`, `findAlbumTextDraft`), save-path privacy check in `createOrUpdateAlbum` | `gallery/handler.js` |
| Worker (`generateAlbumText`): routes SNS messages by `template`, runs the pipeline (photos, image resize, model call, validation, privacy scan, draft write, cost estimate) | `gallery/handler.js`, section "Album text worker" |
| Privacy scan, shared by the endpoints and the worker | `gallery/handler.js`, section "Privacy scan" |
| Prompt and prompt version | `gallery/handler.js` (`SYSTEM_PROMPT`, `PROMPT_VERSION`) |
| Text length rules (also used by the worker) | `gallery/seo-text.js` |
| Worker IAM role (`AlbumTextWorkerRole`) | `gallery/serverless.yml`, under `resources:` |
### The `taleofddh-genai` SNS topic (created by hand)
Generation requests go through one shared SNS topic per stage, following the event → integration pattern of `adda-slough-api`: a sender publishes a JSON message with a `template` field, and each subscribed Lambda handles only the templates it knows.

| Stage | Topic | Region |
|---|---|---|
| dev | `taleofddh-genai-dev` | `eu-west-1` |
| prod | `taleofddh-genai-prod` | `eu-west-1` |

- **Both topics were created by hand in the SNS console** (standard topics, no subscriptions). They are **not in any CloudFormation stack**, so deploying or removing a service can never delete them. Do not add them to a stack.
- Services reference a topic by name: `arn:aws:sns:<region>:<account>:taleofddh-genai-<stage>` (`custom.albumText.genaiTopicArn` in `gallery/serverless.yml`; override the base name with `GENAI_TOPIC`).
- **Subscriptions are added by `serverless deploy`**, not by hand. The gallery deploy adds the `generateAlbumText` subscription with a filter policy on the message body, `{"template": ["ALBUM_TEXT"]}`, so the worker is not invoked for other templates. The worker also ignores (and logs) any other template.
- **Message format:**
  ```json
  { "template": "ALBUM_TEXT", "draftId": "...", "name": "...", "startDateTime": "...", "notes": "..." }
  ```
- **Adding another template** (for example blog text): publish to the same topic with a new `template` value, and add a Lambda in the consuming service with an `sns` event on the same ARN and its own filter policy. Each consumer keeps its own role, timeout and limits.
- If a topic is ever recreated by hand, redeploy every subscribed service so its subscription is added again.
### Hosting
- One extra Lambda in the gallery service, `generateAlbumText`: `nodejs24.x`, timeout 300 seconds, memory 2048 MB, its own IAM role. No queue, container, AgentCore or other runtime.
- SNS invokes the worker asynchronously. `maximumRetryAttempts: 0`, so a failed run is never retried and never pays for a second model call. The worker's own single retry with the error message is the only retry. There is no dead-letter queue: a crash marks the draft `failed`, and a draft stuck in `running` is reported as `failed` after 5 minutes.
- `reservedConcurrency: 2`: at most 2 drafts run at once. Requests over the limit are not lost; Lambda keeps throttled asynchronous events and retries them for up to 6 hours. The account's Lambda concurrency limit must leave at least 100 unreserved after this; check with `aws lambda get-account-settings --profile taleofddh --region eu-west-1`.
- Images are resized with Jimp, which is pure JavaScript, so there are no native binaries to match the Lambda runtime.
- All AWS access goes through `@taleofddh/*` 6.0.0: `genai` (Bedrock Converse), `notification` (SNS publish), `database`, `storage`, `secret`. Nothing is billed while no drafts are requested.
### Stages and deployment
Gallery deploys like every other service:
```bash
npm run deploy:dev
npm run deploy:prod
```
or `serverless deploy --stage dev` in `gallery/`. A prompt or worker change is deployed the same way.

Before the first deploy of a stage:
1. The SNS topic `taleofddh-genai-<stage>` and the draft table `<stage>.taleofddh.gallery.albumDraft` must exist (see above and below). Both stages are done.
2. Create the deny list secret `ALBUM_TEXT_DENY_LIST` with a key for the stage, if it does not exist yet (see below).
3. Seed the permission: run `node dataload4.js` in `gallery/` for the stage. `admin` already has `*`; `gallery-manager` gets `gallery:generateAlbumText`.
4. Confirm the model is enabled in `eu-west-1` for the account and that the model, region and inference profile meet the data handling rules. Photos and editor notes go only to this model, in this account and region.
### Configuration
All values have defaults in `gallery/serverless.yml` (`custom.albumText`) and can be set with environment variables at deploy time.

| Setting | Default | Notes |
|---|---|---|
| `BEDROCK_MODEL_ID` | `eu.anthropic.claude-sonnet-4-6` | Inference profile id. Confirm the exact id in the Bedrock console before the first deploy. |
| `BEDROCK_FOUNDATION_MODEL_ID` | `anthropic.claude-sonnet-4-6` | Foundation model behind the profile, for the worker's IAM policy. |
| `GENAI_TOPIC` | `taleofddh-genai` | Base name of the SNS topic; the stage is appended. |
| Region | `eu-west-1` | Same region as the media bucket, the gallery tables and the topic. |
| `ALBUM_TEXT_DAILY_LIMIT` | `20` | Drafts per user per day (`429` after that). |

Per-request caps are set as worker environment variables in `gallery/serverless.yml`: `MAX_PHOTOS` 12, `IMAGE_LONG_EDGE` 1024, `MAX_INPUT_TOKENS` 30000, `MAX_OUTPUT_TOKENS` 1500. There is one retry. The worker also reads `MODEL_INPUT_PRICE_PER_M` (3.3) and `MODEL_OUTPUT_PRICE_PER_M` (16.5), used only for the stored cost estimate.
### Deny list
Names that must never appear in public text (family names) are stored in **one** AWS Secrets Manager secret, `ALBUM_TEXT_DENY_LIST`, in `eu-west-1`. It holds a list per stage, the same pattern as `AMPLIFY_WEBHOOK_URL`, and the endpoints and the worker each read the key matching their stage. It is not in the repo and not on a laptop. A stage's value is a JSON array of names, or one string of names separated by commas or new lines. Create it once:
```bash
aws secretsmanager create-secret --profile taleofddh --region eu-west-1 \
  --name ALBUM_TEXT_DENY_LIST \
  --secret-string '{"dev": ["Name One", "Name Two"], "prod": ["Name One", "Name Two"]}'
```
Update it with `aws secretsmanager put-secret-value` (send the whole object, both stages). Matching ignores case and is on whole words only. The endpoints cache the list for 5 minutes. The worker reads it on every draft and **fails the draft** if the secret cannot be read, is not an object keyed by stage, or has no key for its stage, because a draft without the privacy scan is not safe. The save path (`createOrUpdateAlbum`) falls back to the pattern checks in those cases.
### Draft table (created by hand)
`dev.taleofddh.gallery.albumDraft` and `prod.taleofddh.gallery.albumDraft` were **created by hand with the AWS CLI** and are **not in any stack**, like the other gallery tables. Pay per request, keyed like the album table (`name` partition key, `startDateTime` sort key), DynamoDB TTL on `expiresAt`. To recreate one:
```bash
aws dynamodb create-table --profile taleofddh --region eu-west-1 \
  --table-name dev.taleofddh.gallery.albumDraft \
  --attribute-definitions AttributeName=name,AttributeType=S AttributeName=startDateTime,AttributeType=S \
  --key-schema AttributeName=name,KeyType=HASH AttributeName=startDateTime,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST
aws dynamodb update-time-to-live --profile taleofddh --region eu-west-1 \
  --table-name dev.taleofddh.gallery.albumDraft \
  --time-to-live-specification Enabled=true,AttributeName=expiresAt
```
Each item holds the latest draft for an album: status, model id, prompt version, token counts, estimated cost, warnings and facts to check. Drafts expire after 30 days. The same table holds the per-user daily counters (`name` = `#usage#<user>`, `startDateTime` = the date), which expire after 2 days.
### Budget alarm (created by hand)
A monthly AWS Budgets alarm on the Bedrock model's cost, **created by hand in the console** and **not in any stack**. Email alerts at 80% of actual and 100% of forecast spend. The Lambdas are left out of the filter, because a Lambda filter covers every function in the account; the worker costs about $0.003 a draft.
### Security
- Only users with `gallery:generateAlbumText` can start a draft or read one. Requests without a valid Cognito token are rejected by the API Gateway authorizer.
- The gallery service may publish only to `taleofddh-genai-<stage>` (`sns:Publish` on its ARN).
- The worker's role (`AlbumTextWorkerRole`) allows: list and read on `protected/images/gallery/*` and list on `protected/videos/gallery/*`, `GetItem` on the gallery table, `UpdateItem` on the draft table, `bedrock:InvokeModel` on the one model, `GetSecretValue` on the `ALBUM_TEXT_DENY_LIST` secret, and logs for its own log group. It has no access to `public/`, and it cannot write the gallery table or the bucket.
- Logs hold the album key, status, timings, token counts and warning counts only. `writeLog` in `gallery/handler.js` drops every field that is not on its allow list, so photo content, editor notes and draft text cannot be logged.
### Copying text between stages
To reuse reviewed text in the other stage, open the same album (same name and start date) in the gallery manager there, paste `summary`, `description`, `coverAlt` and `locationLabel`, and save. Do not click **Regenerate**, so no tokens are spent twice.
### Cost
About $0.08 per album, or $0.10 with long editor notes. The model is about 96% of that; the worker Lambda is about $0.003. SNS to Lambda delivery is free. Each draft stores its token counts and `estimatedCostUsd`. Compare the first ten drafts with this estimate.
### Tests
```bash
cd gallery && npm test   # endpoints, helpers, privacy rules, worker routing and pipeline
```
### Verify on dev
1. Confirm the topic, the deny list secret and the model; run `dataload4.js`; deploy dev.
2. Check that the `taleofddh-genai-dev` topic now has one subscription (the `generateAlbumText` Lambda) with the `ALBUM_TEXT` filter policy.
3. Generate drafts for three existing albums. Compare quality and the stored cost with the estimate. Adjust the prompt and bump `PROMPT_VERSION`.
4. Test three new albums, including one with videos and one with a long editor note.
5. Release the gallery form changes to prod first, then deploy prod.
---
## 🔐 Role-Based Access (Cognito Groups)

Admin endpoints are authorized by permissions. A user's Cognito groups are their roles. Each service owns a `rolePermissions` table that maps each role to that service's permissions. Adding or changing a role is a data change only, with no code change or deploy. Profile `roles` (auth service) are not used for authorization.

| Endpoint (service)                          | Permission                      |
|---------------------------------------------|---------------------------------|
| `createOrUpdateAlbum` (gallery)             | `gallery:createOrUpdateAlbum`   |
| `album/{name}/{startDateTime}` (gallery)    | `gallery:findAlbum`             |
| `albums` (gallery)                          | `gallery:findAlbums`            |
| `createOrUpdateAlbumLevelMeta` (gallery)    | `gallery:createOrUpdateLevelMeta` |
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
|                        | `gallery-manager` | `gallery:createOrUpdateAlbum`, `gallery:createOrUpdateLevelMeta`, `gallery:findAlbum`, `gallery:findAlbums` |                                 |
| `admin.rolePermissions`   | `admin`        | `*`                                                                      | `admin/dataload.js`             |
| `blog.rolePermissions` | `admin`           | `*`                                                                      | `blog/dataload2.js`             |
|                        | `blog-manager`    | `blog:createOrUpdateBlog`, `blog:blogForEdit`, `blog:blogTitlePhotoUploadUrl` |                            |

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
| 🏷️ **Version** | 5.2.0 |
| 🟢 **Node.js** | &gt;= 24.0.0 |
| 📦 **npm** | &gt;= 11.0.0 |

---


**Made with ❤️ for serverless development**

[![GitHub stars](https://img.shields.io/github/stars/taleofddh/taleofddh-api?style=social)](https://github.com/taleofddh/taleofddh-api/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/taleofddh/taleofddh-api?style=social)](https://github.com/taleofddh/taleofddh-api/network/members)


### ✍ Blog Management (blog service)
Cognito-protected, `blog-manager` and `admin` only. `admin` has `*`, so it is implied. Send `Authorization: <idToken>`.

| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| POST | `/blog/createOrUpdateBlog` | `blog:createOrUpdateBlog` | Body `mode` (`create`/`update`), `name, title, header, category, author, startDateTime, endDateTime, content` (markdown). Writes `taleofddh-blogs/<Category>/<name>.md`, upserts the record, then calls the Amplify webhook. 409 if a create finds an existing blog, 404 if an update finds none, 400 on invalid input. `startDateTime` is part of the table key and can't change on update. |
| GET | `/blog/permissions` | none (Cognito only) | Returns the caller's blog permissions for the UI, for example `{"permissions": ["blog:*"]}`. |
| GET | `/blog/blogForEdit/{category}/{name}` | `blog:blogForEdit` | Returns `{ blog, markdown }`. |
| POST | `/blog/blogTitlePhotoUploadUrl` | `blog:blogTitlePhotoUploadUrl` | Body `category, name, size` (bytes, max 2 MB). Returns a presigned PUT URL for `public/images/blogs/<category>/<name>/<name>.jpg`, valid 5 minutes. The client must send `Content-Type: image/jpeg` and a body of exactly `size` bytes. |

One Secrets Manager secret, `AMPLIFY_WEBHOOK_URL` (override with `AMPLIFY_WEBHOOK_URL`), holds both stage URLs: `{"dev": "https://...", "prod": "https://..."}`. The Lambda picks the key matching its stage. The gallery service's `createOrUpdateAlbum` uses the same secret to rebuild after a save. If the rebuild call fails, the save still succeeds; the blog response has `rebuildTriggered: false`.

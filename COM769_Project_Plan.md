# COM769 — Scalable Courses Website — Full Project Plan

## Module Info
- **Module:** Scalable Advanced Software Solutions (COM769)
- **Coursework 2 Deadline:** 11th May 2026
- **Professor Demo:** Thursday 1st May 2026
- **Weight:** 75% of module

---

## Approved Concept
A **courses platform** (approved by professor) modelled after the photo/media sharing brief.
- **Instructor** accounts (creators) → upload course videos, images, set metadata
- **Student** accounts (consumers) → browse, enrol, comment, rate courses

---

## Full Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React (Azure Static Web Apps) | Free hosting, built-in CI/CD, scales globally |
| Backend API | .NET (C#) Web API | Developer's expertise |
| Database | Azure Cosmos DB (NoSQL) | Horizontally scalable, global distribution |
| File Storage | Azure Blob Storage | Binary content (videos, images) |
| CDN | Azure CDN | Fast global delivery of blob content |
| Auth | Microsoft Entra External ID | Roles: INSTRUCTOR / STUDENT |
| Containers | Docker + AKS (Azure Kubernetes Service) | Orchestration, autoscaling |
| CI/CD | GitHub Actions | Auto build → push to ACR → deploy to AKS |
| Cognitive | Azure Cognitive Services | Auto-tag images, content moderation |

---

## 5 Advanced Features (for Distinction)

1. 🐳 **Docker + AKS** — containerised API with horizontal pod autoscaling
2. 🔄 **CI/CD Pipeline** — GitHub Actions → Azure Container Registry → AKS
3. 🔐 **Microsoft Entra External ID** — identity with INSTRUCTOR / STUDENT roles
4. 🌐 **Azure CDN** — blob-served media delivered via CDN endpoints
5. 🧠 **Azure Cognitive Services** — image auto-tagging / content moderation

---

## Architecture Overview

```
[Student/Instructor Browser]
         │
         ▼
[Azure Static Web Apps — React]
         │ REST (HTTPS)
         ▼
[AKS — .NET Web API Pods]  ←──  Horizontal Pod Autoscaler
     │            │
     ▼            ▼
[Cosmos DB]   [Azure Blob Storage]
                   │
                   ▼
             [Azure CDN]  →  serves videos/images fast globally

Auth:    Microsoft Entra External ID (JWT tokens, INSTRUCTOR / STUDENT roles)
CI/CD:   GitHub → GitHub Actions → Docker build → ACR → AKS rolling deploy
AI:      Azure Cognitive Services (called from .NET API on upload)
```

---

## Cosmos DB — Single Container Design

- **Container name:** `courses-db`
- **Partition key:** `/pk` (synthetic, constructed per document)
- **Database:** `CoursesApp`

### Document Schemas

#### USER
```json
{
  "id": "user_abc123",
  "pk": "user_abc123",
  "type": "USER",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "INSTRUCTOR",
  "createdAt": "2026-04-27T10:00:00Z"
}
```

#### COURSE
```json
{
  "id": "course_xyz789",
  "pk": "course_xyz789",
  "type": "COURSE",
  "title": "Intro to Azure",
  "description": "Learn Azure from scratch",
  "instructorId": "user_abc123",
  "thumbnailUrl": "https://cdn.example.com/thumb.jpg",
  "tags": ["azure", "cloud"],
  "createdAt": "2026-04-27T10:00:00Z"
}
```

#### VIDEO
```json
{
  "id": "video_001",
  "pk": "course_xyz789",
  "type": "VIDEO",
  "courseId": "course_xyz789",
  "title": "Module 1 - Introduction",
  "blobUrl": "https://storage.blob.core.windows.net/videos/vid001.mp4",
  "cdnUrl": "https://cdn.example.com/videos/vid001.mp4",
  "duration": 320,
  "autoTags": ["cloud", "tutorial"],
  "createdAt": "2026-04-27T10:00:00Z"
}
```

#### COMMENT
```json
{
  "id": "comment_001",
  "pk": "course_xyz789",
  "type": "COMMENT",
  "courseId": "course_xyz789",
  "videoId": "video_001",
  "userId": "user_student01",
  "text": "Really helpful explanation!",
  "createdAt": "2026-04-27T11:00:00Z"
}
```

#### RATING
```json
{
  "id": "rating_001",
  "pk": "course_xyz789",
  "type": "RATING",
  "courseId": "course_xyz789",
  "userId": "user_student01",
  "score": 5,
  "createdAt": "2026-04-27T11:05:00Z"
}
```

#### ENROLMENT
```json
{
  "id": "enrolment_001",
  "pk": "user_student01",
  "type": "ENROLMENT",
  "userId": "user_student01",
  "courseId": "course_xyz789",
  "enrolledAt": "2026-04-27T09:00:00Z"
}
```

### Key Query Patterns
- Get all videos/comments/ratings for a course → single partition query on `pk = course_<id>`
- Get all enrolments for a student → single partition query on `pk = user_<id>`
- List all courses → cross-partition query on `type = COURSE` (acceptable, infrequent)

---

## .NET API — Endpoints

### Auth (Microsoft Entra External ID protected)
All endpoints require a valid JWT Bearer token except public course listing.

### Courses
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/courses` | Public | List all courses |
| GET | `/api/courses/{id}` | Public | Get course details |
| POST | `/api/courses` | INSTRUCTOR | Create course |
| PUT | `/api/courses/{id}` | INSTRUCTOR | Update course |
| DELETE | `/api/courses/{id}` | INSTRUCTOR | Delete course |

### Videos
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/courses/{id}/videos` | STUDENT/INSTRUCTOR | List videos in course |
| POST | `/api/courses/{id}/videos` | INSTRUCTOR | Upload video (blob + metadata) |
| DELETE | `/api/courses/{id}/videos/{videoId}` | INSTRUCTOR | Delete video |

### Comments & Ratings
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/courses/{id}/comments` | Public | Get comments |
| POST | `/api/courses/{id}/comments` | STUDENT | Add comment |
| POST | `/api/courses/{id}/ratings` | STUDENT | Rate course |
| GET | `/api/courses/{id}/ratings` | Public | Get average rating |

### Enrolments
| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/enrolments` | STUDENT | Enrol in course |
| GET | `/api/enrolments/my` | STUDENT | Get my enrolled courses |

### Upload
| Method | Endpoint | Role | Description |
|---|---|---|---|
| POST | `/api/upload/image` | INSTRUCTOR | Upload image to blob, returns CDN URL |
| POST | `/api/upload/video` | INSTRUCTOR | Upload video to blob, returns CDN URL |

---

## .NET Project Structure

```
CoursesPlatform/
├── CoursesPlatform.API/
│   ├── Controllers/
│   │   ├── CoursesController.cs
│   │   ├── VideosController.cs
│   │   ├── CommentsController.cs
│   │   ├── RatingsController.cs
│   │   ├── EnrolmentsController.cs
│   │   └── UploadController.cs
│   ├── Models/
│   │   ├── Course.cs
│   │   ├── Video.cs
│   │   ├── Comment.cs
│   │   ├── Rating.cs
│   │   ├── Enrolment.cs
│   │   └── AppUser.cs
│   ├── Services/
│   │   ├── CosmosDbService.cs
│   │   ├── BlobStorageService.cs
│   │   ├── CdnService.cs
│   │   └── CognitiveService.cs
│   ├── Middleware/
│   │   └── AuthMiddleware.cs
│   ├── appsettings.json
│   ├── Program.cs
│   └── Dockerfile
├── CoursesPlatform.Frontend/   ← React app
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── CourseDetail.jsx
│   │   │   ├── InstructorDashboard.jsx
│   │   │   └── Login.jsx
│   │   ├── components/
│   │   │   ├── CourseCard.jsx
│   │   │   ├── VideoPlayer.jsx
│   │   │   ├── CommentSection.jsx
│   │   │   └── RatingStars.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   └── App.jsx
│   └── staticwebapp.config.json
├── k8s/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── hpa.yaml
└── .github/
    └── workflows/
        └── deploy.yml
```

---

## Docker Setup

### Dockerfile (API)
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["CoursesPlatform.API/CoursesPlatform.API.csproj", "CoursesPlatform.API/"]
RUN dotnet restore "CoursesPlatform.API/CoursesPlatform.API.csproj"
COPY . .
WORKDIR "/src/CoursesPlatform.API"
RUN dotnet build -c Release -o /app/build

FROM build AS publish
RUN dotnet publish -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "CoursesPlatform.API.dll"]
```

---

## AKS — Kubernetes Configs

### deployment.yaml
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: courses-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: courses-api
  template:
    metadata:
      labels:
        app: courses-api
    spec:
      containers:
      - name: courses-api
        image: <ACR_NAME>.azurecr.io/courses-api:latest
        ports:
        - containerPort: 8080
        env:
        - name: CosmosDb__ConnectionString
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: cosmos-connection
        - name: BlobStorage__ConnectionString
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: blob-connection
```

### hpa.yaml (Horizontal Pod Autoscaler)
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: courses-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: courses-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## CI/CD — GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy to AKS

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Login to Azure
      uses: azure/login@v1
      with:
        creds: ${{ secrets.AZURE_CREDENTIALS }}

    - name: Build and push Docker image
      run: |
        az acr build \
          --registry ${{ secrets.ACR_NAME }} \
          --image courses-api:${{ github.sha }} \
          --file CoursesPlatform.API/Dockerfile .

    - name: Set AKS context
      uses: azure/aks-set-context@v3
      with:
        resource-group: ${{ secrets.AKS_RESOURCE_GROUP }}
        cluster-name: ${{ secrets.AKS_CLUSTER_NAME }}

    - name: Deploy to AKS
      run: |
        kubectl set image deployment/courses-api \
          courses-api=${{ secrets.ACR_NAME }}.azurecr.io/courses-api:${{ github.sha }}
```

---

## Azure Resources Checklist

- [ ] Resource Group: `courses-platform-rg`
- [ ] Cosmos DB Account (serverless tier — free friendly)
- [ ] Storage Account + Blob Container (`videos`, `images`)
- [ ] Azure CDN Profile + Endpoint (pointed at blob)
- [ ] Azure Container Registry (ACR) — Basic tier
- [ ] AKS Cluster — 1 node (free tier eligible)
- [ ] Microsoft Entra External ID Tenant
- [ ] Azure Static Web Apps (React frontend)
- [ ] Azure Cognitive Services (Computer Vision — free tier S0)

---

## 3-Day Sprint Plan

### Monday (Today) — API + Database
- [ ] Create .NET Web API project
- [ ] Set up Cosmos DB on Azure (serverless)
- [ ] Implement CosmosDbService.cs
- [ ] Build Course, Video, Comment, Rating, Enrolment models
- [ ] Implement all API controllers
- [ ] Test all endpoints with Swagger locally

### Tuesday — Storage + Docker + Deploy
- [ ] Set up Azure Blob Storage containers
- [ ] Implement BlobStorageService.cs + UploadController
- [ ] Set up Azure CDN pointed at blob
- [ ] Wire CDN URLs into Video documents
- [ ] Write Dockerfile, build + test locally
- [ ] Create ACR, AKS cluster on Azure
- [ ] Deploy API to AKS — live URL working

### Wednesday — React + Cognitive Services + Polish
- [ ] Scaffold React app (Vite)
- [ ] Build pages: Home, CourseDetail, InstructorDashboard, Login
- [ ] Connect React to live API
- [ ] Add Azure Cognitive Services call on image upload (auto-tags)
- [ ] Deploy React to Azure Static Web Apps
- [ ] Set up GitHub Actions CI/CD pipeline
- [ ] End-to-end test full flow
- [ ] Prep Thursday demo flow

---

## Microsoft Entra External ID Setup Notes (post-Thursday)
- Create Entra External ID tenant (separate from main subscription)
- Register app, define `INSTRUCTOR` and `STUDENT` custom user attributes
- Use sign-up/sign-in user flow
- Protect .NET API with `[Authorize(Roles = "INSTRUCTOR")]` and `[Authorize(Roles = "STUDENT")]`
- Use MSAL.js in React for token acquisition

---

## Presentation Slide Outline (12 slides)

| Slide | Content |
|---|---|
| 0 | Title — project name, your name, student number |
| 1-2 | Problem: why does a courses platform need to scale? Traffic spikes, global users, large media files |
| 3-6 | Technical solution: architecture diagram, Cosmos DB design, AKS setup, CDN flow |
| 7-8 | Advanced features: Docker/AKS, CI/CD, Entra External ID, CDN, Cognitive Services |
| 9-10 | Limitations: single AKS node in demo, no caching layer yet, cost at scale |
| 11 | Video demo (5 min) — show live app, AKS pods, blob upload, CDN delivery |
| 12 | Concluding comments |
| 13 | References (IEEE format) |

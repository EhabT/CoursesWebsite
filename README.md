# 🎓 Courses Platform

A **scalable, cloud-native courses platform** built for COM769 — Scalable Advanced Software Solutions.

Instructors create courses and upload video content; students browse, enrol, comment, and rate courses — all powered by a horizontally scalable microservices architecture on Azure.

---

## 🏗 Architecture

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

Auth:    Microsoft Entra External ID (JWT, INSTRUCTOR / STUDENT roles)
CI/CD:   GitHub → GitHub Actions → Docker build → ACR → AKS rolling deploy
AI:      Azure Cognitive Services (auto-tagging on image upload)
```

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) — Azure Static Web Apps |
| Backend API | .NET (C#) Web API |
| Database | Azure Cosmos DB (NoSQL, single-container design) |
| File Storage | Azure Blob Storage |
| CDN | Azure CDN |
| Auth | Microsoft Entra External ID |
| Containers | Docker + AKS (Azure Kubernetes Service) |
| CI/CD | GitHub Actions → ACR → AKS |
| AI | Azure Cognitive Services (Computer Vision) |

---

## ⭐ Advanced Features

1. 🐳 **Docker + AKS** — containerised API with horizontal pod autoscaling (2→10 pods)
2. 🔄 **CI/CD Pipeline** — GitHub Actions → Azure Container Registry → AKS rolling deploy
3. 🔐 **Microsoft Entra External ID** — JWT identity with INSTRUCTOR / STUDENT roles
4. 🌐 **Azure CDN** — blob-served media delivered via CDN edge endpoints
5. 🧠 **Azure Cognitive Services** — auto-tags images on upload using Computer Vision

---

## 📁 Project Structure

```
CoursesWebsite/
├── CoursesPlatform.API/        ← .NET Web API
│   ├── Controllers/            ← 6 REST controllers
│   ├── Models/                 ← Cosmos DB document models + DTOs
│   ├── Services/               ← CosmosDb, BlobStorage, CDN, Cognitive
│   ├── Program.cs              ← DI, auth, middleware
│   ├── Dockerfile              ← Multi-stage Docker build
│   └── appsettings.json        ← Azure service configuration
├── CoursesPlatform.Frontend/   ← React (Vite)
│   ├── src/pages/              ← Home, CourseDetail, Dashboard, Login
│   ├── src/components/         ← CourseCard, VideoPlayer, Comments, Ratings
│   └── src/services/api.js     ← Centralised API client
├── k8s/                        ← Kubernetes manifests
│   ├── deployment.yaml         ← Pods, health probes, secrets
│   ├── service.yaml            ← LoadBalancer
│   └── hpa.yaml                ← Horizontal Pod Autoscaler
└── .github/workflows/
    └── deploy.yml              ← CI/CD pipeline
```

---

## 🚀 Getting Started

### Prerequisites
- .NET 10.0 SDK
- Node.js 18+
- Docker Desktop
- Azure subscription (for cloud services)

### Run Locally

**Backend:**
```bash
cd CoursesPlatform.API
dotnet run
```

**Frontend:**
```bash
cd CoursesPlatform.Frontend
npm install
npm run dev
```

**Docker:**
```bash
docker build -t courses-api:latest -f CoursesPlatform.API/Dockerfile .
docker run -p 8080:8080 courses-api:latest
```

---

## 📡 API Endpoints

| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/api/courses` | Public | List all courses |
| GET | `/api/courses/{id}` | Public | Get course details |
| POST | `/api/courses` | INSTRUCTOR | Create course |
| PUT | `/api/courses/{id}` | INSTRUCTOR | Update course |
| DELETE | `/api/courses/{id}` | INSTRUCTOR | Delete course |
| GET | `/api/courses/{id}/videos` | Auth | List videos |
| POST | `/api/courses/{id}/videos` | INSTRUCTOR | Upload video |
| GET | `/api/courses/{id}/comments` | Public | Get comments |
| POST | `/api/courses/{id}/comments` | STUDENT | Add comment |
| GET | `/api/courses/{id}/ratings` | Public | Get average rating |
| POST | `/api/courses/{id}/ratings` | STUDENT | Rate course |
| POST | `/api/enrolments` | STUDENT | Enrol in course |
| GET | `/api/enrolments/my` | STUDENT | My enrolments |
| POST | `/api/upload/image` | INSTRUCTOR | Upload image (+ AI tags) |
| POST | `/api/upload/video` | INSTRUCTOR | Upload video |

---

## 📄 License

This project was built for academic purposes as part of COM769 coursework.

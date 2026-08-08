# Student Recruitment Portal (SRP)

> **A secure, scalable, and AI-powered Student Recruitment & Placement Management Platform**

The **Student Recruitment Portal (SRP)** is a collaborative software development initiative designed to streamline the campus recruitment and placement ecosystem by providing a centralized platform for **students, CCD administrators, Student Coordinators, Associates, and the TPO Head**.

The platform aims to replace fragmented and manual placement workflows with a **secure, automated, scalable, and intelligent recruitment management system** covering the complete journey from student profile verification to job application, recruitment rounds, notifications, and final placement.

---

## 🎯 Vision

To build a modern recruitment infrastructure that enables:

* Students to maintain a verified digital placement profile.
* CCD to efficiently manage companies, job postings, eligibility, and recruitment rounds.
* Coordinators to manage applicant lists and recruitment stages.
* Automated systems to eliminate repetitive manual operations.
* AI to assist students and administrators with decision-making and support.
* The platform to remain reliable during high-traffic placement activities.

> **One Platform. One Verified Profile. One Seamless Recruitment Journey.**

---

## 👥 Development Team

SRP is being developed as a **Hybrid SE–TE Student Development Team**, bringing together students from Second Year and Third Year to encourage:

* Cross-year collaboration
* Technical knowledge sharing
* Peer mentorship
* Leadership development
* Real-world software engineering practices
* Collaborative system design

The team follows a modular development approach where members can contribute across different technical domains.

---

# 🏗️ System Overview

```text
                         ┌─────────────────────┐
                         │       USERS         │
                         │                     │
                         │ Students            │
                         │ Admins              │
                         │ Coordinators        │
                         │ Associates           │
                         │ TPO Head            │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Web Applications  │
                         │ React + TypeScript  │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   API Gateway       │
                         │ Routing / Security  │
                         │ Rate Limiting       │
                         └──────────┬──────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
             ▼                      ▼                      ▼
      Authentication          Student Services       Job Services
        Service                   │                      │
             │                    │                      │
             └────────────────────┼──────────────────────┘
                                  │
             ┌────────────────────┼──────────────────────┐
             │                    │                      │
             ▼                    ▼                      ▼
       Application          Verification             AI Services
         Service               Service                   │
             │                    │                      │
             └────────────────────┼──────────────────────┘
                                  │
                                  ▼
                           RabbitMQ Event Bus
                                  │
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
          OCR Worker         Excel Worker       Notification
                                                    Workers
                                  │
                                  ▼
              ┌───────────────────────────────────────┐
              │             DATA LAYER                │
              │                                       │
              │ PostgreSQL │ Redis │ Elasticsearch   │
              │              S3 / MinIO               │
              └───────────────────────────────────────┘
```

---

# 🚀 Core Modules

## 1. Student Portal

The Student Portal acts as the student's central recruitment workspace.

### Student Profile

Students can maintain:

* Personal information
* Academic information
* Department / branch
* CGPA
* SGPA
* Active backlogs
* Placement status
* Verified profile information

### Digital Academic Vault

Students can upload and manage:

* 10th-grade marksheet
* 12th-grade marksheet
* Semester-wise marksheets
* SGPA / CGPA records
* Supporting academic documents

Each document follows a verification workflow.

### Resume Repository

Students can maintain multiple resume versions for different opportunities.

Example:

```text
Student
   │
   ├── Software Engineering Resume
   ├── Data Science Resume
   ├── Product Management Resume
   └── General Resume
```

### Job Applications

Students can:

* Browse active job postings
* View CTC
* View Job Description
* View stipend
* View employment duration
* Check eligibility
* Apply with a verified profile
* Track recruitment rounds
* Receive notifications

---

# 🏢 2. CCD Admin Command Center

The Admin Portal provides centralized control over the recruitment ecosystem.

### Job Management

Admins can:

* Create company profiles
* Create job postings
* Define eligibility criteria
* Configure application deadlines
* Define required documents
* Configure recruitment rounds

### Student Verification

Admins can review:

* Academic documents
* Resumes
* Profile information
* Verification requests

Possible status:

```text
DRAFT
  ↓
SUBMITTED
  ↓
PENDING_VERIFICATION
  ↓
VERIFIED
  ↓
REJECTED
  ↓
RESUBMITTED
```

### Recruitment Management

Admins and Coordinators can manage:

```text
Applied
   ↓
Shortlisted
   ↓
Round 1
   ↓
Round 2
   ↓
Technical Interview
   ↓
HR Interview
   ↓
Offered
   ↓
Accepted
```

---

# ⚙️ 3. Intelligent Eligibility Engine

A major component of SRP is automated eligibility verification.

The system evaluates:

* Minimum CGPA
* Maximum active backlogs
* 10th percentage
* 12th percentage
* Department / branch
* Graduation year
* Required skills
* Required documents
* Placement status

### Example

```text
Job Requirement

CGPA >= 8.0
Backlogs = 0
Branch = EXTC / COMP / CSE
Graduation Year = 2027

              ↓

Student Profile

CGPA = 8.7
Backlogs = 0
Branch = EXTC
Graduation Year = 2027

              ↓

             ELIGIBLE
```

Once a student is verified and satisfies all configured criteria, the application process can be reduced to a **one-click application workflow**.

---

# 🤖 AI Integration

AI is designed as an assistance and automation layer rather than the authority for critical placement decisions.

## AI Capabilities

### Resume Analysis

```text
Resume
   ↓
Document Parser
   ↓
Skill Extraction
   ↓
Experience Extraction
   ↓
Embedding Generation
   ↓
Job Description Comparison
```

### Skill Gap Analysis

The system can identify:

* Matching skills
* Missing skills
* Relevant experience
* Recommended improvements
* Job-specific preparation areas

### AI Placement Assistant

Students can interact with an AI assistant for:

* Placement FAQs
* Application guidance
* Profile-related questions
* Resume suggestions
* Skill recommendations
* Interview preparation

### RAG-Based Support

```text
Student Question
       ↓
Intent Detection
       ↓
Knowledge Retrieval
       ↓
Relevant CCD Documents
       ↓
LLM
       ↓
Grounded Response
       ↓
Confidence Check
       ↓
Human Escalation if Required
```

The knowledge base can contain:

* Placement policies
* CCD guidelines
* Recruitment instructions
* FAQs
* Company-specific instructions
* Official notifications

---

# 📊 Dynamic Applicant Filtering

CCD personnel need to generate highly specific applicant lists.

Example:

> Students with CGPA > 8.0, no active backlogs, Spring Boot skills, and not yet placed.

SRP uses a dynamic filtering layer instead of constructing inefficient database queries for every request.

### Optimization Techniques

* Proper relational schema
* Composite indexes
* Query optimization
* Pagination
* Connection pooling
* Redis caching
* Elasticsearch for advanced search
* Read replicas for read-heavy workloads

---

# 📚 Academic Data Pipeline

Academic information is one of the major operational bottlenecks.

SRP supports a scalable data-processing workflow.

```text
COE Excel File
      ↓
File Upload
      ↓
Validation
      ↓
Background Processing
      ↓
Excel Worker
      ↓
Chunk Processing
      ↓
Student Matching
      ↓
Data Validation
      ↓
PostgreSQL
      ↓
Audit Log
```

Large Excel files are processed asynchronously through workers rather than blocking the administrator's browser request.

---

# 🔔 Notification System

SRP provides centralized communication through:

* In-app notifications
* Email
* SMS
* Push notifications

### Architecture

```text
Admin / System Event
        ↓
Notification Service
        ↓
RabbitMQ
        ↓
Worker Pool
   ┌────┼────┐
   ↓    ↓    ↓
 Email SMS Push
```

The notification system supports:

* Retry mechanisms
* Delivery tracking
* Dead-letter queues
* Priority notifications
* Audit logging

---

# 🎫 Support & Dispute Resolution

Students can raise support tickets for issues such as:

* Profile verification
* Academic record discrepancies
* Resume verification
* Application issues
* Eligibility disputes
* Recruitment-round issues

### Ticket Workflow

```text
Student
   ↓
AI Assistant
   ↓
Resolved?
 ┌─┴─┐
Yes  No
 ↓    ↓
Close  Create Ticket
          ↓
     Admin Queue
          ↓
     Human Resolution
```

AI handles repetitive queries while complex or sensitive cases are escalated to CCD personnel.

---

# 📅 Pre-Placement Event Management

SRP can manage:

* Company talks
* Pre-placement sessions
* Technical sessions
* Workshops
* Skill-building events

The architecture is designed to handle sudden traffic spikes when registration opens.

### High-Traffic RSVP

```text
800 Students
     ↓
Load Balancer
     ↓
Multiple API Containers
     ↓
Redis Atomic Slot Management
     ↓
Registration Service
     ↓
PostgreSQL
```

Redis-based atomic operations help prevent double-booking during concurrent registration requests.

---

# 🔐 Security Architecture

Security is a core requirement of SRP.

### Authentication

* OAuth 2.0 / OpenID Connect
* JWT-based access tokens
* Refresh tokens
* Optional MFA
* Secure session management

### Authorization

Role-Based Access Control:

```text
Student
Admin
Coordinator
Associate
TPO Head
```

Each role receives only the permissions required for its responsibilities.

### Application Security

* HTTPS / TLS
* Password hashing
* Input validation
* SQL injection prevention
* XSS protection
* CSRF protection
* Rate limiting
* API throttling
* Secure file uploads
* Malware scanning
* Audit logging

### Document Security

Sensitive documents such as marksheets and resumes are stored using object storage with controlled access and signed URLs.

---

# 🗄️ Data Architecture

## Primary Database

**PostgreSQL**

Used for transactional data.

Major entities include:

```text
Users
Roles
Students
AcademicRecords
Marksheets
Resumes
Companies
Jobs
EligibilityCriteria
Applications
RecruitmentRounds
RoundResults
Notifications
Tickets
Events
VerificationRequests
AuditLogs
```

## Redis

Used for:

* Caching
* Session data
* Rate limiting
* Temporary locks
* RSVP slot management
* Frequently accessed data

## Elasticsearch

Used for:

* Student search
* Job search
* Applicant filtering
* Full-text search
* Analytics-related search workloads

## Object Storage

AWS S3 / MinIO can store:

* Resumes
* Marksheets
* Documents
* Excel files
* Other recruitment artifacts

---

# 🐳 Docker Architecture

Every major backend component can be independently containerized.

```text
Docker Environment

├── Frontend
├── API Gateway
├── Authentication Service
├── Student Service
├── Job Service
├── Eligibility Service
├── Application Service
├── Verification Service
├── Resume Service
├── Notification Service
├── Support Service
├── AI Service
├── PostgreSQL
├── Redis
├── RabbitMQ
├── Elasticsearch
└── MinIO / S3
```

Benefits:

* Service isolation
* Reproducible environments
* Independent deployments
* Horizontal scaling
* Easier development
* Fault isolation

---

# ☸️ Kubernetes & Scaling

For production deployment, containerized services can be orchestrated using Kubernetes.

### Horizontal Scaling

```text
Normal Traffic
      ↓
2 API Pods

High Traffic
      ↓
5 API Pods

Placement Spike
      ↓
10+ API Pods
```

Services can independently scale based on:

* CPU utilization
* Memory utilization
* Request rate
* Response latency
* Queue length

### High-Traffic Components

Special attention is given to:

* Application Service
* Notification Service
* Event Registration
* AI Service
* Resume Processing

---

# 📨 Event-Driven Architecture

RabbitMQ acts as the asynchronous communication layer.

Example:

```text
Student Applies
      ↓
Application Service
      ↓
Application Created
      ↓
ApplicationSubmitted Event
      ↓
RabbitMQ
      ├── Notification Worker
      ├── Analytics Worker
      ├── Data Packaging Worker
      └── AI Recommendation Worker
```

This prevents long-running tasks from blocking the main application request.

---

# 🛡️ Fault Tolerance

SRP is designed around graceful degradation.

### Database Failure

* Read replicas
* Connection retries
* Database failover
* Transaction rollback

### RabbitMQ Failure

* Persistent messages
* Retry mechanisms
* Dead-letter queues

### Redis Failure

Critical operations fall back to the transactional database where appropriate.

### AI Service Failure

The core recruitment workflow continues using deterministic business rules.

### Notification Failure

Messages are queued and retried instead of being lost.

---

# 📈 Observability

The platform should provide centralized monitoring across services.

### Metrics

**Prometheus**

Tracks:

* CPU
* Memory
* Request rate
* Latency
* Error rate
* Queue length

### Dashboards

**Grafana**

Provides real-time operational dashboards.

### Logging

**ELK Stack**

```text
Services
   ↓
Centralized Logs
   ↓
Elasticsearch
   ↓
Kibana
```

### Distributed Tracing

Tracing can be introduced to identify latency across microservices and asynchronous workflows.

---

# 🔄 CI/CD

Development workflow:

```text
Developer
    ↓
Git Repository
    ↓
Pull Request
    ↓
Code Review
    ↓
Automated Tests
    ↓
Build
    ↓
Docker Image
    ↓
Container Registry
    ↓
Deployment
    ↓
Kubernetes
```

Recommended checks:

* Unit Tests
* Integration Tests
* API Tests
* Security Scanning
* Docker Image Scanning
* Code Quality Checks

---

# 🧩 Suggested Repository Structure

```text
SRP/
│
├── frontend/
│   ├── student-portal/
│   ├── admin-portal/
│   └── coordinator-portal/
│
├── backend/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── student-service/
│   ├── job-service/
│   ├── eligibility-service/
│   ├── application-service/
│   ├── verification-service/
│   ├── resume-service/
│   ├── notification-service/
│   ├── support-service/
│   └── analytics-service/
│
├── ai/
│   ├── resume-parser/
│   ├── recommendation-engine/
│   ├── rag-service/
│   └── skill-gap-analysis/
│
├── infrastructure/
│   ├── docker/
│   ├── kubernetes/
│   ├── nginx/
│   └── monitoring/
│
├── database/
│   ├── migrations/
│   ├── schemas/
│   └── seed-data/
│
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── database/
│   ├── diagrams/
│   └── workflows/
│
├── tests/
│
├── .github/
│   └── workflows/
│
├── docker-compose.yml
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

---

# 🛠️ Technology Stack

| Layer          | Technology                 |
| -------------- | -------------------------- |
| Frontend       | React + TypeScript         |
| UI             | Tailwind CSS / Material UI |
| Backend        | Spring Boot / Java         |
| API            | REST / WebSocket           |
| Authentication | OAuth2 / JWT / RBAC        |
| Database       | PostgreSQL                 |
| Cache          | Redis                      |
| Message Broker | RabbitMQ                   |
| Search         | Elasticsearch              |
| Object Storage | S3 / MinIO                 |
| AI             | LLM + RAG                  |
| Containers     | Docker                     |
| Orchestration  | Kubernetes                 |
| Reverse Proxy  | Nginx                      |
| Monitoring     | Prometheus + Grafana       |
| Logging        | ELK Stack                  |
| CI/CD          | GitHub Actions             |

---

# 🗺️ Development Roadmap

## Phase 1 — Foundation

* Repository setup
* Project architecture
* Authentication
* RBAC
* Database schema
* CI/CD foundation

## Phase 2 — Student Portal

* Student profiles
* Academic records
* Document management
* Resume repository
* Verification workflow

## Phase 3 — Recruitment Engine

* Company management
* Job postings
* Eligibility engine
* Applications
* Recruitment rounds

## Phase 4 — Admin & Coordinator Portal

* Verification dashboard
* Applicant filtering
* Recruitment management
* Analytics
* Notifications

## Phase 5 — AI Integration

* Resume parser
* Skill-gap analysis
* AI assistant
* RAG knowledge base
* Recommendations

## Phase 6 — Scale & Reliability

* Redis
* RabbitMQ
* Background workers
* Docker
* Kubernetes
* Monitoring
* Load testing

---

# 🤝 Contribution Guidelines

All contributors are expected to follow a structured development workflow.

```text
Create Issue
     ↓
Create Feature Branch
     ↓
Implement
     ↓
Write Tests
     ↓
Commit
     ↓
Pull Request
     ↓
Code Review
     ↓
Merge
```

### Branch Naming

```text
feature/<feature-name>
fix/<issue-name>
docs/<documentation-name>
refactor/<module-name>
```

### Commit Convention

```text
feat: add student verification workflow
fix: resolve application eligibility issue
docs: update architecture documentation
refactor: optimize applicant filtering
test: add application service tests
chore: update dependencies
```

---

# 👨‍💻 Team Collaboration

The SRP team follows a **hybrid SE–TE collaboration model**.

Responsibilities can be distributed across:

### Frontend Team

* UI/UX
* Student portal
* Admin portal
* Coordinator portal

### Backend Team

* APIs
* Business logic
* Microservices
* Authentication

### Database Team

* Schema design
* Query optimization
* Indexing
* Data migrations

### AI Team

* RAG
* Resume processing
* Skill analysis
* Recommendations

### DevOps Team

* Docker
* CI/CD
* Kubernetes
* Monitoring

### Security & QA Team

* Security testing
* API testing
* Vulnerability assessment
* Performance testing

---

# 📐 Engineering Principles

SRP follows these core principles:

* **Security by Design**
* **Scalability by Design**
* **Modular Architecture**
* **API-First Development**
* **Event-Driven Processing**
* **Least-Privilege Access**
* **Data Integrity**
* **Observability**
* **Fault Tolerance**
* **Automation First**

---

# 🌟 Expected Impact

### For Students

* One verified recruitment profile
* Faster applications
* Transparent recruitment tracking
* AI-powered guidance
* Reduced repetitive queries

### For CCD

* Reduced manual workload
* Automated eligibility checking
* Centralized recruitment management
* Better applicant analytics
* Faster communication

### For Coordinators

* Dynamic applicant filtering
* Simplified round management
* Real-time recruitment updates
* Automated notifications

### For the Institution

* Centralized placement data
* Better operational visibility
* Scalable recruitment infrastructure
* Reduced dependency on spreadsheets and manual workflows

---

# 📊 Success Metrics

The project can be evaluated using:

* Application processing time
* Profile verification turnaround time
* Notification delivery rate
* API response latency
* System uptime
* Concurrent-user capacity
* Query performance
* AI response accuracy
* Ticket resolution time
* Reduction in manual administrative work

---

# 🔮 Future Scope

Potential future extensions include:

* Advanced placement analytics
* Predictive placement insights
* Automated interview scheduling
* AI mock interviews
* Company-student recommendation engine
* Alumni mentorship integration
* Advanced fraud detection
* Mobile application
* Institutional placement analytics
* Multi-institution deployment

---

# 📄 Documentation

Detailed documentation will be maintained under:

```text
/docs
```

including:

* System Architecture
* API Documentation
* Database Design
* ER Diagrams
* Sequence Diagrams
* Deployment Architecture
* Security Architecture
* AI Architecture
* Development Guidelines

---

# 📜 Project Status

> 🚧 **Under Active Development**

The architecture and modules are being developed incrementally by the SRP Hybrid SE–TE Development Team.

---

# 🏆 Project Philosophy

> **Build for students. Engineer for scale. Secure by design. Automate intelligently.**

---

## Student Recruitment Portal

**Designed & Developed by the SRP Development Team**

**SE × TE — Collaboration • Innovation • Engineering**

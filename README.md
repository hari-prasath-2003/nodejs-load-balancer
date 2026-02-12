# 🚀 Distributed HTTP Load Balancer


> A production-grade Layer 7 HTTP load balancer built with Node.js, featuring distributed state management, health monitoring, and horizontal scalability.

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active%20Development-brightgreen" alt="Status">
  <img src="https://img.shields.io/badge/PRs-Welcome-blue" alt="PRs Welcome">
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Roadmap](#-roadmap)
- [Performance](#-performance)
- [Learning Outcomes](#-learning-outcomes)
- [Contributing](#-contributing)

---

## 🎯 Overview

This project implements a **custom HTTP load balancer** designed to distribute incoming traffic across multiple backend service instances with intelligent routing, fault tolerance, and real-time health monitoring.

### Why This Project?

Built to gain hands-on experience with:

- ⚡ **Distributed Systems** - Understanding traffic distribution and service orchestration
- 🔄 **Concurrency Patterns** - Multi-process architecture using Node.js clustering
- 🗄️ **State Management** - Shared routing state with Redis
- 🐳 **Container Orchestration** - Docker-based deployment
- 📊 **Observability** - Runtime monitoring and health checks

---

## ✨ Key Features

### ✅ Implemented

| Feature | Description |
|---------|-------------|
| **Round-Robin Routing** | Evenly distributes requests across healthy backend instances |
| **HTTP Proxying** | Transparent request/response forwarding using Node.js HTTP module |
| **Multi-Process Scaling** | Leverages Node.js Cluster API for CPU-core utilization |
| **Distributed State** | Redis-backed routing state shared across worker processes |
| **Containerized Deployment** | Docker Compose setup for reproducible environments |

### 🚧 In Progress

- **Active Health Checks** - Periodic backend availability monitoring with automatic failover
- **Monitoring Dashboard** - Real-time visualization of traffic, routing state, and instance health
- **Metrics Collection** - Request latency, throughput, and error rate tracking

---

## 🏗️ Architecture

```
┌─────────────────┐
│  Client Request │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│   Load Balancer         │
│  ┌─────────────────┐    │
│  │  Master Process │    │
│  └────────┬────────┘    │
│           │             │
│  ┌────────┴────────┐    │
│  │   Worker Pool   │    │
│  │  (Node Cluster) │◄───┼──► Redis (Shared State)
│  └────────┬────────┘    │
│           │             │
└───────────┼─────────────┘
            │
     ┌──────┴──────┐
     ▼             ▼
┌─────────┐   ┌─────────┐
│Backend-1│   │Backend-2│
└─────────┘   └─────────┘
```

### Request Flow

1. **Client** sends HTTP request to load balancer
2. **Master Process** spawns worker processes (1 per CPU core)
3. **Worker** selects next available backend using round-robin algorithm
4. **Redis** maintains shared routing index across workers
5. **Request** is proxied to selected backend instance
6. **Response** is forwarded back to client

---

## 🛠️ Tech Stack

<table>
  <tr>
    <td align="center"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" width="60"/><br><b>Node.js</b></td>
    <td align="center"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg" width="60"/><br><b>Redis</b></td>
    <td align="center"><img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" width="60"/><br><b>Docker</b></td>
  </tr>
</table>

**Core Technologies:**
- **Runtime:** Node.js (v18+)
- **State Store:** Redis 7.0+
- **Containerization:** Docker & Docker Compose
- **Libraries:** Native HTTP module, Cluster API

---

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose installed
- Git

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/hari-prasath-2003/load-balancer.git
cd load-balancer

# 2. Start services using Docker Compose
docker compose up --build

# 3. Load balancer is now running!
# Access at: http://localhost:8080
```

### Running in Production Mode

```bash
# Start in detached mode
docker compose up -d --build

# View logs
docker compose logs -f load-balancer

# Stop services
docker compose down
```

### Testing

```bash
# Send test request
curl http://localhost:8080/api/health

# Load test (requires Apache Bench)
ab -n 10000 -c 100 http://localhost:8080/api/test
```

---

## ⚙️ Configuration

Environment variables for load balancer configuration:

```bash
# .env file
PORT=8080                          # Load balancer port
REDIS_URL=redis://redis:6379       # Redis connection
WORKER_COUNT=4                     # Number of worker processes
HEALTH_CHECK_INTERVAL=30000        # Health check interval (ms)
```

**Backend Registration:**

```javascript
// config/backends.json
{
  "backends": [
    { "host": "backend-1", "port": 3001 },
    { "host": "backend-2", "port": 3002 },
    { "host": "backend-3", "port": 3003 }
  ]
}
```

---

## 🗺️ Roadmap

### Phase 1 - Core Features ✅
- [x] Round-robin routing
- [x] HTTP request proxying
- [x] Multi-process scaling
- [x] Redis state management
- [x] Docker containerization

### Phase 2 - Reliability 🚧
- [ ] Active health checks
- [ ] Automatic failover
- [ ] Graceful degradation
- [ ] Circuit breaker pattern

### Phase 3 - Observability 📊
- [ ] Monitoring dashboard
- [ ] Prometheus metrics
- [ ] Request/response logging
- [ ] Performance profiling

### Phase 4 - Advanced Features 🔮
- [ ] Weighted routing
- [ ] Rate limiting
- [ ] SSL/TLS termination
- [ ] WebSocket support
- [ ] Load testing framework

---

## 📊 Performance

*Benchmarks coming soon*

Target metrics:
- **Throughput:** 10,000+ req/sec
- **Latency:** <5ms overhead
- **Availability:** 99.9% uptime
- **Scalability:** Horizontal scaling support

---

## 📚 Learning Outcomes

This project provided practical experience with:

| Concept | Implementation |
|---------|---------------|
| **HTTP Protocol** | Request lifecycle, headers, status codes |
| **Concurrency** | Multi-process architecture, shared state |
| **Distributed Systems** | State coordination, fault tolerance |
| **System Design** | Load balancing strategies, scalability patterns |
| **DevOps** | Containerization, service orchestration |
| **Observability** | Health checks, monitoring, logging |



<p align="center">
  <i>⚠️ Note: This is a learning project and not recommended for production use without further hardening and testing.</i>
</p>

<p align="center">
  Made with ❤️ by Hari Prasath M
</p>

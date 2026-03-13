# Lume - OutSystems Infrastructure Monitoring 🕯️

Lume is a high-performance, real-time monitoring solution designed specifically for OutSystems infrastructure. It "illuminates" the health of your environment using modern tech stacks and premium visual feedback.

![Lume Light Board Mockup](./brain/3009b889-6d01-45b4-8c57-3d9691d9bb44/lume_light_board_mockup_1773067896438.png)

## 🌟 Key Features

- **The Light Board (Real-time Health)**: A "glassmorphism" dashboard providing instant visual status of OutSystems nodes, request rates, and error frequencies.
- **Log Spotlight (Deep Search)**: An advanced log explorer with "drill-down" capabilities into OSLOG_ tables and Performance Monitoring APIs.
- **Predictive Alerts**: Pattern-matching engine that identifies performance trends before they become critical issues.
- **OutSystems Integration**: Native support for PerformanceMonitoring API and direct SQL Server log table consumption.

## 🚀 Tech Stack

- **Frontend**: SvelteKit (Fast, reactive, low runtime overhead).
- **Backend**: Node.js + Fastify (High performance, low overhead).
- **Database**: TimescaleDB (PostgreSQL extension for optimized time-series data).
- **Cloud Infrastructure**: AWS ECS (Fargate), Application Load Balancer (ALB), RDS PostgreSQL.

## 🏗️ Architecture

Lume is built for scalability and security:
- **Scalable Compute**: Containers running on ECS Fargate (Private Subnets).
- **Traffic Routing**: Application Load Balancer (ALB) handles path-based routing (`/api/*` to Backend, `/` to Frontend).
- **Secure Secrets**: Database and API credentials are never hardcoded; they are retrieved at runtime via **AWS SSM Parameter Store**.
- **CI/CD**: Automated build and push to ECR via GitHub Actions.

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- Docker & Docker Compose (optional for local DB)

### Setup
1. Clone the repository.
2. Configure environment variables in `backend/.env` and `frontend/.env`.
3. Start the developmental database:
   ```bash
   docker-compose up -d database
   ```
4. Run Backend:
   ```bash
   cd backend
   npm install && npm run dev
   ```
5. Run Frontend:
   ```bash
   cd frontend
   npm install && npm run dev
   ```

## ☁️ Deployment

Deployment is automated via GitHub Actions.

1. Configure GitHub Secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`.
2. Push to `main` branch to trigger the build.
3. Run the deployment script for infrastructure updates:
   ```powershell
   .\deploy-lume-aws.ps1
   ```

## 📄 Documentation

- [Implementation Plan](./brain/3009b889-6d01-45b4-8c57-3d9691d9bb44/implementation_plan.md)
- [Walkthrough & Proof of Work](./brain/3009b889-6d01-45b4-8c57-3d9691d9bb44/walkthrough.md)
- [AWS Deployment Guide](./brain/3009b889-6d01-45b4-8c57-3d9691d9bb44/aws_deployment_guide.md)

---
*Created for high-performance OutSystems monitoring.*

# Unifeed Backend

This is the backend server for **Unifeed**, a social networking application built with Node.js and Express.js.

The backend handles the application's API requests, authentication, business logic, database communication, and real-time functionality.

The interesting part of this project for me was not just building the backend, but taking the application from my local machine and deploying it to AWS using **Docker, Amazon ECR, Amazon EC2, Amazon RDS, IAM, GitHub OIDC, and GitHub Actions**.

---

# What I Built

The backend is a Node.js/Express application that communicates with the React frontend and PostgreSQL database.

The final deployment looks like this:

```text
                    React Frontend
                    Amazon S3
                        │
                        │ API Requests
                        ▼
              Node.js + Express
                 Docker Container
                       │
                     EC2
                       │
                       │ PostgreSQL
                       ▼
                  Amazon RDS
                PostgreSQL DB
```

The deployment pipeline looks like this:

```text
Developer
    │
    │ git push
    ▼
GitHub Repository
    │
    ▼
GitHub Actions
    │
    ├── Checkout code
    ├── Authenticate using OIDC
    ├── Login to ECR
    ├── Build Docker image
    ├── Tag image
    └── Push image
          │
          ▼
       Amazon ECR
          │
          │ SSH
          ▼
       Amazon EC2
          │
          ├── Login to ECR
          ├── Pull latest image
          ├── Stop old container
          ├── Remove old container
          └── Start new container
                    │
                    ▼
               Amazon RDS
                PostgreSQL
```

---

# Tech Stack

### Backend

* Node.js
* Express.js
* REST APIs
* PostgreSQL
* JWT Authentication
* Socket.IO
* Multer
* Cloudinary

### Containerization

* Docker
* Dockerfile
* Amazon ECR

### AWS

* Amazon EC2
* Amazon ECR
* Amazon RDS
* Amazon VPC
* Public Subnet
* Private Subnet
* Route Tables
* Security Groups
* IAM
* IAM Roles

### CI/CD

* GitHub Actions
* GitHub OIDC
* AWS CLI
* SSH
* Linux

---

# 1. Running the Backend Locally

Before deploying the backend, I first made sure it worked correctly on my local machine.

Clone the repository:

```bash
git clone https://github.com/Himanshu-cyber-alt/UF-SERVER.git
```

Move into the project:

```bash
cd UF-SERVER
```

Install dependencies:

```bash
npm install
```

The backend uses environment variables for configuration such as the database connection and application secrets.

Create:

```text
.env
```

and add the required values.

I keep the `.env` file out of GitHub because it contains sensitive configuration.

---

# 2. Database Configuration

The backend uses PostgreSQL.

Locally, the application can connect to PostgreSQL using the `DATABASE_URL` environment variable.

The backend creates a PostgreSQL connection using the `pg` package.

The basic flow is:

```text
Node.js Application
        │
        ▼
process.env.DATABASE_URL
        │
        ▼
PostgreSQL
```

For the production deployment, I moved the database to **Amazon RDS for PostgreSQL**.

This means the database is managed separately from the EC2 server.

```text
EC2
 │
 │ PostgreSQL connection
 ▼
RDS PostgreSQL
```

---

# 3. Creating the AWS Network

Before deploying the application, I created an AWS VPC for the application.

The basic network setup is:

```text
VPC
10.0.0.0/16
   │
   ├── Public Subnet
   │       │
   │       └── EC2
   │
   └── Private Subnet
           │
           └── RDS
```

I placed the EC2 instance in the public subnet because it needs to be reachable for the application and SSH deployment.

The RDS database is placed in the private subnet because the database does not need to be directly accessible from the public internet.

---

# 4. Security Groups

I created separate security groups for EC2 and RDS.

The important rule is that the RDS database does not accept PostgreSQL traffic from everywhere.

Instead:

```text
EC2 Security Group
        │
        │ Port 5432
        ▼
RDS Security Group
```

The RDS security group allows PostgreSQL traffic on port `5432` from the EC2 security group.

This means the database can communicate with the backend without exposing PostgreSQL publicly.

---

# 5. Creating the EC2 Server

I created an EC2 Linux instance to run the backend.

After connecting to the instance through SSH, I updated the installed packages:

```bash
sudo dnf update -y
```

This updates the available system packages and security fixes.

I also installed Git:

```bash
sudo dnf install git -y
```

Then verified it:

```bash
git --version
```

---

# 6. Getting the Backend onto EC2

For the initial setup, I cloned the backend repository:

```bash
git clone https://github.com/Himanshu-cyber-alt/UF-SERVER.git
```

This created the project directory on the EC2 instance.

However, I didn't want the production deployment to depend on manually cloning and rebuilding the project every time.

That is why I later introduced Docker + ECR + GitHub Actions.

---

# 7. Dockerizing the Backend

I created a `Dockerfile` for the Node.js application.

The basic idea is:

```dockerfile
WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

EXPOSE 8000

CMD ["node", "server.js"]
```

The Docker image contains the application and its required production dependencies.

This gives me a consistent environment for running the backend.

Instead of installing and configuring the Node.js application directly every time, I can run the same Docker image anywhere Docker is available.

---

# 8. Building the Docker Image

The Docker image can be built using:

```bash
docker build -t unifeed-server-img .
```

### What does this do?

Docker reads the `Dockerfile` and creates an image containing:

```text
Node.js
    +
Application Code
    +
Production Dependencies
    +
Startup Command
```

The `.` means Docker should use the current directory as the build context.

---

# 9. Running the Container

After creating the image, I can run it:

```bash
docker run -d \
  --name unifeed \
  --env-file .env \
  -p 8000:8000 \
  unifeed-server-img
```

### Why these options?

`-d`

Runs the container in the background.

`--name unifeed`

Gives the container an easy-to-identify name.

`--env-file .env`

Loads the backend environment variables.

`-p 8000:8000`

Maps:

```text
EC2 Host Port 8000
        ↓
Container Port 8000
```

---

# 10. Testing the Backend

After starting the container, I tested the application from inside EC2:

```bash
curl http://localhost:8000
```

If the backend responds correctly, I can then test it using the EC2 public IP:

```text
http://<EC2_PUBLIC_IP>:8000
```

This helped me verify that:

```text
Internet
   ↓
EC2
   ↓
Docker Container
   ↓
Node.js Server
```

was working correctly.

---

# 11. Why I Added Amazon ECR

At this point, the backend was running successfully in Docker.

The next problem was:

> How can GitHub Actions send the latest Docker image to my EC2 server?

Instead of copying Docker images directly between machines, I used **Amazon Elastic Container Registry (ECR)**.

The flow becomes:

```text
GitHub Actions
      │
      │ docker push
      ▼
Amazon ECR
      │
      │ docker pull
      ▼
Amazon EC2
```

ECR acts as the private container image registry for the backend.

---

# 12. Creating the ECR Repository

I created an ECR repository for the backend:

```text
unifeed-server-img
```

The repository stores the Docker images produced by the CI/CD pipeline.

The image is tagged using the ECR repository URI:

```text
541739391357.dkr.ecr.ap-south-1.amazonaws.com/unifeed-server-img:latest
```

The ECR repository is private.

---

# 13. GitHub Actions Authentication with AWS

I didn't want to store long-lived AWS access keys inside GitHub.

Instead, I used **GitHub OIDC**.

The authentication flow is:

```text
GitHub Actions
      │
      │ OIDC Token
      ▼
AWS IAM
      │
      │ Assume Role
      ▼
Temporary AWS Credentials
      │
      ▼
Amazon ECR
```

The GitHub Actions workflow has:

```yaml
permissions:
  id-token: write
  contents: read
```

`contents: read` allows the workflow to read the repository.

`id-token: write` allows GitHub Actions to request an OIDC token.

AWS then uses that identity to allow the workflow to assume the configured IAM role.

---

# 14. IAM Role for GitHub Actions

I created an IAM role that GitHub Actions can assume.

The trust relationship restricts which GitHub repository and branch can assume the role.

Conceptually:

```text
Who can assume this role?

        ↓

Unifeed GitHub repository

        ↓

main branch
```

This prevents an unrelated GitHub repository from using the same role.

---

# 15. GitHub Actions — Build and Push

The backend workflow starts when code is pushed to `main`:

```yaml
on:
  push:
    branches:
      - main
```

The workflow then:

```text
Checkout
   ↓
Authenticate with AWS
   ↓
Login to ECR
   ↓
Build Docker image
   ↓
Tag image
   ↓
Push image to ECR
```

The important commands are:

```bash
docker build -t unifeed-server-img .
```

Build the image.

Then tag it:

```bash
docker tag unifeed-server-img:latest \
541739391357.dkr.ecr.ap-south-1.amazonaws.com/unifeed-server-img:latest
```

Then push it:

```bash
docker push \
541739391357.dkr.ecr.ap-south-1.amazonaws.com/unifeed-server-img:latest
```

After this, the latest Docker image is available in ECR.

---

# 16. Giving EC2 Permission to Pull From ECR

The EC2 instance also needs permission to access the private ECR repository.

I created an IAM role for EC2 and attached the required ECR read permissions.

The flow is:

```text
EC2
 │
 │ IAM Role
 ▼
ECR Permissions
 │
 ▼
Amazon ECR
```

I verified the IAM role from EC2 using:

```bash
aws sts get-caller-identity
```

This helped confirm that the EC2 instance was using the expected IAM identity.

---

# 17. Connecting GitHub Actions to EC2

After the image is pushed to ECR, GitHub Actions needs to tell EC2 to deploy it.

For this I used SSH through:

```text
appleboy/ssh-action
```

GitHub Secrets contain:

```text
EC2_HOST
EC2_SSH_KEY
```

The SSH key is kept in GitHub Secrets and is never committed to the repository.

---

# 18. Deploying the New Image to EC2

Once GitHub Actions connects to EC2, it performs the following steps.

### Step 1 — Login to ECR

```bash
aws ecr get-login-password --region ap-south-1 | \
sudo docker login --username AWS --password-stdin \
541739391357.dkr.ecr.ap-south-1.amazonaws.com
```

This authenticates Docker on EC2 with the private ECR registry.

---

### Step 2 — Pull the latest image

```bash
sudo docker pull \
541739391357.dkr.ecr.ap-south-1.amazonaws.com/unifeed-server-img:latest
```

This downloads the latest image that GitHub Actions pushed.

---

### Step 3 — Stop the old container

```bash
sudo docker stop unifeed || true
```

The old version of the application is stopped.

The `|| true` prevents the deployment from failing if the container doesn't already exist.

---

### Step 4 — Remove the old container

```bash
sudo docker rm unifeed || true
```

Docker containers cannot be recreated using the same name while the old container still exists.

So I remove the old container before starting the new one.

---

### Step 5 — Start the new container

```bash
sudo docker run -d \
  --name unifeed \
  --env-file /home/ec2-user/UF-SERVER/.env \
  -p 8000:8000 \
  541739391357.dkr.ecr.ap-south-1.amazonaws.com/unifeed-server-img:latest
```

The new container starts using the latest image from ECR.

The production `.env` file stays on the EC2 server instead of being stored inside the Docker image or committed to GitHub.

---

# 19. Complete CI/CD Flow

The final backend deployment process is:

```text
Developer
    │
    │ git push origin main
    ▼
GitHub
    │
    ▼
GitHub Actions
    │
    ├── Checkout code
    │
    ├── GitHub OIDC
    │
    ├── Assume AWS IAM Role
    │
    ├── Login to ECR
    │
    ├── docker build
    │
    ├── docker tag
    │
    └── docker push
            │
            ▼
        Amazon ECR
            │
            │ SSH
            ▼
        Amazon EC2
            │
            ├── ECR Login
            ├── docker pull
            ├── docker stop
            ├── docker rm
            └── docker run
                    │
                    ▼
               Node.js API
                    │
                    ▼
               Amazon RDS
                PostgreSQL
```

---

# 20. Why I Used This Architecture

I wanted to separate the application into different responsibilities.

```text
S3
 ↓
Frontend

EC2 + Docker
 ↓
Backend

RDS
 ↓
Database
```

This gives me a simple three-tier architecture:

```text
Presentation Tier
       ↓
    S3 React

Application Tier
       ↓
   EC2 + Docker
 Node.js + Express

Data Tier
       ↓
 RDS PostgreSQL
```

The backend and database are also separated, so the application server does not need to run the PostgreSQL database itself.

---

# 21. Useful Commands

### Check Docker containers

```bash
sudo docker ps
```

### Check all containers

```bash
sudo docker ps -a
```

### Check Docker images

```bash
sudo docker images
```

### View container logs

```bash
sudo docker logs unifeed
```

### Follow container logs

```bash
sudo docker logs -f unifeed
```

### Test the backend locally on EC2

```bash
curl http://localhost:8000
```

### Check AWS identity

```bash
aws sts get-caller-identity
```

### Check Docker login to ECR

```bash
aws ecr get-login-password --region ap-south-1 | \
sudo docker login --username AWS --password-stdin \
541739391357.dkr.ecr.ap-south-1.amazonaws.com
```

---

# 22. Security Considerations

I avoided putting sensitive information directly into the repository.

Sensitive values such as:

* Database credentials
* JWT secrets
* SSH private key
* GitHub Actions secrets

are kept outside the source code.

For GitHub Actions → AWS authentication, I used **OIDC + IAM roles** instead of long-lived AWS access keys.

For EC2 → ECR authentication, the EC2 instance uses an IAM role.

For the database, RDS is not publicly accessible and PostgreSQL access is restricted through the EC2 security group.

---

# 23. What I Learned

The main things I learned while deploying this backend were:

* How to run a Node.js application on EC2
* How to create a Docker image from a backend application
* How Docker containers expose application ports
* How to store Docker images in Amazon ECR
* How EC2 pulls images from a private ECR repository
* How IAM roles provide AWS permissions to EC2
* How GitHub OIDC allows GitHub Actions to authenticate with AWS
* How to build a CI/CD pipeline with GitHub Actions
* How to deploy a new Docker image automatically
* How to use SSH from GitHub Actions to execute deployment commands on EC2
* How to connect an EC2-hosted backend to PostgreSQL on RDS
* How VPC subnets and security groups control communication between application and database

---

# Final Result

The deployment changed the backend process from manually building and starting the application to an automated deployment pipeline.

Before:

```text
Change Code
   ↓
Build Manually
   ↓
Copy to Server
   ↓
Restart Application
```

After:

```text
Change Code
   ↓
git push
   ↓
GitHub Actions
   ↓
Docker Build
   ↓
Push to ECR
   ↓
SSH to EC2
   ↓
Pull New Image
   ↓
Replace Container
   ↓
New Version Running
```

This repository contains the backend code, while the deployment configuration in `.github/workflows/` handles the automated AWS deployment.

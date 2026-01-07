pipeline {
    agent any

    environment {
        TAG = "${BUILD_NUMBER}"

        NEXUS_REGISTRY = "localhost:8081"
        NEXUS_REPO = "docker-hosted"

        BACKEND_IMAGE = "gitops-backend"
        FRONTEND_IMAGE = "gitops-frontend"

        GITOPS_REPO = "https://github.com/6510685016/gitops-repo.git"
    }

    triggers {
        githubPush()
    }

    stages {

        stage('Build Docker Images (docker compose)') {
            steps {
                sh '''
                  export TAG=${TAG}
                  docker compose build
                '''
            }
        }

        stage('Tag & Push Images to Nexus') {
            steps {
                sh '''
                  docker tag gitops-backend:${TAG} \
                    localhost:8081/docker-hosted/gitops-backend:${TAG}
                  docker push localhost:8081/docker-hosted/gitops-backend:${TAG}

                  docker tag gitops-frontend:${TAG} \
                    localhost:8081/docker-hosted/gitops-frontend:${TAG}
                  docker push localhost:8081/docker-hosted/gitops-frontend:${TAG}
                '''
            }
        }

        stage('Update GitOps Repo') {
            steps {
                sh '''
                  rm -rf gitops
                  git clone https://<TOKEN>@github.com/6510685016/gitops-repo.git gitops
                  cd gitops

                  sed -i "s|image:.*gitops-backend.*|image: localhost:8081/docker-hosted/gitops-backend:${TAG}|" apps/backend/deployment.yaml
                  sed -i "s|image:.*gitops-frontend.*|image: localhost:8081/docker-hosted/gitops-frontend:${TAG}|" apps/frontend/deployment.yaml

                  git config user.email "jenkins@local"
                  git config user.name "jenkins"
                  git add .
                  git commit -m "Update images to ${TAG}"
                  git push
                '''
            }
        }
    }
}

pipeline {
    agent any

    environment {
        TAG = "${BUILD_NUMBER}"

        NEXUS_REGISTRY = "localhost:8081"
        NEXUS_REPO = "docker-hosted"

        BACKEND_IMAGE = "gitops-backend"
        FRONTEND_IMAGE = "gitops-frontend"

        GITOPS_REPO = "6510685016/gitops-repo"
    }

    triggers {
        githubPush()
    }

    stages {

        stage('Build Docker Images (docker compose)') {
            steps {
                sh '''
                  echo "Building images with TAG=${TAG}"
                  docker compose build
                '''
            }
        }

        stage('Tag & Push Images to Nexus') {
            steps {
                sh '''
                  echo "Tag images"
                  docker tag ${BACKEND_IMAGE}:${TAG} ${NEXUS_REGISTRY}/${NEXUS_REPO}/${BACKEND_IMAGE}:${TAG}
                  docker tag ${FRONTEND_IMAGE}:${TAG} ${NEXUS_REGISTRY}/${NEXUS_REPO}/${FRONTEND_IMAGE}:${TAG}

                  echo "Push to Nexus"
                  docker push ${NEXUS_REGISTRY}/${NEXUS_REPO}/${BACKEND_IMAGE}:${TAG}
                  docker push ${NEXUS_REGISTRY}/${NEXUS_REPO}/${FRONTEND_IMAGE}:${TAG}
                '''
            }
        }

        stage('Update GitOps Repo') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'github-token',
                    usernameVariable: 'GIT_USER',
                    passwordVariable: 'GIT_TOKEN'
                )]) {
                    sh '''
                      rm -rf gitops
                      git clone https://${GIT_USER}:${GIT_TOKEN}@github.com/${GITOPS_REPO}.git gitops
                      cd gitops

                      sed -i "s|image:.*gitops-backend.*|image: ${NEXUS_REGISTRY}/${NEXUS_REPO}/${BACKEND_IMAGE}:${TAG}|" apps/backend/deployment.yaml
                      sed -i "s|image:.*gitops-frontend.*|image: ${NEXUS_REGISTRY}/${NEXUS_REPO}/${FRONTEND_IMAGE}:${TAG}|" apps/frontend/deployment.yaml

                      git config user.email "jenkins@local"
                      git config user.name "jenkins"

                      git add .
                      git commit -m "Update images to ${TAG}" || echo "No changes to commit"
                      git push origin main
                    '''
                }
            }
        }
    }
}

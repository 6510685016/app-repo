pipeline {
    agent any

    environment {
        TAG = "${BUILD_NUMBER}"

        NEXUS_REGISTRY = "localhost:8082"
        NEXUS_REPO = "docker-hosted"

        BACKEND_IMAGE = "gitops-backend"
        FRONTEND_IMAGE = "gitops-frontend"

        GITOPS_REPO = "6510685016/gitops-repo"
    }

    triggers {
        githubPush()
    }

    stages {

        stage('SonarQube Scan') {
            steps {
                withSonarQubeEnv('sonarqube') {
                    sh '''
                    docker run --rm \
                    --network host \
                    -v "$PWD:/usr/src" \
                    -w /usr/src \
                    sonarsource/sonar-scanner-cli \
                    -Dsonar.projectKey=gitops-app \
                    -Dsonar.sources=. \
                    -Dsonar.host.url=http://localhost:9000 \
                    -Dsonar.login=$SONAR_AUTH_TOKEN
                    '''
                }
            }
        }


        stage('Build & Push Docker Images') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'nexus-docker',
                    usernameVariable: 'NEXUS_USER',
                    passwordVariable: 'NEXUS_PASS'
                )]) {
                    sh '''
                    echo "$NEXUS_PASS" | docker login localhost:8082 \
                      -u "$NEXUS_USER" --password-stdin
        
                    docker build -t ${NEXUS_REGISTRY}/${NEXUS_REPO}/${BACKEND_IMAGE}:${TAG} backend
                    docker build -t ${NEXUS_REGISTRY}/${NEXUS_REPO}/${FRONTEND_IMAGE}:${TAG} frontend
        
                    docker push ${NEXUS_REGISTRY}/${NEXUS_REPO}/${BACKEND_IMAGE}:${TAG}
                    docker push ${NEXUS_REGISTRY}/${NEXUS_REPO}/${FRONTEND_IMAGE}:${TAG}
                    '''
                }
            }
        }


        stage('Trivy Scan - Frontend Image') {
          steps {
            sh '''
              docker run --rm \
                aquasec/trivy:latest \
                image \
                --severity HIGH,CRITICAL \
                --exit-code 1 \
                localhost:8082/docker-hosted/gitops-frontend:${TAG}
            '''
          }
        }



        stage('Trivy Scan - Backend Image') {
          steps {
            sh '''
              docker run --rm \
                aquasec/trivy:latest \
                image \
                --severity HIGH,CRITICAL \
                --exit-code 1 \
                localhost:8082/docker-hosted/gitops-backend:${TAG}
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

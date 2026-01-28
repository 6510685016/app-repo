pipeline {
    agent any

    environment {
        TAG = "${BUILD_NUMBER}"

        NEXUS_REGISTRY = "localhost:8082"
        NEXUS_REPO = "docker-hosted"

        BACKEND_IMAGE = "gitops-backend"

        GITOPS_REPO = "6510685016/gitops-repo"
    }

    triggers {
        githubPush()
    }

    stages {

        stage('Debug Workspace') {
            steps {
                sh '''
                pwd
                ls -l
                ls -l backend
                '''
            }
        }

        stage('SonarQube Scan') {
            steps {
                withSonarQubeEnv('sonarqube') {
                    sh '''
                    docker run --rm \
                      --network host \
                      -v $WORKSPACE/backend:/usr/src \
                      -w /usr/src \
                      sonarsource/sonar-scanner-cli \
                      -Dsonar.projectKey=gitops-backend \
                      -Dsonar.sources=. \
                      -Dsonar.host.url=http://localhost:9000 \
                      -Dsonar.token=$SONAR_AUTH_TOKEN
                    '''
                }
            }
        }

        stage('Build & Push Docker Image') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'nexus-docker',
                    usernameVariable: 'NEXUS_USER',
                    passwordVariable: 'NEXUS_PASS'
                )]) {
                    sh '''
                    echo "$NEXUS_PASS" | docker login ${NEXUS_REGISTRY} \
                      -u "$NEXUS_USER" --password-stdin

                    docker build --no-cache \
                      -t ${NEXUS_REGISTRY}/${NEXUS_REPO}/${BACKEND_IMAGE}:${TAG} \
                      backend

                    docker push ${NEXUS_REGISTRY}/${NEXUS_REPO}/${BACKEND_IMAGE}:${TAG}
                    '''
                }
            }
        }

        stage('Deploy & Verify') {
            steps {
                script {
                    try {
                        sh '''
                        set -e

                        echo "🚀 Deploy Spring Boot Backend"

                        docker service update \
                          --image ${NEXUS_REGISTRY}/${NEXUS_REPO}/${BACKEND_IMAGE}:${TAG} \
                          --update-parallelism 1 \
                          --update-delay 10s \
                          --update-failure-action rollback \
                          --update-order start-first \
                          gitops-backend \
                        || docker service create \
                          --name gitops-backend \
                          --replicas 2 \
                          --constraint 'node.role==worker' \
                          -p 8765:8080 \
                          --update-parallelism 1 \
                          --update-delay 10s \
                          --update-failure-action rollback \
                          --update-order start-first \
                          ${NEXUS_REGISTRY}/${NEXUS_REPO}/${BACKEND_IMAGE}:${TAG}
                        '''

                        sh '''
                        echo "🩺 Wait for Spring Boot healthcheck..."

                        sleep 15

                        for i in $(seq 1 10); do
                          echo "Healthcheck attempt $i..."

                          if curl -f http://192.168.11.128:8765/actuator/health; then
                            echo "✅ Healthcheck passed"
                            exit 0
                          fi

                          sleep 5
                        done

                        echo "❌ Healthcheck failed"
                        exit 1
                        '''

                    } catch (err) {
                        echo "❌ Deploy failed → Rollback"

                        sh '''
                        docker service rollback gitops-backend || true
                        '''

                        currentBuild.result = 'FAILURE'
                        throw err
                    }
                }
            }
        }
    }
}

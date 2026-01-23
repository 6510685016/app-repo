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

                docker build --no-cache \
                -t ${NEXUS_REGISTRY}/${NEXUS_REPO}/${BACKEND_IMAGE}:${TAG} backend

                docker build --no-cache \
                -t ${NEXUS_REGISTRY}/${NEXUS_REPO}/${FRONTEND_IMAGE}:${TAG} frontend

                docker push ${NEXUS_REGISTRY}/${NEXUS_REPO}/${BACKEND_IMAGE}:${TAG}
                docker push ${NEXUS_REGISTRY}/${NEXUS_REPO}/${FRONTEND_IMAGE}:${TAG}
            '''
            }
        }
        }


        // stage('Trivy Scan - Frontend Image') {
        //   steps {
        //     sh '''
        //       docker run --rm \
        //             -v /var/run/docker.sock:/var/run/docker.sock \
        //             -v /var/jenkins_home/.cache/trivy:/root/.cache \
        //             aquasec/trivy:latest \
        //             image \
        //             --severity HIGH,CRITICAL \
        //             --exit-code 1 \
        //             ${NEXUS_REGISTRY}/${NEXUS_REPO}/${FRONTEND_IMAGE}:${TAG}
        //     '''
        //   }
        // }


        // stage('Trivy Scan - Backend Image') {
        //     steps {
        //         sh '''
        //         docker run --rm \
        //             -v /var/run/docker.sock:/var/run/docker.sock \
        //             -v /var/jenkins_home/.cache/trivy:/root/.cache \
        //             aquasec/trivy:latest \
        //             image \
        //             --severity HIGH,CRITICAL \
        //             --exit-code 1 \
        //             ${NEXUS_REGISTRY}/${NEXUS_REPO}/${BACKEND_IMAGE}:${TAG}
        //         '''
        //     }
        // }


        stage('Deploy & Verify') {
            steps {
                script {
                    try {
                        sh '''
                        echo "Deploy Backend"

                        docker service update \
                            --image 192.168.11.128:8082/${NEXUS_REPO}/${BACKEND_IMAGE}:${TAG} \
                            --update-parallelism 1 \
                            --update-delay 10s \
                            --update-failure-action rollback \
                            --update-order start-first \
                            gitops-backend \
                        || docker service create \
                            --name gitops-backend \
                            --replicas 2 \
                            --constraint 'node.role == worker' \
                            --publish 100:5000 \
                            --update-failure-action rollback \
                            --update-order start-first \
                            192.168.11.128:8082/${NEXUS_REPO}/${BACKEND_IMAGE}:${TAG}

                        echo "Deploy Frontend"

                        docker service update \
                            --image 192.168.11.128:8082/${NEXUS_REPO}/${FRONTEND_IMAGE}:${TAG} \
                            --update-parallelism 1 \
                            --update-delay 10s \
                            --update-failure-action rollback \
                            --update-order start-first \
                            gitops-frontend \
                        || docker service create \
                            --name gitops-frontend \
                            --replicas 2 \
                            --constraint 'node.role == worker' \
                            --publish 80:3000 \
                            --update-failure-action rollback \
                            --update-order start-first \
                            192.168.11.128:8082/${NEXUS_REPO}/${FRONTEND_IMAGE}:${TAG}
                        '''

                        sh '''
                        echo "Wait for healthcheck..."
                        sleep 20
                        curl -f http://localhost:8081/health
                        '''

                    } catch (err) {
                        echo "Force rollback services"

                        sh '''
                            docker service rollback gitops-backend || true
                            docker service rollback gitops-frontend || true
                        '''

                        currentBuild.result = 'FAILURE'
                        throw err
                    }
                }
            }
        }
    }
}

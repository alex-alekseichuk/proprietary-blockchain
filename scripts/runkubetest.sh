while getopts n:c:l:i:d:t: option
do
case "${option}"
in
n) PROJECT_NAMESPACE=$OPTARG;;
c) PROJECT_CONFIG=$OPTARG;;
l) PROJECT_LICENSE=$OPTARG;;
i) PROJECT_IMAGE=$OPTARG;;
d) PROJECT_CONTAINER_NAME=$OPTARG;;
t) PROJECT_TOKEN=$OPTARG;;
esac
done

kubectl run $PROJECT_CONTAINER_NAME -n $PROJECT_NAMESPACE --restart=Never --overrides='
{
  "apiVersion": "v1",
  "spec": {
    "imagePullSecrets": [
      {
        "name": "project-regsecret"
      }
    ],
    "initContainers": [
      {
        "name": "copy-configs",
        "image": "busybox",
        "command": ["sh", "-c", "cp /tmp/project-config-volume/server/* /tmp/ng-rt/config/server/ 2>/dev/null || true; cp /tmp/project-license-volume/licenses/* /tmp/ng-rt/config/licenses 2>/dev/null || true"],
        "volumeMounts": [
          {
            "name": "project-config-volume",
            "mountPath": "/tmp/project-config-volume/server"
          },
          {
            "name": "'$PROJECT_CONFIG'",
            "mountPath": "/tmp/ng-rt/config/server"
          },
          {
            "name": "project-license-volume",
            "mountPath": "/tmp/project-license-volume/licenses"
          },
          {
            "name": "'$PROJECT_LICENSE'",
            "mountPath": "/tmp/ng-rt/config/licenses"
          }
        ]
      }
    ],
    "containers": [
      {
        "env": [
          {
            "name": "AWS_ACCESS_KEY_ID",
            "valueFrom": {
              "secretKeyRef": {
                "key": "AWS_ACCESS_KEY_ID",
                "name": "aws-secrets"
              }
            }
          },
          {
            "name": "AWS_SECRET_ACCESS_KEY",
            "valueFrom": {
              "secretKeyRef": {
                "key": "AWS_SECRET_ACCESS_KEY",
                "name": "aws-secrets"
              }
            }
          },
          {
            "name": "AWS_REGION",
            "valueFrom": {
              "secretKeyRef": {
                "key": "AWS_REGION",
                "name": "aws-secrets"
              }
            }
          },
          {
            "name": "BUILD_ID",
            "valueFrom": {
              "configMapKeyRef": {
                "key": "BUILD_ID",
                "name": "tbsp-config"
              }
            }
          }
        ],
        "command": [
          "sh",
          "-c",
          "npm i -g git+https://gitlab.project.com/sdk/ng-rt-dev-tools.git && npx project-install && mkdir -p /tmp/ng-rt/plugins 2\u003e/dev/null && npm test --skipConnectivityTestBigchainDB"
        ],
        "name": "'$PROJECT_CONTAINER_NAME'",
        "image": "'$PROJECT_IMAGE'",
        "volumeMounts": [
          {
            "mountPath": "/tmp/ng-rt/config/server",
            "name": "'$PROJECT_CONFIG'"
          },
          {
            "mountPath": "/tmp/ng-rt/config/licenses",
            "name": "'$PROJECT_LICENSE'"
          }
        ]
      }
    ],
    "volumes": [
      {
        "name": "project-config-volume",
        "configMap": {
          "name": "'$PROJECT_CONFIG'"
        }
      },
      {
        "name": "'$PROJECT_CONFIG'",
        "emptyDir": {}
      },
      {
        "name": "project-license-volume",
        "configMap": {
          "name": "'$PROJECT_LICENSE'"
        }
      },
      {
        "name": "'$PROJECT_LICENSE'",
        "emptyDir": {}
      }
    ]
  }
}
' --image=$PROJECT_IMAGE -ti --rm --token=$PROJECT_TOKEN
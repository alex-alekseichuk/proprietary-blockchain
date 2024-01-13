while getopts n:i:d:t:u:v option
do
case "${option}"
in
n) PROJECT_NAMESPACE=$OPTARG;;
#i) PROJECT_IMAGE=$OPTARG;;
d) PROJECT_CONTAINER_NAME=$OPTARG;;
t) PROJECT_TOKEN=$OPTARG;;
u) PROJECT_URL1=$OPTARG;;
#v) PROJECT_URL2=$OPTARG;;

esac
done

kubectl run qac-immutable-$PROJECT_CONTAINER_NAME -n $PROJECT_NAMESPACE  --restart=Never --overrides='
{
	"apiVersion": "v1",
	"spec": {
		"imagePullSecrets": [{
			"name": "project-regsecret"
		}],
		"containers": [{
			"env": [{
					"name": "SCOPE",
					"value": "gcp.yml"
				},
				{
					"name": "url",
					"value": "https://dev-3.2-i-p.project.com"
				},
				{
				    "name": "websocketUrl",
				    "value": "wss://dev-3.2-i-p.project.com"
				}

			],
      "name": "qac",
      "image": "registry.project.com/qa/qac:latest",
			"command": [
				"sh",
				"-c",
				"bash sc.sh"
			]
		}]
	}
}
' --image="registry.project.com/qa/qac:latest" -ti --rm --token=$PROJECT_TOKEN

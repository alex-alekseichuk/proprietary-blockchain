#Write rsa keys from environment
[[ -z "${PROJECT_RSA_PRIVATEKEY}" ]] || printenv PROJECT_RSA_PRIVATEKEY > /tmp/project_privatekey.pem
[[ -z "${PROJECT_RSA_PUBLICKEY}" ]] || printenv PROJECT_RSA_PUBLICKEY > /tmp/project_publickey.pem
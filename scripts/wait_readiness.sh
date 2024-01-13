READINESSCHECK_URL=${READINESSCHECK:-"http://127.0.0.1:8443/ng-rt-core/readinesscheck"}
echo "url=$READINESSCHECK_URL" 
until [[ $status_code = "200" ]]; do
    echo "status_code=$status_code"
    status_code=$(curl --write-out %{http_code} --silent --output /dev/null "$READINESSCHECK_URL")
    sleep 5
done
echo '$READINESSCHECK_URL readiness is READY'
[[ "$TRACE" ]] && set -x

function echoerr() {
  local header="${2}"

  if [ -n "${header}" ]; then
    printf "\n\033[0;31m** %s **\n\033[0m" "${1}" >&2;
  else
    printf "\033[0;31m%s\n\033[0m" "${1}" >&2;
  fi
}

function echoinfo() {
  local header="${2}"

  if [ -n "${header}" ]; then
    printf "\n\033[0;33m** %s **\n\033[0m" "${1}" >&2;
  else
    printf "\033[0;33m%s\n\033[0m" "${1}" >&2;
  fi
}

function get_job_id() {
  local job_name="${1}"
  local query_string="${2:+&${2}}"

  local max_page=3
  local page=1

  while true; do
    local url="https://gitlab.project.com/api/v4/projects/${CI_PROJECT_ID}/pipelines/${CI_PIPELINE_ID}/jobs?per_page=100&page=${page}${query_string}"
    echoinfo "GET ${url}"

    local job_id
    job_id=$(curl --silent --show-error --header "PRIVATE-TOKEN: ${API_TOKEN}" "${url}" | jq "map(select(.name == \"${job_name}\")) | map(.id) | last")
    [[ "${job_id}" == "null" && "${page}" -lt "$max_page" ]] || break

    let "page++"
  done

  if [[ "${job_id}" == "" ]]; then
    echoerr "The '${job_name}' job ID couldn't be retrieved!"
  else
    echoinfo "The '${job_name}' job ID is ${job_id}"
    echo "${job_id}"
  fi
}

function wait_for_job_to_be_done() {
  local job_name="${1}"
  local query_string="${2}"
  local job_id
  job_id=$(get_job_id "${job_name}" "${query_string}")
  if [ -z "${job_id}" ]; then return; fi

  echoinfo "Waiting for the '${job_name}' job to finish..."

  local url="https://gitlab.project.com/api/v4/projects/${CI_PROJECT_ID}/jobs/${job_id}"
  echoinfo "GET ${url}"

  # In case the job hasn't finished yet. Keep trying until the job times out.
  local interval=30
  local elapsed_seconds=0
  while true; do
    local job_status
    job_status=$(curl --silent --show-error --header "PRIVATE-TOKEN: ${API_TOKEN}" "${url}" | jq ".status" | sed -e s/\"//g)
    [[ "${job_status}" == "pending" || "${job_status}" == "running" ]] || break

    printf "."
    let "elapsed_seconds+=interval"
    sleep ${interval}
  done

  local elapsed_minutes=$((elapsed_seconds / 60))
  echoinfo "Waited '${job_name}' for ${elapsed_minutes} minutes."

  if [[ "${job_status}" == "failed" ]]; then
    echoerr "The '${job_name}' failed."
  elif [[ "${job_status}" == "manual" ]]; then
    echoinfo "The '${job_name}' is manual."
  else
    echoinfo "The '${job_name}' passed."
  fi
}

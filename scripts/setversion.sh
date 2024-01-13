while [[ $# -gt 1 ]]
do
key="$1"

case $key in
    -e|--file)
    FILENAME="$2"
    shift # past argument
    ;;
    -n|--number)
    BUILDNUMBER="$2"
    shift # past argument
    ;;
    --default)
    DEFAULT=YES
    ;;
    *)
            # unknown option
    ;;
esac
shift # past argument or value
done

dateAndTime=$(date +"%Y-%m-%d at %H.%M.%S")

sed -i -e "s/{build_number}/${BUILDNUMBER}/g" ${FILENAME}
sed -i -e "s/{buildDateTime}/${dateAndTime}/g" ${FILENAME}

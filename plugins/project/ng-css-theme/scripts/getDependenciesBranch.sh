y=$1

projectconfig="./config.project"
featureconfig="./config.feature"

if [ -f ./config.project ]; then
    while IFS='= ' read -r lhs rhs
    do
        $rhs
    done < "$projectconfig"
fi
project=$rhs

if [ -f ./config.feature ]; then
    while IFS='= ' read -r lhs rhs
    do
        $rhs
    done < "$featureconfig"
fi
feature=$rhs

branchtype=$(bash ./scripts/getBranchType.sh $y )
base=${y%%_*}
base=${base%%@*}
dependency=$base

if [ "$branchtype" = "base" ]
then
    dependency=$y
elif [ "$branchtype" = "project" ]
then
    if [ "$project" = "project" ]
    then
        dependency=$y
    else
        y=$(echo $y | sed 's/@.*//g')
        dependency=$y
    fi
elif [ "$branchtype" = "feature" ]
then
    if [ "$feature" = "project" ]
    then
        y=$(echo $y | sed s/_.*@/@/g)
        dependency=$y
    elif [ "$feature" = "feature" ]
    then
        dependency=$y
    else
        y=$(echo $y | sed 's/_.*//g')
        dependency=$y
    fi
else
    dependency=$base
fi

echo $dependency

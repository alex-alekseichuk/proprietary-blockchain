ip=`ipconfig getifaddr en1`

echo "Please enter your name: $ip :"
read newip
[ -n "$newip" ] && ip=$newip
echo ${ip}
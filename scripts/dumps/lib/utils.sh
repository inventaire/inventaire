folder=$(node -p "require('config').universalPath.path('dumps')")
today=$(date +'20%y-%m-%d')
today_folder="${folder}/${today}"
mkdir -p "$today_folder"

validate_ttl(){
  echo "validating ttl: $1"
  file_path_hash=$(echo $1 | md5sum | awk '{printf $1}')
  log_file="/tmp/ttl_validation_logs_${file_path_hash}"
  # TurtleValidator ttl always exits with 0, thus the need to parse its logs
  # to exit with an error code if an error was detected
  # see https://github.com/IDLabResearch/TurtleValidator/issues/7
  ttl $1 | tee $log_file
  cat $log_file | grep '{ Error' > /dev/null && exit 1
}

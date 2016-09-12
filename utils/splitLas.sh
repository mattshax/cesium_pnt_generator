#! /bin/bash

lidar=$1
split_size=$2
outtime=$3

echo "splitting las file"
mkdir -p tmp
las2las --split-mb $split_size $lidar -o tmp/s
rename 's/\d+/sprintf("%04d",$&)/e' tmp/s-*

TIME=$(date +"%d-%m-%Y_%H-%M-%S")
URL=s3://s3.parallel.works/pntgen/tiles

for file in tmp/s-*.las; do
    case=$(basename $file .las)
    echo $TIME$(echo _$case) >> s3.txt
done

s3cmd put s3.txt $URL/$TIME$(echo _tiles).txt

echo $TIME > $outtime


#! /bin/bash

file=$1
lidar_image=$2
TIME=$(cat $3)
epsg=$4
height_adjust=$5

tar -xzf utils/node_modules.tgz

case=$(basename $file .las)
echo $case "- processing"

echo $case "- attaching color to file"
las2las -i $file \
        --color-source $lidar_image \
        --file-format 1.2 \
        --point-format 3 \
        -o tmp/c.las

# export the color
echo $case "- exporting color information"
las2txt  -i tmp/c.las -o tmp/c.txt --parse RGB

# project the data 
echo $case "- transforming las projection"
las2las --a_srs EPSG:$epsg --t_srs EPSG:4326 $file --scale 0.000001 0.000001 0.01 -o tmp/p.las

# output the points
echo $case "- exporting points"
las2txt  -i tmp/p.las -o tmp/p.txt --parse xyz

# process the cesium data
node utils/RTC.js tmp/p.txt tmp/c.txt $case $height_adjust $TIME

# upload the files to s3
s3cmd put *.pnts s3://s3.parallel.works/pntgen/pnts/$TIME$(echo _$case).pnts --add-header=Content-Encoding:gzip 

s3cmd put *.json s3://s3.parallel.works/pntgen/json/$TIME$(echo _$case).json

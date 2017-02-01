#!/bin/bash

# install nodejs and the liblas library to use this script:
#sudo apt-get install liblas-bin

# USAGE - process_lidar.sh <las file> <las image> <las split size in MB> <result dir> <lidar height adjust> <source EPSG>

lidar=$1
lidar_image=$2
split_size=$3
result_dir=$4
height_adjust=$5
epsg=$6
filename=$(basename $lidar .las)
result_dir=$result_dir/$filename
mkdir $result_dir

echo "splitting las file"
#rm tmp $result_dir $result_dir/tiles.txt -R >/dev/null 2>&1;mkdir -p tmp $result_dir
rm -r tmp  >/dev/null 2>&1;mkdir -p tmp $result_dir
las2las --split-mb $split_size $lidar -o tmp/$filename
rename 's/\d+/sprintf("%04d",$&)/e' tmp/$filename-*

# process each file
for file in tmp/$filename-*.las; do
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
    node RTC.js tmp/p.txt tmp/c.txt $result_dir/$case $height_adjust
    
done
./make_tileset.sh $filename $result_dir
rm tmp -R

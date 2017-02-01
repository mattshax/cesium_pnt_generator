#!/bin/bash

#Usage ./make_tileset.sh FOLDER_NAME
json_file=$1
pnts_dir=$2

rm $pnts_dir/subtileset.json*;rm  $pnts_dir/tileset.json

for file in $pnts_dir/$json_file-*.json;do
	cat $file |tail -n +8 |sed  -e '$d' >> $pnts_dir/subtileset.json
	echo ',' >> $pnts_dir/subtileset.json
done
sed -i  -e '$d'  $pnts_dir/subtileset.json
echo ' {
"asset" : {
"version": "0.0"
	},
	"geometricError": 10000,
	"refine": "add",
	"root":' >  $pnts_dir/tileset.json

head -n 8  $pnts_dir/subtileset.json  >>  $pnts_dir/tileset.json
echo '		"children":[
		{' >>  $pnts_dir/tileset.json
tail -n +13 $pnts_dir/subtileset.json >>  $pnts_dir/tileset.json
echo '		]
	}
}' >>  $pnts_dir/tileset.json

rm $pnts_dir/subtileset.json-e

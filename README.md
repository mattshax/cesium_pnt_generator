# Cesium 3D-Tiles Prototype Point Cloud Converter

This set of node.js and shell scripts converts las lidar data into Cesium 3d-tiles binary .pnts files based on the prototype 3d-tiles specification outlined at [this link](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/TileFormats/Points).

* * *

#### View Pregenerated Point Cloud Data

Sample lidar .las and .tif data of Autzen Stadium in Eugene, OR have been preprocessed into Cesium 3d-tiles. The lidar dataset is courtesy of [liblas](http://www.liblas.org/samples/).

To view these 3d pointcloud tiles, clone the repository, install required npm modules and start the viewer: 

```
git clone 
cd cesium_pnt_generator/viewer
npm install
npm start
```

Navigate to [http://localhost:3000/](http://localhost:3000/) to view the newly generated Cesium point cloud data.

You should see something similar to below:

![](https://raw.githubusercontent.com/mattshax/cesium_pnt_generator/master/screenshots/1.png =250x) | ![](https://raw.githubusercontent.com/mattshax/cesium_pnt_generator/master/screenshots/2.png =250x) |
![](https://raw.githubusercontent.com/mattshax/cesium_pnt_generator/master/screenshots/3.png =250x) | ![](https://raw.githubusercontent.com/mattshax/cesium_pnt_generator/master/screenshots/4.png =250x)

* * *

#### Generate Cesium Pnts Tiles from LAS Data

Please note these .pnts file generation scripts have only been tested on Ubuntu 14.04.

Clone the repository and install the required npm modules:

```
git clone 
cd viewer
npm install
```

Install liblas-bin from the aptitude repository - this is needed to split and transform the las data:

```
sudo apt-get install liblas-bin
```

Pull down sample lidar .las and .tif data (178 MB) of Autzen Stadium in Eugene, OR.

```
wget https://s3-us-west-2.amazonaws.com/s3.parallel.works/sample_lidar_data.tgz
tar -xzvf sample_lidar.tgz
```

Process the lidar data into Cesium 3d-tile .pnts files by running the commands below. This script splits the lidar file into smaller las chunks places the generated pnts files into a new "tiles" directory. 

```
# USAGE - process_lidar.sh <las file> <las image> <las split size in MB> <result dir> <lidar height adjust>

./process_lidar.sh stadium_all.las image.tif 15 viewer/data -20
```

To view the newly generated 3d-tile .pnts files in a Cesium viewer, start the Cesium viewer with the commands below:

```
cd viewer
npm install
npm start
```

Navigate to [http://localhost:3000/](http://localhost:3000/) to view the newly generated Cesium point cloud data.

* * *

#### Copyright & License

The MIT License (MIT)

Copyright (c) 2015 - Matthew Shaxted

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


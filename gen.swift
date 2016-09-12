# swift script to process lidar las data to cesium binary points
type file;

# inputs / outputs
file las <arg("las","sample_inputs/stadium_all.las")>;
file img <arg("img","sample_inputs/image.tif")>;
string split_size = arg("split_size","10");
string epsg = arg("epsg","2994");
string height_adjust = arg("height_adjust","-20");

file[] utils <filesys_mapper;location="utils",pattern="**/*">;

# app definitions
app (file[] las_splits,file time,file out,file err) splitLas (file las,string split_size,file[] utils) {
    bash "utils/splitLas.sh" @las split_size @time stdout=@out stderr=@err;
}

app (file out,file err) processPnts (file las_split,file lidar_image,file time,string epsg,string height_adjust,file[] utils) {
    bash "utils/processPnts.sh" @las_split @lidar_image @time epsg height_adjust stdout=@out stderr=@err;
}

# workflow functions

# split the las file
file[] las_splits <filesys_mapper;location="tmp">;
file time <"output/time.txt">;
file out <"logs/splitLas.out">;
file err <"logs/splitLas.err">;
(las_splits,time,out,err) = splitLas (las,split_size,utils);

# process the las files in parallel
foreach las_split,ls in las_splits {
    file sout       <strcat("logs/tiles/",regexp(regexp(filename(las_split),".las",".out"),"tmp/",""))>;
    file serr       <strcat("logs/tiles/",regexp(regexp(filename(las_split),".las",".err"),"tmp/",""))>;
    (sout,serr) = processPnts(las_split,img,time,epsg,height_adjust,utils);
}

# post process

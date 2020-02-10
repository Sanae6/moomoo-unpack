var fs = require("fs");
var bropack = require("browserify")();
var uglyboi = require("uglify-es");
var srcmap = require("source-map")
var exorcist = require("exorcist");
var vars = {};
function checkForFiles(){
    console.log("reading filesToNumbers.json")
    if(fs.existsSync("./moomoosrc/filesToNumbers.json")){
        vars.f2n = JSON.parse(fs.readFileSync("./moomoosrc/filesToNumbers.json"));
        vars.f2nk = Object.keys(vars.f2n);
        vars.f2nv = Object.values(vars.f2n);
        console.log("found and read it!")
    } else {
        console.error("filesToNumbers.json isn't there!!!");
        process.exit(1)
    }
    console.log("reading webpack-unbundled.json")
    if(fs.existsSync("./moomoosrc/webpack-unbundled.json")){
        vars.unbun = JSON.parse(fs.readFileSync("./moomoosrc/webpack-unbundled.json"));
        console.log("found and read this too!")
    }else {
        console.error("webpack-unbundled.json isn't there!!!");
        process.exit(1)
    }
}
function replaceSources(){
    console.log("replacing sources from unbundled webpack")
    for(var id of vars.f2nk){
        if (!fs.existsSync("./moomoosrc/"+vars.f2nv[parseInt(id)])) {
            console.error("missing file "+vars.f2n[parseInt(id)]+" now stopping");
            process.exit(1);
        }
        var s = {};
        s[`${vars.f2nv[parseInt(id)].substring("./moomoosrc/".length)}`] = fs.readFileSync("./moomoosrc/"+vars.f2nv[parseInt(id)]).toString();
        var minned = uglyboi.minify(s,{
            compress:true
        });
        vars.f2n[parseInt(id)] = {
            id:parseInt(id),
            source: minned.code,
            file:vars.f2nv[parseInt(id)]
        };
        vars.unbun[parseInt(id)].source = vars.f2n[parseInt(id)].source;
    }
    console.log("done replacing sources")
}
function generateSrcmap(){
    console.log("generating source map");
    var gen = new srcmap.SourceMapGenerator({
        file: "bundle.js",
        skipValidation: false
    });
    for(var i=0;i<vars.f2nk.length;i++) gen.addMapping(vars.f2nv[i],vars.unbun[i].source);
    fs.writeFileSync("./moomoosrc/repacked-bundle.js.map",gen.toString());
    console.log("done, written to ./moomoosrc/repacked-bundle.js.map");
}
function packSources(){
    console.log("bundling the source")
    fs.writeFileSync("./moomoosrc/webpack-reunbun.json", JSON.stringify(vars.unbun,null,4));
    fs.createReadStream("./moomoosrc/webpack-reunbun.json").pipe(bropack);
    console.log("ok")
    let exo = exorcist("./moomoosrc/repacked-bundle.js.map");
    console.log(exo)
    bropack.add([]).bundle().pipe(exo);
    exo.pipe(fs.createWriteStream("./moomoosrc/repacked-bundle.js"));
    console.log("packed and saved to ./moomoosrc/repacked-bundle.js");
}

checkForFiles();
replaceSources();
//generateSrcmap();
packSources();
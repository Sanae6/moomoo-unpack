var sup = require("child_process");
var request = require("request");
    beautify = require("js-beautify");
    path = require("path");
    srcmap = require("source-map");
    webunpack = require("webpack-unpack")
    fs= require('fs');
var unbun, map;
console.log("moomoo.io javascript downloader by Shana6");
console.log("downloading bundles")
request.get("http://moomoo.io/bundle.js",function(err,res,body){
    if (err) throw err;
    unbun = webunpack(body);
    request.get("http://moomoo.io/bundle.js.map",{json:true},(err,res,body)=>{
        if (err) throw err;
        map = JSON.stringify(body)
        console.log("done downloading")
        main();
    });
})

function main(){
    srcmap.SourceMapConsumer.with(map,null,async(consumer)=>{
        console.log("creating folder structure");
        var sourceFolders = [];
        var sourceFiles = [];
        var fileToMap = {};
        for(var srcLocUn of consumer.sources){
            var srcLoc = srcLocUn.slice(11);//11 for folder 17 for website
            if (srcLoc.includes("dsoa") || srcLoc.includes("bootstrap")) continue;//these ruin the thing or whatever idk also bootstrap isnt even worth anything
            sourceFiles.push(srcLoc);
            if(srcLoc.endsWith(".js")){
                var l = srcLoc.lastIndexOf('/')
                srcLoc = srcLoc.slice(0,l);
            }
            sourceFolders.push(srcLoc);
        }
        sourceFolders = sourceFolders.filter(function(elem, index, self) {
            return index === self.indexOf(elem);
        })
        for(var srf of sourceFolders){
            var pat = [__dirname,"moomoosrc"];
            for(var s of srf.split('/')) pat.push(s);
            fs.mkdirSync(path.join.apply(this,pat),{recursive:true});
        }
        console.log("done creating folders");
        
        console.log("now saving source to ./moomoosrc");
        for(var sf of sourceFiles){
            var pat = [__dirname,"moomoosrc"];
            for(var s of sf.split('/'))pat.push(s);
            var pathe = path.join.apply(this,pat);
            var found = consumer.sources.find((value)=>{
                return value.includes(pat.slice(2).join("/"));
            })
            fs.writeFileSync(pathe,beautify.js_beautify(unbun[consumer.sources.indexOf(found)-1].source,{
                indent_with_tabs: true
            }));
            fileToMap[sourceFiles.indexOf(sf)] = sf;
        }
        console.log("done saving source");
        console.log("writing a file to number map (used for occurences of require(<number>) in files)")
        fs.writeFileSync("./moomoosrc/filesToNumbers.json",JSON.stringify(fileToMap));
        console.log("done, saved in ./moomoosrc/filesToNumbers.json, exiting.")
    })
}
#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); 
	// http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

var url2file = function(url, checks) {
    rest.get(url).on('complete', function(result) {
	if (result instanceof Error) {
	    console.error('Error: ' + result.message);
	} else {
	    var html_file = fs.writeFileSync(__dirname + '/downloaded.html', result);
	    // console.log('URL downloaded and saved (temporarily)...');
	    check_file(__dirname+'/downloaded.html', checks);
	}
    });
};

var check_file = function(file_name, checks) {
    var checkJson = checkHtmlFile(file_name, checks);
    fs.exists(__dirname+'/downloaded.html', function(exists) {
	if (exists) {
	  fs.unlink(__dirname+'/downloaded.html', function(err) {
	      if (err) {
                  console.log('Could not delete downloaded html file. Should be rm\'d manually...');
                  throw err;
	      } else {
		  // console.log('Removed downloaded html file...');
	      }
          });
	}
    });
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
}

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <file_url>', 'URL of html file', URL_DEFAULT)
        .parse(process.argv);
    if (program.url == "") {
	//var checkJson = checkHtmlFile(program.file, program.checks);
	check_file(program.file, program.checks);
    } else {
	url2file(program.url, program.checks);
	/*var checkJson = checkHtmlFile(__dirname+'/downloaded.html', program.checks);
	fs.unlink(__dirname+'/downloaded.html', function(err) {
	    if (err) {
		console.log('Could not delete downloaded html file. Should be rm\'d manually...');
		throw err;
	    }
	});*/
    }
    /*
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);*/
} else {
    exports.checkHtmlFile = checkHtmlFile;
}

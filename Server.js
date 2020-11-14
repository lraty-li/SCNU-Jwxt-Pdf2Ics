let Json2Array = require("./JSON2Array")
let fs = require('fs'),
    PDFParser = require("pdf2json");

;
const http = require("http");
const app = http.createServer();
const formidable = require("formidable");
const path = require("path");
var PDF_Path = "";
var JsonPath = "";
var uURL = "http://module.scnu.edu.cn/api.php?op=jw_date";
var PdfArray = [];

fs.exists("UserUpLoadFile", function(exists) {
    if(!exists)fs.mkdirSync(`UserUpLoadFile`);
});



app.on("request", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    let pdfParser = new PDFParser();
    pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError));


    //向教务处请求当前教学周
    const ReqCurrTeachinngWeek = http.request(uURL, (respone) => {
        respone.setEncoding('utf8');
        respone.on('data', (chunk) => {
            PdfArray.push(chunk);
        });
        respone.on('end', () => {
            res.end(JSON.stringify({
                PdfArray
            }));
            fs.unlink(PDF_Path, (err => {}));
            fs.unlink(JsonPath, (err => {}));
        });
        respone.on('error', (e) => {
            throw e.message;
        });
    });


    //pdf转json的事件
    pdfParser.on("pdfParser_dataReady", pdfData => {
        fs.writeFileSync(JsonPath, JSON.stringify(pdfData), (err) => {
            if (err) throw err;
        });

        //transfer Json file to Array
        try {
            PdfArray = Json2Array(JsonPath);
        } catch (e) {
            res.end(JSON.stringify({
                "msg": e.toString()
            }))
        }
        ReqCurrTeachinngWeek.end();

    });

    var form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.uploadDir = path.join(__dirname, "UserUpLoadFile");
    form.multiples = false;

    if (req.method === "POST") {

        form.parse(req, function (err, fields, files) {
            var FilesDic = JSON.parse(JSON.stringify(files));
            /*            if(FilesDic['FileForm']['type']!=="application/pdf")
                        {
                            var NotPdfMsg=JSON.stringify({"msg":"并不是pdf文件"});
                            res.writeHead(500);
                            console.log(NotPdfMsg)
                            res.end("NotPdfMsg");
                            return console.log("not pdf file");
                        }*/

            PDF_Path = files["FileForm"]["path"];
            JsonPath = PDF_Path + ".json";
            fs.readFile(PDF_Path, (err, pdfBuffer) => {
                if (!err) {
                    //genrate json file
                    pdfParser.loadPDF(PDF_Path);
                }
            })

        })
    }
})


app.listen(11451, () => {
    console.log("ok, server listening on 11451");
})




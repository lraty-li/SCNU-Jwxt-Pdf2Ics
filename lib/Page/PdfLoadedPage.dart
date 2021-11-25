import 'dart:convert';
import 'dart:io';

import 'package:enough_icalendar/enough_icalendar.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:scnu_jwxt_pdf2ics/tools/ButonBuilder.dart';
import 'package:scnu_jwxt_pdf2ics/tools/ThemedPage.dart';
import 'package:scnu_jwxt_pdf2ics/util/CourseData.dart';

import 'package:scnu_jwxt_pdf2ics/Page/ConverDonePage.dart';

import 'package:native_pdf_view/native_pdf_view.dart';

import 'package:scnu_jwxt_pdf2ics/util/Pdf.dart';
import 'package:scnu_jwxt_pdf2ics/tools/Classifier.dart';
import 'package:scnu_jwxt_pdf2ics/tools/IcalGenerator.dart';
import 'package:scnu_jwxt_pdf2ics/Page/ConvertingConfiguration.dart';

class PdfLoadedPage extends StatefulWidget {
  const PdfLoadedPage({Key? key}) : super(key: key);
  static const routeName = "PdfLoadedPage";

  @override
  _PdfLoadedPageState createState() => _PdfLoadedPageState();
}

class _PdfLoadedPageState extends State<PdfLoadedPage> {
  bool _buttonsEnabled = true;
  String _progressHintText = "准备就绪";

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    super.dispose();
  }

  Future<void> _previewPdf() async {
    //main界面选择pdf，作为路由参数
    // final _pdfFilePath = ModalRoute.of(context)!.settings.arguments;
    final _pdfFilePath = ModalRoute.of(context)!.settings.arguments;
    final pdfController = PdfController(
      document: PdfDocument.openFile("$_pdfFilePath"),
    );

    Widget pdfView() => PdfView(
          controller: pdfController,
        );

    Navigator.of(context)
        .push(MaterialPageRoute(builder: (context) => pdfView()));
  }

  Future _progressPdf() async {
    final _pdfFilePath = ModalRoute.of(context)!.settings.arguments;
    PDFDoc _pdfDoc = await PDFDoc.fromPath("$_pdfFilePath");

    setState(() {
      _buttonsEnabled = false;
      _progressHintText = "提取pdf数据...(1/3)";
    });

    String pdfRawData = await _pdfDoc.text;

    pdfRawData = pdfRawData.replaceAll("\n", "");
    //去掉最后一个逗号，避免解析出问题
    pdfRawData = pdfRawData.substring(0, pdfRawData.length - 1);
    pdfRawData = "[$pdfRawData]";
    var textJson = jsonDecode(pdfRawData); //List<Map<dynamic, dynamic>>

    setState(() {
      _progressHintText = "整理课程数据...(2/3)";
    });
    Classifier dataClassifier = new Classifier();
    IcalGenerator icalGenerator = new IcalGenerator();
    //整理数据
    ClassifiedPdfData pdfFileData = dataClassifier.classify(textJson);
    setState(() {
      _progressHintText = "生成ics文件...(3/3)";
    });
    //生成ical
    VCalendar calendar = icalGenerator.generate(pdfFileData);

    //保存文件
    String dir = (await getApplicationDocumentsDirectory()).path;
    String icsPath = '$dir/${pdfFileData.fileInfo['Semester']}.ics';
    File icalFile = new File('$icsPath');

    icalFile.writeAsStringSync(calendar.toString());

    setState(() {
      _progressHintText = "完成！";
      _buttonsEnabled = true;
    });
    //ics文件路径放入路由参数,跳转
    Navigator.pushNamed(context, ConverDonePage.routeName, arguments: icsPath);
  }

  @override
  Widget build(BuildContext context) {
    var _scaffold = Scaffold(
      body: ConstrainedBox(
        constraints: BoxConstraints(minWidth: double.infinity),
        child: Center(
          child: SingleChildScrollView(
            reverse: true,
            child: Column(
              // mainAxisSize: MainAxisSize.max,
              // mainAxisAlignment: MainAxisAlignment.center,
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                //Logo，去除语义
                Semantics(
                  value: "点击预览pdf",
                  child: ElevatedButton(
                    onPressed: _buttonsEnabled ? _previewPdf : null,
                    child: Column(
                      children: [
                        Stack(
                          alignment: Alignment.bottomRight,
                          children: [
                            Image(
                                fit: BoxFit.contain,
                                height: 150,
                                image: AssetImage('images/PDF.png')),
                            Icon(
                              Icons.task_alt,
                              size: 50,
                              color: Colors.lightGreen,
                            ),
                          ],
                        ),
                        Text("点击预览pdf"),
                      ],
                    ),
                  ),
                ),

                ConvertingConstruction(),
                Text(_progressHintText),
                RoundButton(
                  onPressed: _buttonsEnabled ? _progressPdf : null,
                  text: "Read whole document",
                  textFontSize: 25,
                  icon: Icons.transform,
                  iconSize: 30,
                ),
              ],
            ),
          ),
        ),
      ),
    );

    return ThemedPage(
      appContent: _scaffold,
    );
  }
}

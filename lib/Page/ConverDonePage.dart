import 'package:flutter/material.dart';
import 'package:scnu_jwxt_pdf2ics/tools/ButonBuilder.dart';
import 'package:scnu_jwxt_pdf2ics/tools/ShareFile.dart';
import 'package:open_file/open_file.dart';
import 'package:scnu_jwxt_pdf2ics/tools/ThemedPage.dart';


class ConverDonePage extends StatefulWidget {
  static const routeName = "ConverDonePage";
  const ConverDonePage({Key? key}) : super(key: key);

  @override
  _ConverDonePageState createState() => _ConverDonePageState();
}

class _ConverDonePageState extends State<ConverDonePage> {
  Future<void> _shareIcs() async {
    await shareFile(context, "${ModalRoute.of(context)!.settings.arguments}");
  }

  void _openFile() async {
    final _result = await OpenFile.open(
        "${ModalRoute.of(context)!.settings.arguments}",
        type: "text/calendar",
        uti: "text/calendar");
    print(_result.message);
  }

  @override
  Widget build(BuildContext context) {
    var _scaffold = Scaffold(
      body: ConstrainedBox(
        constraints: BoxConstraints(minWidth: double.infinity),
        child: Column(
          mainAxisSize: MainAxisSize.max,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            //Logo，去除语义
            Stack(
              alignment: Alignment.bottomRight,
              children: [
                Image(
                    fit: BoxFit.contain,
                    height: 150,
                    image: AssetImage('images/ICAL.png')),
                Icon(
                  Icons.task_alt,
                  size: 50,
                  color: Colors.lightGreen,
                ),
              ],
            ),
            Text("完成!"),

            Padding(
                padding: const EdgeInsets.fromLTRB(0, 50, 0, 0),
                child: RoundButton(
                  onPressed: _shareIcs,
                  text: "分享日历文件",
                  textFontSize: 25,
                  icon: Icons.share,
                  iconSize: 30,
                )),

            Padding(
              padding: const EdgeInsets.fromLTRB(0, 50, 0, 0),
              child: RoundButton(
                onPressed: _openFile,
                text: "打开（导入）日历文件",
                textFontSize: 25,
                icon: Icons.event,
                iconSize: 30,
              ),
            ),
          ],
        ),
      ),
    );
    return ThemedPage(appContent: _scaffold,);
  }
}

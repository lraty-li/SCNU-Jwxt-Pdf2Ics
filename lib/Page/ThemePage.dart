import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:scnu_jwxt_pdf2ics/util/ThemeStat.dart';



class ThemePage extends StatefulWidget {
    static const routeName="ThemePage";
  const ThemePage({Key? key}) : super(key: key);

  @override
  _ThemePageState createState() => _ThemePageState();
}

class _ThemePageState extends State<ThemePage> {
  //TODO 遵循material 深色
  @override
  Widget build(BuildContext context) {
    Widget _scaffold = Scaffold(
        appBar: AppBar(
          centerTitle: true,
          title: Text("主题与夜间模式"),

          // titleTextStyle:TextStyle(fontSize: 30)
        ),
        body: Row(
          children: [
            ElevatedButton(
                onPressed: () {
                  var themeData = context.read<ThemeState>();
                  themeData.changeThemeData(
                      1, ThemeData(brightness: Brightness.dark));
                },
                child: Text("Switch black")),
            ElevatedButton(
                onPressed: () {
                  var themeData = context.read<ThemeState>();
                  themeData.changeThemeData(
                      0, ThemeData(brightness: Brightness.light));
                },
                child: Text("Switch white")),
            ElevatedButton(
                onPressed: () {
                  var themeData = context.read<ThemeState>();
                  themeData.changeThemeData(2, ThemeData.dark());
                },
                child: Text("follow System")),
          ],
        ));

    return Consumer<ThemeState>(
      builder: (context, themeStat, child) => MaterialApp(
        home: _scaffold,
        theme: themeStat.themeDataLight,
        darkTheme: themeStat.themeDataDark,
        themeMode: themeStat.themeMode,
      ),
    );
  }
}

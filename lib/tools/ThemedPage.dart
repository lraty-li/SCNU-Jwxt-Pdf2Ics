// import 'package:flutter/cupertino.dart';

import 'package:flutter/material.dart';
import 'package:scnu_jwxt_pdf2ics/util/ThemeStat.dart';
import 'package:provider/provider.dart';


class ThemedPage extends StatelessWidget {
  const ThemedPage({Key? key, required this.appContent}) : super(key: key);
  final Widget appContent;

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeState>(
      builder: (context, themeStat, child) => MaterialApp(
        //显示语义
        // showSemanticsDebugger: true,
        home: appContent,
        theme: themeStat.themeDataLight,
        darkTheme: themeStat.themeDataDark,
        themeMode: themeStat.themeMode,
      ),
    );
  }
}

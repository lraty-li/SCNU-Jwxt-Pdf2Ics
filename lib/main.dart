import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:scnu_jwxt_pdf2ics/tools/ButonBuilder.dart';
import 'package:scnu_jwxt_pdf2ics/tools/ThemedPage.dart';
import 'package:scnu_jwxt_pdf2ics/util/ConvertingConfigurationData.dart';
import 'package:provider/provider.dart';

import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

import 'ExpandableFab.dart';
// import 'Page/SettingPage.dart';
// import 'Page/ConvertingConfiguration.dart';
import 'Page/ConverDonePage.dart';
import 'Page/ThemePage.dart';
import 'Page/PdfLoadedPage.dart';
import 'util/ThemeStat.dart';

//TODO 接受外部intent

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations(
    [
      //强制竖屏
      DeviceOrientation.portraitUp,
      DeviceOrientation.portraitDown,
    ],
  );
  ConvertingConfigurationData.loadPreference().then((e) => runApp(MyApp()));
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ProviderWrapper(
      child: MaterialApp(
        home: MainPage(),
        routes: {
          PdfLoadedPage.routeName: (BuildContext context) => PdfLoadedPage(),
          ConverDonePage.routeName: (BuildContext context) => ConverDonePage(),
          ThemePage.routeName: (BuildContext context) => ThemePage()
        },

        //多语言
        localizationsDelegates: [
          AppLocalizations.delegate,
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        supportedLocales: [
          Locale.fromSubtags(languageCode: 'zh'), // generic Chinese 'zh'
          Locale.fromSubtags(languageCode: 'en'), // generic Chinese 'zh'
          Locale.fromSubtags(
              languageCode: 'zh',
              scriptCode: 'Hans'), // generic simplified Chinese 'zh_Hans'
          Locale.fromSubtags(
              languageCode: 'zh_Hant',
              scriptCode: 'Hant'), // generic traditional Chinese 'zh_Hant'
          Locale.fromSubtags(
              languageCode: 'zh',
              scriptCode: 'Hans',
              countryCode: 'CN'), // 'zh_Hans_CN'
          Locale.fromSubtags(
              languageCode: 'zh_Hant',
              scriptCode: 'Hant',
              countryCode: 'TW'), // 'zh_Hant_TW'
          Locale.fromSubtags(
              languageCode: 'zh_Hant',
              scriptCode: 'Hant',
              countryCode: 'HK'), // 'zh_Hant_HK'
        ],
      ),
    );
  }
}

class ProviderWrapper extends StatelessWidget {
  final Widget child;
  ProviderWrapper({required this.child});

  @override
  Widget build(BuildContext context) {
    final initColorMode = 0; //初始 Light

    return MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (BuildContext context) =>
              ThemeState(initColorMode, ThemeMode.light),
        ),
      ],
      child: child,
    );
  }
}

@immutable
class MainPage extends StatelessWidget {
  const MainPage({Key? key}) : super(key: key);

  void _pushRoute(BuildContext context, String routeName) {
    // showDialog<void>(
    //   context: context,
    //   builder: (context) {
    //     return AlertDialog(
    //       content: Text("Hi"),
    //       actions: [
    //         TextButton(
    //           onPressed: () => Navigator.of(context).pop(),
    //           child: const Text('CLOSE'),
    //         ),
    //       ],
    //     );
    //   },
    // );
    Navigator.pushNamed(context, routeName);
  }

  Future<void> _pickFile(BuildContext context) async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: [
        'pdf',
      ],
    );
    if (result != null) {
      var _path = result.files.single.path;
      print("path is $_path");
      //pdf 路径放入路由参数
      Navigator.pushNamed(context, PdfLoadedPage.routeName, arguments: _path);
    } else {
      // chose fail or do nothing?
      //todo
    }
  }

  @override
  Widget build(BuildContext context) {
    //读取本地化
    ConvertingConfigurationData.loadLocalization(context);

    const double _iconSize = 40;

    var _scaffold = Scaffold(
        body: ConstrainedBox(
          constraints: BoxConstraints(minWidth: double.infinity),
          child: Column(
            mainAxisSize: MainAxisSize.max,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              //Logo，去除语义
              ExcludeSemantics(
                child: Row(
                  mainAxisSize: MainAxisSize.max,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Image(
                        fit: BoxFit.contain,
                        height: 150,
                        image: AssetImage('images/PDF.png')),
                    Icon(Icons.east, size: 50),
                    Image(
                        fit: BoxFit.contain,
                        width: 150,
                        image: AssetImage('images/ICAL.png')),
                  ],
                ),
              ),
              // padding: const EdgeInsets.fromLTRB(0, 200, 0, 0),
              Padding(
                padding: const EdgeInsets.fromLTRB(0, 200, 0, 0),
                child: RoundButton(
                  onPressed: () => {_pickFile(context)},
                  text: AppLocalizations.of(context)!.start,
                  textFontSize: 25,
                  icon: Icons.folder_open,
                  iconSize: 30,
                ),
              ),
            ],
          ),
        ),
        floatingActionButton: Semantics(
          value: "菜单按钮",
          child: ExpandableFab(
            //最大弹出元素高度
            distance: 300.0,
            children: [
              ActionButton(
                onPressed: () => _pushRoute(context, ThemePage.routeName),
                icon: Icons.g_translate,
                iconSize: _iconSize,
                text: "语言",
              ),
              ActionButton(
                onPressed: () => _pushRoute(context, ThemePage.routeName),
                icon: Icons.dark_mode,
                iconSize: _iconSize,
                text: "主题",
              ),
              ActionButton(
                onPressed: () => _pushRoute(context, ThemePage.routeName),
                icon: Icons.code,
                iconSize: _iconSize,
                text: "关于",
              ),
            ],
          ),
        ));

    return ThemedPage(
      appContent: _scaffold,
    );
  }
}

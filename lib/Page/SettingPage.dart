import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:scnu_jwxt_pdf2ics/Page/ThemePage.dart';
import 'package:scnu_jwxt_pdf2ics/util/ThemeStat.dart';

class _Item {
  _Item({
    required this.title,
    required this.icon,
  });
  final String title;
  final IconData icon;
}

class SettigPage extends StatelessWidget {
  static const routeName="SettigPage";
  final List options = [
    ["语言", Icons.g_translate],
    ["主题与深色模式", Icons.dark_mode],
    ["项目地址", Icons.code]
  ];

  //list item
  late final List<_Item> listItems = [];

  @override
  Widget build(BuildContext context) {
    options.forEach((element) {
      listItems.add(_Item(title: element[0], icon: element[1]));
    });

    var _settingScaffold = Scaffold(
      appBar: AppBar(
          centerTitle: true,
          title: Text("设置"),
          titleTextStyle: TextStyle(fontSize: 25)),
      body: _buildSettingListView(),
    );
    return Consumer<ThemeState>(
      builder: (context, themeStat, child) => MaterialApp(
        home: _settingScaffold,
        theme: themeStat.themeDataLight,
        darkTheme: themeStat.themeDataDark,
        themeMode: themeStat.themeMode,
        routes: {
          "ThemePage": (BuildContext context) => ThemePage(),
        },
      ),
    );
  }

  Widget _buildSettingListView() {
    return ListView.separated(
        itemCount: listItems.length,
        itemBuilder: (context, i) {
          return _buildRow(listItems[i], context);
        },
        separatorBuilder: (context, i) {
          return Divider();
        },
        padding: const EdgeInsets.all(16.0));
  }

  Widget _buildRow(_Item item, BuildContext context) {
    return ListTile(
      title: Text(
        item.title,
        // style: _biggerFont,
      ),
      leading: Icon(item.icon),
      onTap: () {
        Navigator.pushNamed(context, "ThemePage");
      },
    );
  }
}

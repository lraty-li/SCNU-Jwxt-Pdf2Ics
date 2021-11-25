import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

//主题工具类
class ThemeState extends ChangeNotifier {
  ThemeData _themeDataLight = ThemeData(
    brightness: Brightness.light,
  );
  ThemeData _themeDataDark = ThemeData(
// MaterialStateProperty.all<Color>(Colors.blueGrey.shade600)

    elevatedButtonTheme: ElevatedButtonThemeData(
        style: ButtonStyle(
            foregroundColor: MaterialStateProperty.resolveWith<Color>((Set<MaterialState> states) {
      if (states.contains(MaterialState.disabled))
        return Colors.white60;
      return Colors.white;
    }), backgroundColor: MaterialStateProperty.resolveWith<Color>(
                (Set<MaterialState> states) {
      if (states.contains(MaterialState.disabled))
        return Colors.blueGrey.shade800;
      return Colors.blueGrey.shade600;
    }))),
    brightness: Brightness.dark,
  );
  ThemeMode _themeMode;

  // 0 light
  // 1 dark
  // 2 fllow system
  int _colorMode;

  ThemeState(this._colorMode, this._themeMode);

  void changeThemeData(int colorMode, ThemeData themeData) {
    _colorMode = colorMode;
    // var isDarkMode = _colorMode < 1;
    switch (colorMode) {
      case 0:
        {
          _themeMode = ThemeMode.light;
        }
        break;
      case 1:
        {
          _themeMode = ThemeMode.dark;
        }
        break;
      case 2:
        {
          _themeMode = ThemeMode.system;
        }
        break;
    }

    // _themeData = themeData;
    notifyListeners();
  }

  int get colorMode => _colorMode; //获取颜色索引
  ThemeMode get themeMode => _themeMode; //获取颜色索引
  ThemeData get themeDataLight => _themeDataLight;
  ThemeData get themeDataDark => _themeDataDark;
}

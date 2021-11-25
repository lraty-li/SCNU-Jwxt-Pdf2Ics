
import 'package:flutter/services.dart';

class NumericalRangeFormatter extends TextInputFormatter {
  //自定义过滤器
  final int max;

  NumericalRangeFormatter({required this.max});

  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    if (newValue.text == '') {
      return newValue;
    }

    try {
      int.parse(newValue.text);
    } catch (e) {
      return oldValue;
    }
    int newValueInt = int.parse(newValue.text);
    if (newValueInt > max) {
      return oldValue;
    } else {
      return newValue;
    }
  }
}
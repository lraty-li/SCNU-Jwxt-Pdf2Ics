import 'package:http/http.dart' as http;

Future<int> fetchAlbum() async {
  //TODO log界面
  // var logger = Logger();
  final response =
      await http.get(Uri.parse('http://module.scnu.edu.cn/api.php?op=jw_date'));
  RegExp reg = new RegExp(r"&nbsp;\d+&nbsp;");
  RegExp regInt = new RegExp(r"\d+");

  if (response.statusCode == 200) {
    // If the server did return a 200 OK response,
    // then parse the JSON.
    // TODO 未知假期返回值
    // pref 加载设定超时，超时就设置默认值。
    // 该fetch也是，超时返回-1
    String? result = reg.firstMatch(response.body)?.group(0);
    result = regInt.firstMatch("$result")?.group(0);
    if (result == null) {
      print("fetch current week fail");
      return -1;
    } else {
      int week = int.parse(result);
      return week;
    }
  } else {
    // If the server did not return a 200 OK response,
    // then throw an exception.
    throw Exception('Failed to load current week');
  }
}
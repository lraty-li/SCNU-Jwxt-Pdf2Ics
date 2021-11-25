import 'package:flutter/cupertino.dart';
import 'package:share_plus/share_plus.dart';

Future<bool> shareFile(BuildContext context,String fileNamePath) async {
  final box = context.findRenderObject() as RenderBox?;
  await Share.shareFiles(['$fileNamePath'],
      sharePositionOrigin: box!.localToGlobal(Offset.zero) & box.size);
  return true;
}

